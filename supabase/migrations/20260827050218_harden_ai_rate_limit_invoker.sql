grant usage on schema private to authenticated;
grant select, insert, update on table private.ai_rate_limit_windows to authenticated;

create policy "ai_rate_limits_select_own"
on private.ai_rate_limit_windows
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "ai_rate_limits_insert_own"
on private.ai_rate_limit_windows
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "ai_rate_limits_update_own"
on private.ai_rate_limit_windows
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

alter function public.consume_ai_rate_limit(text) security invoker;
