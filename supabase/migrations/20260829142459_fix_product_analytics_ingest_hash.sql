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

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended('dse-product-analytics-ingest-v1', 0)
  );

  if exists (
    select 1
    from private.product_events as existing
    where existing.event_id = p_event_id
  ) then
    return true;
  end if;

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
