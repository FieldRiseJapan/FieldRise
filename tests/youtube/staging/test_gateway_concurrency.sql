-- Staging only; run A and B on separate connections concurrently, not sequentially.
-- Gate before running: exact project identity, Free plan, table fixture count zero.
-- This file is a test protocol, NOT a migration. No token/Auth/provider operations.
-- Current MCP runs did not observe contention; do not call those runs concurrency PASS.

-- Participant A (separate connection):
begin;
set local role service_role;
set local statement_timeout = '20s';
do $$
declare r jsonb; contended boolean;
begin
  contended := not pg_catalog.pg_try_advisory_xact_lock(
    pg_catalog.hashtextextended('UC'||repeat('d',22),20261003));
  perform pg_catalog.set_config('fieldrise.test_contended',contended::text,false);
  r := public.youtube_gateway_upload_reserve(
    pg_catalog.md5('fr-state-race-channel-A')::uuid,
    pg_catalog.md5('fr-state-race-key-A')::uuid,'UC'||repeat('d',22),repeat('a',64));
  perform pg_catalog.set_config('fieldrise.test_decision',r->>'decision',false);
  perform pg_catalog.pg_sleep(5);
end $$;
commit;
select pg_catalog.current_setting('fieldrise.test_decision') as decision,
  pg_catalog.current_setting('fieldrise.test_contended')::boolean as contended,
  pg_catalog.pg_backend_pid() as backend;

-- Participant B: execute the same block concurrently, replacing only the two
-- synthetic labels ending in -A with labels ending in -B.
-- Required combined results: different backend IDs, exactly one accepted and one
-- busy, AND at least one contended=true. No contention => OVERLAP NOT PROVEN.
-- Same-key variant: both participants use fr-state-race-same and
-- fr-state-race-key-same, channel UC + 22 c characters. Required: one accepted,
-- one existing, one persisted row. Contention must also be observed for race PASS.

-- After both participants finish, assert counts (no fixture identifiers emitted):
do $$
begin
  if (select count(*) from youtube_gateway_private.upload_attempts
      where channel_id='UC'||repeat('d',22)) <> 1 then
    raise exception 'duplicate_active_upload';
  end if;
end $$;

-- Cleanup only this protocol's generated dummy rows; preserve migration objects.
delete from youtube_gateway_private.upload_attempts
where user_id in (pg_catalog.md5('fr-state-race-same')::uuid,
  pg_catalog.md5('fr-state-race-channel-A')::uuid,
  pg_catalog.md5('fr-state-race-channel-B')::uuid,
  pg_catalog.md5('fr-state-race-channel-C')::uuid)
and channel_id in ('UC'||repeat('c',22),'UC'||repeat('d',22));
select count(*) as remaining_gateway_fixture_count
from youtube_gateway_private.upload_attempts;
