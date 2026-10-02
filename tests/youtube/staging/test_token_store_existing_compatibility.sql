-- Staging only. Ten rollback-contained catalog/ACL scenarios; no real token table is read or altered.
-- Candidate DO block is copied from 20261002034214, with only relation name changed to pg_temp.
-- Expected rejection messages are checked, not just any exception.
begin; set local statement_timeout='20s';
create temporary table youtube_oauth_tokens(id bigint not null primary key,refresh_token text not null,updated_at timestamptz not null default now());
alter table pg_temp.youtube_oauth_tokens enable row level security;
revoke all on pg_temp.youtube_oauth_tokens from public,anon,authenticated,service_role;
grant select,insert,update on pg_temp.youtube_oauth_tokens to service_role;
insert into pg_temp.youtube_oauth_tokens(id,refresh_token) values(1,md5(random()::text));
do $suite$ declare candidate text:=$candidate$do $compatibility$
declare
  v_relation oid := pg_catalog.to_regclass('pg_temp.youtube_oauth_tokens');
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
$compatibility$;$candidate$; passed integer:=0; begin
begin

begin execute candidate;
exception when others then raise; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
grant delete,truncate,references,trigger,maintain on pg_temp.youtube_oauth_tokens to service_role;
begin execute candidate;
exception when others then raise; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
grant select on pg_temp.youtube_oauth_tokens to public;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_or_delegable_token_store_acl' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
grant select(refresh_token) on pg_temp.youtube_oauth_tokens to anon;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_or_delegable_token_store_acl' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
grant update on pg_temp.youtube_oauth_tokens to authenticated;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_or_delegable_token_store_acl' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
revoke update on pg_temp.youtube_oauth_tokens from service_role;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'required_service_runtime_privilege_missing' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
alter table pg_temp.youtube_oauth_tokens disable row level security;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_token_store_kind_owner_or_rls' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
create policy dangerous_fixture on pg_temp.youtube_oauth_tokens for select to authenticated using(true);
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_token_store_policy' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
grant select on pg_temp.youtube_oauth_tokens to service_role with grant option;
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_or_delegable_token_store_acl' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
begin
alter table pg_temp.youtube_oauth_tokens alter column updated_at set default clock_timestamp();
begin execute candidate; raise exception 'fixture_expected_rejection_missing';
exception when others then if sqlerrm is distinct from 'unexpected_token_store_defaults' then raise; end if; end;
passed:=passed+1;
raise exception using errcode='P0002',message='fixture_case_rollback';
exception when no_data_found then if sqlerrm<>'fixture_case_rollback' then raise; end if; end;
if passed<>10 or (select count(*) from pg_temp.youtube_oauth_tokens)<>1 then raise exception 'fixture_suite_failed'; end if;
perform set_config('fieldrise.compat_cases',passed::text,false); end $suite$;
select current_setting('fieldrise.compat_cases')::integer as passed_cases, (select count(*) from pg_temp.youtube_oauth_tokens)=1 as dummy_row_preserved; rollback;
