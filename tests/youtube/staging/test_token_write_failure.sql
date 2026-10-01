-- B9C staging-only fixture test. Execute ONLY on zjgmgwjeebphkbbqjbfi
-- after a separate project identity/health gate. Never apply as a migration.
-- Every fixture and the temporary constraint are rolled back.
begin;
set local search_path = '';
set local lock_timeout = '3s';
set local statement_timeout = '15s';

do $test$
declare
  v_transaction uuid := pg_catalog.gen_random_uuid();
  v_hash bytea := pg_catalog.sha256(pg_catalog.convert_to(pg_catalog.gen_random_uuid()::text, 'UTF8'));
  v_old text := pg_catalog.gen_random_uuid()::text;
  v_rejected text := pg_catalog.gen_random_uuid()::text || pg_catalog.gen_random_uuid()::text;
  v_constraint text;
  v_failure_seen boolean := false;
  v_count integer;
begin
  if exists (select 1 from public.youtube_oauth_tokens)
    or exists (select 1 from youtube_oauth_private.transactions)
    or exists (select 1 from pg_catalog.pg_constraint where conname = 'b9c_fixture_reject_token_write') then
    raise exception 'B9C_FIXTURE_PREFLIGHT_NOT_EMPTY';
  end if;

  insert into public.youtube_oauth_tokens(id, refresh_token) values (1, v_old);
  if not public.youtube_oauth_reserve(v_transaction, v_hash, 60) then
    raise exception 'B9C_RESERVE_FAILED';
  end if;
  select count(*) into v_count from public.youtube_oauth_consume_state(v_hash);
  if v_count <> 1 then raise exception 'B9C_CONSUME_FAILED'; end if;

  -- Strengthen the table temporarily: the short old dummy satisfies this
  -- test-only limit, while the longer new dummy fails it. No dummy value is
  -- embedded in DDL. No ACL, role, or owner changes.
  alter table public.youtube_oauth_tokens add constraint b9c_fixture_reject_token_write
    check (pg_catalog.char_length(refresh_token) <= 64);

  begin
    perform public.youtube_oauth_cutover_token(v_transaction, v_rejected);
    raise exception 'B9C_TOKEN_WRITE_UNEXPECTEDLY_SUCCEEDED';
  exception when check_violation then
    get stacked diagnostics v_constraint = constraint_name;
    if v_constraint is distinct from 'b9c_fixture_reject_token_write' then
      raise exception 'B9C_UNEXPECTED_CHECK_VIOLATION';
    end if;
    v_failure_seen := true;
  end;

  if not v_failure_seen then raise exception 'B9C_WRITE_FAILURE_NOT_OBSERVED'; end if;
  if not exists (select 1 from public.youtube_oauth_tokens where id = 1 and refresh_token = v_old) then
    raise exception 'B9C_OLD_DUMMY_NOT_PRESERVED';
  end if;
  if not exists (
    select 1 from youtube_oauth_private.transactions
    where transaction_id = v_transaction and consumed_at is not null
      and finished_at is null and result_code is null
  ) then
    raise exception 'B9C_TRANSACTION_TERMINAL_TRANSITION_NOT_ROLLED_BACK';
  end if;
end;
$test$;

rollback;

select 'OLD_DUMMY_PRESERVED' as token_result,
  (select count(*) from public.youtube_oauth_tokens) as token_fixture_count,
  (select count(*) from youtube_oauth_private.transactions) as transaction_fixture_count,
  (select count(*) from pg_catalog.pg_constraint where conname = 'b9c_fixture_reject_token_write') as temporary_artifact_count;
