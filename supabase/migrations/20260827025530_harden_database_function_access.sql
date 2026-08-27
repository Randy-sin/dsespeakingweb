-- Trigger functions do not need to be callable through the Data API.
-- Keep privileged maintenance callable by service_role only.
revoke execute on function public.set_updated_at() from public, anon, authenticated;
revoke execute on function public.finish_room_when_empty() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.sync_forum_post_meta() from public, anon, authenticated;
revoke execute on function public.cleanup_stale_room_members() from public, anon, authenticated;

grant execute on function public.cleanup_stale_room_members() to service_role;

-- Resolve object names from trusted schemas only.
alter function public.set_updated_at() set search_path = pg_catalog, public;
alter function public.finish_room_when_empty() set search_path = pg_catalog, public;
alter function public.handle_new_user() set search_path = pg_catalog, public;
alter function public.sync_forum_post_meta() set search_path = pg_catalog, public;
alter function public.cleanup_stale_room_members() set search_path = pg_catalog, public;
