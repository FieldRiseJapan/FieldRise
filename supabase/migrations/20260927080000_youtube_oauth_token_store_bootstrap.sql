-- Shared YouTube refresh-token store bootstrap.
-- Ordered before 20260927084829_youtube_oauth_transactions.sql.
-- Existing relations are validated without rewriting rows or ACLs.

begin;
set local search_path = '';

do $bootstrap$
declare
  v_relation oid;
  v_created boolean := false;
  v_relation_kind "char";
  v_owner name;
  v_rls_enabled boolean;
  v_column_count integer;
  v_primary_key_count integer;
  v_policy_count integer;
  v_updated_at_default text;
  v_service_role oid;
  v_service_privileges text[];
begin
  v_relation := pg_catalog.to_regclass('public.youtube_oauth_tokens');

  if v_relation is null then
    create table public.youtube_oauth_tokens (
      id bigint not null,
      refresh_token text not null,
      updated_at timestamptz not null default pg_catalog.now(),
      constraint youtube_oauth_tokens_pkey primary key (id)
    );
    alter table public.youtube_oauth_tokens enable row level security;
    v_relation := pg_catalog.to_regclass('public.youtube_oauth_tokens');
    v_created := true;
  end if;

  select c.relkind, pg_catalog.pg_get_userbyid(c.relowner), c.relrowsecurity
    into v_relation_kind, v_owner, v_rls_enabled
  from pg_catalog.pg_class as c
  where c.oid = v_relation;

  if v_relation_kind is distinct from 'r' then
    raise exception 'youtube token store must be an ordinary table';
  end if;

  if v_owner is distinct from current_user then
    raise exception 'youtube token store owner must be the migration executor';
  end if;

  if not v_rls_enabled then
    raise exception 'youtube token store must have RLS enabled';
  end if;

  select pg_catalog.count(*)
    into v_column_count
  from pg_catalog.pg_attribute as a
  where a.attrelid = v_relation
    and a.attnum > 0
    and not a.attisdropped;

  if v_column_count <> 3
    or not exists (
      select 1 from pg_catalog.pg_attribute as a
      where a.attrelid = v_relation and a.attname = 'id'
        and a.atttypid = 'pg_catalog.int8'::pg_catalog.regtype and a.attnotnull
    )
    or not exists (
      select 1 from pg_catalog.pg_attribute as a
      where a.attrelid = v_relation and a.attname = 'refresh_token'
        and a.atttypid = 'pg_catalog.text'::pg_catalog.regtype and a.attnotnull
    )
    or not exists (
      select 1 from pg_catalog.pg_attribute as a
      where a.attrelid = v_relation and a.attname = 'updated_at'
        and a.atttypid = 'pg_catalog.timestamptz'::pg_catalog.regtype and a.attnotnull
    ) then
    raise exception 'youtube token store columns do not match the required contract';
  end if;

  select pg_catalog.pg_get_expr(d.adbin, d.adrelid)
    into v_updated_at_default
  from pg_catalog.pg_attrdef as d
  join pg_catalog.pg_attribute as a
    on a.attrelid = d.adrelid and a.attnum = d.adnum
  where d.adrelid = v_relation and a.attname = 'updated_at';

  if v_updated_at_default is distinct from 'now()' then
    raise exception 'youtube token store updated_at default must be now()';
  end if;

  select pg_catalog.count(*)
    into v_primary_key_count
  from pg_catalog.pg_constraint as con
  where con.conrelid = v_relation
    and con.contype = 'p'
    and pg_catalog.array_length(con.conkey, 1) = 1
    and con.conkey[1] = (
      select a.attnum from pg_catalog.pg_attribute as a
      where a.attrelid = v_relation and a.attname = 'id' and not a.attisdropped
    );

  if v_primary_key_count <> 1 then
    raise exception 'youtube token store requires PRIMARY KEY (id)';
  end if;

  select pg_catalog.count(*)
    into v_policy_count
  from pg_catalog.pg_policy as p
  where p.polrelid = v_relation;

  if v_policy_count <> 0 then
    raise exception 'youtube token store must not have unexpected RLS policies';
  end if;

  v_service_role := (
    select r.oid from pg_catalog.pg_roles as r where r.rolname = 'service_role'
  );

  if v_service_role is null then
    raise exception 'standard service_role is unavailable';
  end if;

  if v_created then
    revoke all on table public.youtube_oauth_tokens from public, anon, authenticated, service_role;
    grant select, insert, update on table public.youtube_oauth_tokens to service_role;
  end if;

  if exists (
    select 1
    from pg_catalog.pg_class as c
    cross join lateral pg_catalog.aclexplode(
      coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))
    ) as acl
    where c.oid = v_relation
      and acl.grantee not in (c.relowner, v_service_role)
  ) then
    raise exception 'youtube token store has an unexpected ACL grantee';
  end if;

  select coalesce(pg_catalog.array_agg(acl.privilege_type order by acl.privilege_type), array[]::text[])
    into v_service_privileges
  from pg_catalog.pg_class as c
  cross join lateral pg_catalog.aclexplode(
    coalesce(c.relacl, pg_catalog.acldefault('r', c.relowner))
  ) as acl
  where c.oid = v_relation and acl.grantee = v_service_role;

  if v_service_privileges is distinct from array['INSERT', 'SELECT', 'UPDATE']::text[] then
    raise exception 'service_role must have only SELECT, INSERT, UPDATE on youtube token store';
  end if;

  if pg_catalog.has_table_privilege('anon', v_relation, 'SELECT')
    or pg_catalog.has_table_privilege('anon', v_relation, 'INSERT')
    or pg_catalog.has_table_privilege('anon', v_relation, 'UPDATE')
    or pg_catalog.has_table_privilege('anon', v_relation, 'DELETE')
    or pg_catalog.has_table_privilege('anon', v_relation, 'TRUNCATE')
    or pg_catalog.has_table_privilege('anon', v_relation, 'REFERENCES')
    or pg_catalog.has_table_privilege('anon', v_relation, 'TRIGGER')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'SELECT')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'INSERT')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'UPDATE')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'DELETE')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'TRUNCATE')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'REFERENCES')
    or pg_catalog.has_table_privilege('authenticated', v_relation, 'TRIGGER') then
    raise exception 'browser roles must have no direct token store privileges';
  end if;

  if not pg_catalog.has_table_privilege('service_role', v_relation, 'SELECT')
    or not pg_catalog.has_table_privilege('service_role', v_relation, 'INSERT')
    or not pg_catalog.has_table_privilege('service_role', v_relation, 'UPDATE')
    or pg_catalog.has_table_privilege('service_role', v_relation, 'DELETE')
    or pg_catalog.has_table_privilege('service_role', v_relation, 'TRUNCATE')
    or pg_catalog.has_table_privilege('service_role', v_relation, 'REFERENCES')
    or pg_catalog.has_table_privilege('service_role', v_relation, 'TRIGGER') then
    raise exception 'service_role token store privileges do not match the minimum contract';
  end if;
end;
$bootstrap$;

commit;
