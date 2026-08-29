-- The learning site no longer serves meeting-room routes. Keep the historical
-- rows for private operational audit, but remove every client API capability.
revoke all on table public.rooms, public.room_members, public.marker_scores
  from public, anon, authenticated;

-- Policies are no longer part of the access model. Dropping all of them avoids
-- accidentally re-exposing data if a table grant is added in the future.
do $retire_legacy_rooms$
declare
  legacy_policy record;
  legacy_column_grant record;
begin
  -- Table-level REVOKE does not remove grants made directly on individual
  -- columns, including the compatibility SELECT grant from the earlier cutover.
  for legacy_column_grant in
    select table_schema, table_name, column_name, grantee, privilege_type
    from information_schema.column_privileges
    where table_schema = 'public'
      and table_name in ('rooms', 'room_members', 'marker_scores')
      and grantee in ('PUBLIC', 'anon', 'authenticated')
      and privilege_type in ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES')
  loop
    execute pg_catalog.format(
      'revoke %s (%I) on table %I.%I from %s',
      legacy_column_grant.privilege_type,
      legacy_column_grant.column_name,
      legacy_column_grant.table_schema,
      legacy_column_grant.table_name,
      case
        when legacy_column_grant.grantee = 'PUBLIC' then 'PUBLIC'
        else pg_catalog.format('%I', legacy_column_grant.grantee)
      end
    );
  end loop;

  for legacy_policy in
    select schemaname, tablename, policyname
    from pg_catalog.pg_policies
    where schemaname = 'public'
      and tablename in ('rooms', 'room_members', 'marker_scores')
  loop
    execute format(
      'drop policy if exists %I on %I.%I',
      legacy_policy.policyname,
      legacy_policy.schemaname,
      legacy_policy.tablename
    );
  end loop;
end;
$retire_legacy_rooms$;

comment on table public.rooms is
  'Retired meeting-room data retained privately; no anon or authenticated API access.';
comment on table public.room_members is
  'Retired meeting-room membership data retained privately; no client API access.';
comment on table public.marker_scores is
  'Retired meeting-room scoring data retained privately; no client API access.';
