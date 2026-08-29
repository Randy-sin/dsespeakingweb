create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_cron with schema pg_catalog;

create schema if not exists private;

create table if not exists private.analytics_settings (
  key text primary key,
  value_hash text not null check (value_hash ~ '^[0-9a-f]{64}$'),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint analytics_settings_known_key check (key in ('ingest_token_sha256'))
);

-- This is a one-way SHA-256 digest. The matching token stays in server-only
-- deployment configuration and is never exposed to the browser.
insert into private.analytics_settings (key, value_hash)
values (
  'ingest_token_sha256',
  '9f0be337f8cabd1e9acef6e368513701d1bf5c7d59d3a7df3f64e9a4ad19267f'
)
on conflict (key) do update set
  value_hash = excluded.value_hash,
  updated_at = timezone('utc', now());

create table if not exists private.analytics_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists private.product_events (
  event_id uuid primary key,
  occurred_at timestamptz not null default timezone('utc', now()),
  session_hash text not null check (session_hash ~ '^[0-9a-f]{64}$'),
  event_name text not null check (
    event_name in (
      'site_session_started',
      'primary_cta_clicked',
      'paper_opened',
      'practice_started',
      'preparation_started',
      'recording_started',
      'recording_completed',
      'recording_failed',
      'text_fallback_opened',
      'transcription_completed',
      'transcription_failed',
      'analysis_completed',
      'analysis_failed',
      'basic_coaching_delivered',
      'discussion_turn_completed',
      'discussion_completed',
      'auth_started',
      'auth_completed',
      'auth_failed',
      'onboarding_completed',
      'lesson_completed',
      'flow_error'
    )
  ),
  surface text check (
    surface in (
      'home',
      'onboarding',
      'papers',
      'learn',
      'practice',
      'auth'
    )
  ),
  mode text check (mode in ('group-discussion', 'individual-response')),
  context text check (
    context in (
      'hero',
      'navigation',
      'onboarding',
      'paper-library',
      'paper-detail',
      'lesson',
      'practice-picker',
      'practice-session',
      'feedback',
      'login',
      'register',
      'oauth-callback'
    )
  ),
  outcome text check (outcome in ('success', 'failure', 'cancelled', 'blocked')),
  input_source text check (input_source in ('voice', 'text-fallback')),
  error_code text check (
    error_code in (
      'permission-denied',
      'device-unavailable',
      'unsupported-browser',
      'recording-failed',
      'network-failed',
      'unauthorized',
      'rate-limited',
      'invalid-input',
      'transcription-failed',
      'analysis-failed',
      'discussion-failed',
      'auth-failed',
      'server-error',
      'unknown'
    )
  ),
  duration_bucket text check (duration_bucket in ('under-15s', '15-30s', '31-60s', '61-120s', 'over-120s')),
  latency_bucket text check (latency_bucket in ('under-1s', '1-3s', '3-10s', '10-30s', 'over-30s')),
  auth_state text check (auth_state in ('anonymous', 'authenticated')),
  content_id text check (
    content_id is null
    or content_id ~ '^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$'
  ),
  round integer check (round between 1 and 20),
  schema_version integer not null check (schema_version = 1)
);

create index if not exists product_events_occurred_at_idx
  on private.product_events (occurred_at desc);
create index if not exists product_events_session_occurred_idx
  on private.product_events (session_hash, occurred_at desc);
create index if not exists product_events_name_occurred_idx
  on private.product_events (event_name, occurred_at desc);

create table if not exists private.analytics_metadata (
  key text primary key,
  value_timestamp timestamptz not null,
  constraint analytics_metadata_known_key check (key in ('collection_started_at'))
);

-- Keep the first collection timestamp independently of the 90-day event
-- retention window so an empty period is not mistaken for a new install.
insert into private.analytics_metadata (key, value_timestamp)
select
  'collection_started_at',
  coalesce(min(occurred_at), timezone('utc', now()))
from private.product_events
on conflict (key) do nothing;

alter table private.analytics_settings enable row level security;
alter table private.analytics_admins enable row level security;
alter table private.product_events enable row level security;
alter table private.analytics_metadata enable row level security;

revoke all on schema private from public, anon, authenticated;
revoke all on table private.analytics_settings, private.analytics_admins, private.product_events,
  private.analytics_metadata
  from public, anon, authenticated;

create or replace function public.ingest_product_event(
  p_ingest_token text,
  p_event_id uuid,
  p_session_hash text,
  p_event_name text,
  p_surface text,
  p_mode text,
  p_context text,
  p_outcome text,
  p_input_source text,
  p_error_code text,
  p_duration_bucket text,
  p_latency_bucket text,
  p_auth_state text,
  p_content_id text,
  p_round integer,
  p_schema_version integer
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  expected_hash text;
begin
  if p_ingest_token is null or char_length(p_ingest_token) < 32 then
    return false;
  end if;

  select settings.value_hash
    into expected_hash
  from private.analytics_settings as settings
  where settings.key = 'ingest_token_sha256';

  if expected_hash is null
    or pg_catalog.encode(extensions.digest(p_ingest_token, 'sha256'), 'hex') <> expected_hash then
    return false;
  end if;

  if p_event_id is null
    or p_session_hash is null
    or p_session_hash !~ '^[0-9a-f]{64}$'
    or p_schema_version <> 1 then
    return false;
  end if;

  -- Serialize the small, privacy-minimized ingest stream so concurrent callers
  -- cannot race past the database circuit breakers.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('dse-product-analytics-ingest-v1', 0)
  );

  -- Retries of an accepted event stay idempotent even when a breaker is open.
  if exists (
    select 1
    from private.product_events as existing
    where existing.event_id = p_event_id
  ) then
    return true;
  end if;

  -- Bound accidental loops and deliberate event flooding without storing IP,
  -- user agent, referrer, or any other direct identifier.
  if (
    select count(*)
    from private.product_events as recent
    where recent.occurred_at >= timezone('utc', now()) - interval '5 minutes'
  ) >= 120 then
    return false;
  end if;

  if (
    select count(*)
    from private.product_events as recent
    where recent.session_hash = p_session_hash
      and recent.occurred_at >= timezone('utc', now()) - interval '5 minutes'
  ) >= 30 then
    return false;
  end if;

  insert into private.product_events (
    event_id,
    session_hash,
    event_name,
    surface,
    mode,
    context,
    outcome,
    input_source,
    error_code,
    duration_bucket,
    latency_bucket,
    auth_state,
    content_id,
    round,
    schema_version
  )
  values (
    p_event_id,
    p_session_hash,
    p_event_name,
    p_surface,
    p_mode,
    p_context,
    p_outcome,
    p_input_source,
    p_error_code,
    p_duration_bucket,
    p_latency_bucket,
    p_auth_state,
    p_content_id,
    p_round,
    p_schema_version
  )
  on conflict (event_id) do nothing;

  return true;
exception
  when check_violation or invalid_text_representation or string_data_right_truncation then
    return false;
end;
$$;

revoke all on function public.ingest_product_event(
  text, uuid, text, text, text, text, text, text,
  text, text, text, text, text, text, integer, integer
) from public, authenticated, service_role;
grant execute on function public.ingest_product_event(
  text, uuid, text, text, text, text, text, text,
  text, text, text, text, text, text, integer, integer
) to anon;

create or replace function public.get_product_analytics(p_days integer default 7)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  safe_days integer;
  window_start timestamptz;
  analytics jsonb;
begin
  if auth.uid() is null or not exists (
    select 1
    from private.analytics_admins as admins
    where admins.user_id = auth.uid()
  ) then
    raise exception 'Analytics access denied' using errcode = '42501';
  end if;

  safe_days := greatest(1, least(coalesce(p_days, 7), 90));
  window_start := (
    (timezone('Asia/Hong_Kong', now())::date - (safe_days - 1))::timestamp
    at time zone 'Asia/Hong_Kong'
  );

  with
  window_events as (
    select *
    from private.product_events
    where occurred_at >= window_start
  ),
  daily as (
    select
      day::date as day,
      count(events.event_id)::integer as events,
      count(distinct events.session_hash)::integer as sessions,
      count(distinct events.session_hash) filter (
        where events.event_name in (
          'transcription_completed',
          'analysis_completed',
          'discussion_turn_completed'
        )
          and events.outcome = 'success'
      )::integer as value_sessions,
      count(events.event_id) filter (
        where events.outcome = 'failure'
          or events.event_name in (
            'recording_failed',
            'transcription_failed',
            'analysis_failed',
            'auth_failed',
            'flow_error'
          )
      )::integer as failures
    from generate_series(
      (timezone('Asia/Hong_Kong', now())::date - (safe_days - 1))::timestamp,
      timezone('Asia/Hong_Kong', now())::date::timestamp,
      interval '1 day'
    ) as day
    left join window_events as events
      on events.occurred_at >= (day at time zone 'Asia/Hong_Kong')
      and events.occurred_at < ((day + interval '1 day') at time zone 'Asia/Hong_Kong')
    group by day
    order by day
  ),
  feature_usage as (
    select
      event_name,
      surface,
      mode,
      outcome,
      count(*)::integer as events,
      count(distinct session_hash)::integer as sessions
    from window_events
    group by event_name, surface, mode, outcome
    order by count(distinct session_hash) desc, count(*) desc, event_name
    limit 20
  ),
  failures as (
    select
      coalesce(error_code, event_name) as code,
      surface,
      count(*)::integer as events,
      count(distinct session_hash)::integer as sessions
    from window_events
    where outcome = 'failure'
      or event_name in (
        'recording_failed',
        'transcription_failed',
        'analysis_failed',
        'auth_failed',
        'flow_error'
      )
    group by coalesce(error_code, event_name), surface
    order by count(*) desc, code
    limit 20
  ),
  site_cohort as (
    select
      session_hash,
      min(occurred_at) as site_started_at
    from window_events
    where event_name = 'site_session_started'
    group by session_hash
  ),
  practice_cohort as (
    select
      site.session_hash,
      site.site_started_at,
      min(events.occurred_at) as practice_started_at
    from site_cohort as site
    left join window_events as events
      on events.session_hash = site.session_hash
      and events.event_name = 'practice_started'
      and events.occurred_at >= site.site_started_at
    group by site.session_hash, site.site_started_at
  ),
  recording_cohort as (
    select
      practice.session_hash,
      practice.site_started_at,
      practice.practice_started_at,
      min(events.occurred_at) as recording_completed_at
    from practice_cohort as practice
    left join window_events as events
      on events.session_hash = practice.session_hash
      and events.event_name = 'recording_completed'
      and events.occurred_at >= practice.practice_started_at
    group by practice.session_hash, practice.site_started_at, practice.practice_started_at
  ),
  value_cohort as (
    select
      recording.session_hash,
      recording.site_started_at,
      recording.practice_started_at,
      recording.recording_completed_at,
      min(events.occurred_at) as value_received_at
    from recording_cohort as recording
    left join window_events as events
      on events.session_hash = recording.session_hash
      and events.event_name in (
        'transcription_completed',
        'analysis_completed',
        'discussion_turn_completed'
      )
      and events.outcome = 'success'
      and events.occurred_at >= recording.recording_completed_at
    group by
      recording.session_hash,
      recording.site_started_at,
      recording.practice_started_at,
      recording.recording_completed_at
  ),
  funnel as (
    select *
    from (
      values
        (1, 'site_session_started', (
          select count(*)::integer
          from site_cohort
        )),
        (2, 'practice_started', (
          select count(*)::integer
          from practice_cohort
          where practice_started_at is not null
        )),
        (3, 'recording_completed', (
          select count(*)::integer
          from recording_cohort
          where recording_completed_at is not null
        )),
        (4, 'ai_value_received', (
          select count(*)::integer
          from value_cohort
          where value_received_at is not null
        ))
    ) as steps(position, step, sessions)
  )
  select jsonb_build_object(
    'periodDays', safe_days,
    'collectionStartedAt', (
      select value_timestamp
      from private.analytics_metadata
      where key = 'collection_started_at'
    ),
    'summary', jsonb_build_object(
      'events', (select count(*)::integer from window_events),
      'sessions', (select count(distinct session_hash)::integer from window_events),
      'engagedSessions', (
        select count(distinct session_hash)::integer
        from window_events where event_name = 'practice_started'
      ),
      'recordingSessions', (
        select count(distinct session_hash)::integer
        from window_events where event_name = 'recording_completed'
      ),
      'valueSessions', (
        select count(distinct session_hash)::integer
        from window_events
        where event_name in (
          'transcription_completed',
          'analysis_completed',
          'discussion_turn_completed'
        )
          and outcome = 'success'
      ),
      'errorSessions', (
        select count(distinct session_hash)::integer
        from window_events
        where outcome = 'failure'
          or event_name in (
            'recording_failed',
            'transcription_failed',
            'analysis_failed',
            'auth_failed',
            'flow_error'
          )
      )
    ),
    'daily', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'date', day,
          'events', events,
          'sessions', sessions,
          'valueSessions', value_sessions,
          'failures', failures
        ) order by day
      ) from daily
    ), '[]'::jsonb),
    'funnel', coalesce((
      select jsonb_agg(
        jsonb_build_object('step', step, 'sessions', sessions)
        order by position
      ) from funnel
    ), '[]'::jsonb),
    'features', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'event', event_name,
          'surface', surface,
          'mode', mode,
          'outcome', outcome,
          'events', events,
          'sessions', sessions
        ) order by sessions desc, events desc, event_name
      ) from feature_usage
    ), '[]'::jsonb),
    'failures', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'code', code,
          'surface', surface,
          'events', events,
          'sessions', sessions
        ) order by events desc, code
      ) from failures
    ), '[]'::jsonb),
    'historical', jsonb_build_object(
      'practiceSessions', (
        select count(*)::integer
        from public.practice_sessions
        where created_at >= window_start
      ),
      'completedPracticeSessions', (
        select count(*)::integer
        from public.practice_sessions
        where created_at >= window_start
          and status in ('recorded', 'transcribed', 'analyzed')
      ),
      'practiceTurns', (
        select count(*)::integer
        from public.practice_turns
        where created_at >= window_start
      ),
      'completedLessons', (
        select count(*)::integer
        from public.lesson_progress
        where completed_at >= window_start
      ),
      'onboardedLearners', (
        select count(*)::integer
        from public.learner_profiles
        where onboarding_completed = true
          and updated_at >= window_start
      )
    )
  ) into analytics;

  return analytics;
end;
$$;

revoke all on function public.get_product_analytics(integer) from public, anon, service_role;
grant execute on function public.get_product_analytics(integer) to authenticated;

create or replace function private.purge_old_product_events()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  deleted_rows integer;
begin
  delete from private.product_events
  where occurred_at < timezone('utc', now()) - interval '90 days';

  get diagnostics deleted_rows = row_count;
  return deleted_rows;
end;
$$;

revoke all on function private.purge_old_product_events() from public, anon, authenticated;

do $$
begin
  if not exists (
    select 1 from cron.job where jobname = 'purge-product-events-daily'
  ) then
    perform cron.schedule(
      'purge-product-events-daily',
      '17 3 * * *',
      'select private.purge_old_product_events();'
    );
  end if;
end;
$$;

comment on table private.product_events is
  'Privacy-minimized, content-free product events retained for 90 days.';
comment on function public.ingest_product_event(
  text, uuid, text, text, text, text, text, text,
  text, text, text, text, text, text, integer, integer
) is 'Server-gated ingestion for allowlisted, content-free product analytics events.';
comment on function public.get_product_analytics(integer) is
  'Admin-only aggregate product analytics; never returns raw events or user identities.';
