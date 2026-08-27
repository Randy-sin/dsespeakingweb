create schema if not exists private;

create table if not exists private.ai_rate_limit_windows (
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null check (action in ('assessment', 'teammate', 'transcription')),
  window_started_at timestamptz not null,
  request_count integer not null check (request_count >= 1),
  primary key (user_id, action)
);

alter table private.ai_rate_limit_windows enable row level security;
revoke all on table private.ai_rate_limit_windows from public, anon, authenticated;

create or replace function public.consume_ai_rate_limit(p_action text)
returns table (
  allowed boolean,
  retry_after_seconds integer,
  remaining integer
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid := auth.uid();
  v_is_anonymous boolean := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);
  v_limit integer;
  v_window_seconds integer := 600;
  v_now timestamptz := clock_timestamp();
  v_window_started_at timestamptz;
  v_request_count integer;
begin
  if v_user_id is null or v_is_anonymous then
    raise insufficient_privilege using message = 'Authenticated non-anonymous user required';
  end if;

  v_limit := case p_action
    when 'assessment' then 12
    when 'teammate' then 20
    when 'transcription' then 6
    else null
  end;

  if v_limit is null then
    raise invalid_parameter_value using message = 'Unsupported AI rate-limit action';
  end if;

  insert into private.ai_rate_limit_windows as limits (
    user_id,
    action,
    window_started_at,
    request_count
  ) values (
    v_user_id,
    p_action,
    v_now,
    1
  )
  on conflict (user_id, action) do update
  set
    window_started_at = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds) then v_now
      else limits.window_started_at
    end,
    request_count = case
      when limits.window_started_at <= v_now - make_interval(secs => v_window_seconds) then 1
      else limits.request_count + 1
    end
  returning limits.window_started_at, limits.request_count
  into v_window_started_at, v_request_count;

  allowed := v_request_count <= v_limit;
  remaining := greatest(v_limit - v_request_count, 0);
  retry_after_seconds := case
    when allowed then 0
    else greatest(
      1,
      ceil(extract(epoch from (v_window_started_at + make_interval(secs => v_window_seconds) - v_now)))::integer
    )
  end;

  return next;
end;
$$;

revoke all on function public.consume_ai_rate_limit(text) from public, anon;
grant execute on function public.consume_ai_rate_limit(text) to authenticated;

comment on function public.consume_ai_rate_limit(text) is
  'Atomically consumes a fixed per-user AI quota. Limits are server-owned and the backing table is private.';
