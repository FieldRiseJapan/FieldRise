-- Existing-environment validation only; created by official Supabase CLI 2.119.0.
-- Production approval and the explicit manifest are required. This is not a db-push bypass.
-- Clean environments continue to use 20260927080000; never rewrite its recorded source.
-- No table rows, ownership, grants, history or schema objects are changed here.
begin;
set local search_path = '';

do $compatibility$
declare
  v_relation oid := pg_catalog.to_regclass('public.youtube_oauth_tokens');
  v_owner oid;
  v_service oid;
  v_columns integer;
  v_privilege text;
  v_role text;
begin
  if v_relation is null then
    raise exception 'existing_token_store_required';
  end if;
  select c.relowner into v_owner
  from pg_catalog.pg_class c
  where c.oid = v_relation and c.relkind = 'r' and c.relrowsecurity
    and pg_catalog.pg_get_userbyid(c.relowner) = 'postgres';
  if v_owner is null then
    raise exception 'unexpected_token_store_kind_owner_or_rls';
  end if;
  if exists (select 1 from pg_catalog.pg_inherits
             where inhrelid = v_relation or inhparent = v_relation) then
    raise exception 'token_store_inheritance_not_supported';
  end if;
  select pg_catalog.count(*) into v_columns from pg_catalog.pg_attribute
  where attrelid = v_relation and attnum > 0 and not attisdropped;
  if v_columns <> 3 or not exists (
    select 1 from pg_catalog.pg_attribute where attrelid=v_relation
      and attname='id' and atttypid='pg_catalog.int8'::pg_catalog.regtype and attnotnull
  ) or not exists (
    select 1 from pg_catalog.pg_attribute where attrelid=v_relation
      and attname='refresh_token' and atttypid='pg_catalog.text'::pg_catalog.regtype and attnotnull
  ) or not exists (
    select 1 from pg_catalog.pg_attribute where attrelid=v_relation
      and attname='updated_at' and atttypid='pg_catalog.timestamptz'::pg_catalog.regtype and attnotnull
  ) then
    raise exception 'unexpected_token_store_columns';
  end if;
  if (select pg_catalog.pg_get_expr(d.adbin,d.adrelid)
      from pg_catalog.pg_attrdef d join pg_catalog.pg_attribute a
        on a.attrelid=d.adrelid and a.attnum=d.adnum
      where d.adrelid=v_relation and a.attname='updated_at') is distinct from 'now()'
    or exists (select 1 from pg_catalog.pg_attrdef d
      join pg_catalog.pg_attribute a on a.attrelid=d.adrelid and a.attnum=d.adnum
      where d.adrelid=v_relation and a.attname in ('id','refresh_token')) then
    raise exception 'unexpected_token_store_defaults';
  end if;
  if (select pg_catalog.count(*) from pg_catalog.pg_constraint con
      where con.conrelid=v_relation and con.contype='p'
        and pg_catalog.array_length(con.conkey,1)=1
        and con.conkey[1]=(select attnum from pg_catalog.pg_attribute
          where attrelid=v_relation and attname='id' and not attisdropped)) <> 1 then
    raise exception 'unexpected_token_store_primary_key';
  end if;
  if exists (select 1 from pg_catalog.pg_policy where polrelid=v_relation) then
    raise exception 'unexpected_token_store_policy';
  end if;
  select oid into v_service from pg_catalog.pg_roles where rolname='service_role';
  if v_service is null then raise exception 'standard_service_role_required'; end if;

  -- PUBLIC and all other non-owner/service grantees fail closed, at table AND column scope.
  if exists (
    select 1 from pg_catalog.pg_class c cross join lateral pg_catalog.aclexplode(
      coalesce(c.relacl,pg_catalog.acldefault('r',c.relowner))) acl
    where c.oid=v_relation and (acl.grantee not in (v_owner,v_service)
      or (acl.grantee=v_service and (acl.is_grantable or acl.privilege_type not in
        ('SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'))))
  ) or exists (
    select 1 from pg_catalog.pg_attribute a
    cross join lateral pg_catalog.aclexplode(a.attacl) acl
    where a.attrelid=v_relation and a.attnum>0 and not a.attisdropped
      and (acl.grantee not in (v_owner,v_service)
        or (acl.grantee=v_service and acl.is_grantable))
  ) then raise exception 'unexpected_or_delegable_token_store_acl'; end if;

  foreach v_role in array array['anon','authenticated'] loop
    foreach v_privilege in array array['SELECT','INSERT','UPDATE','DELETE','TRUNCATE','REFERENCES','TRIGGER','MAINTAIN'] loop
      if pg_catalog.has_table_privilege(v_role,v_relation,v_privilege) then
        raise exception 'browser_token_store_table_access';
      end if;
    end loop;
    foreach v_privilege in array array['SELECT','INSERT','UPDATE','REFERENCES'] loop
      if pg_catalog.has_any_column_privilege(v_role,v_relation,v_privilege) then
        raise exception 'browser_token_store_column_access';
      end if;
    end loop;
  end loop;
  foreach v_privilege in array array['SELECT','INSERT','UPDATE'] loop
    if not pg_catalog.has_table_privilege('service_role',v_relation,v_privilege) then
      raise exception 'required_service_runtime_privilege_missing';
    end if;
  end loop;
end;
$compatibility$;
commit;
