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
