-- Supabase projects can grant newly-created public functions directly to API
-- roles through default privileges. Keep the aggregate endpoint authenticated
-- only; the function itself also checks the private admin allowlist.
revoke all on function public.get_product_analytics(integer)
  from public, anon, service_role;
grant execute on function public.get_product_analytics(integer)
  to authenticated;
