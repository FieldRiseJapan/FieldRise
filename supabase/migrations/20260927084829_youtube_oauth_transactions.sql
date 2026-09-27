-- Forward-only Phase 3-B4/B6 local migration candidate.
-- Do not apply to any live database without separate authorization and staging verification.
-- B6 keeps callback session validation and state consumption in one DB transaction.

begin;

create schema youtube_oauth_private;

revoke all on schema youtube_oauth_private from public, anon, authenticated;
grant usage on schema youtube_oauth_private to service_role;

create table youtube_oauth_private.transactions (
  transaction_id uuid primary key,
  state_hash bytea not null unique,
  user_id uuid not null,
  session_id uuid not null,
  created_at timestamptz not null,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  finished_at timestamptz,
  result_code text,
  constraint youtube_oauth_transactions_state_hash_sha256
    check (pg_catalog.octet_length(state_hash) = 32),
  constraint youtube_oauth_transactions_ttl
    check (expires_at > created_at and expires_at <= created_at + interval '10 minutes'),
  constraint youtube_oauth_transactions_consumed_order
    check (consumed_at is null or consumed_at >= created_at),
  constraint youtube_oauth_transactions_result_code
    check (result_code is null or result_code in (
      'provider_denied', 'exchange_failed', 'scope_rejected', 'channel_rejected',
      'refresh_missing', 'storage_failed', 'token_stored'
    )),
  constraint youtube_oauth_transactions_finished_order
    check (finished_at is null or (
      consumed_at is not null and finished_at >= consumed_at and result_code is not null
    )),
  constraint youtube_oauth_transactions_unfinished_code
    check (finished_at is not null or result_code is null)
);

alter table youtube_oauth_private.transactions enable row level security;
revoke all on table youtube_oauth_private.transactions from public, anon, authenticated, service_role;
grant select, insert, update on table youtube_oauth_private.transactions to service_role;

create function public.youtube_oauth_reserve(
  p_transaction_id uuid,
  p_state_hash bytea,
  p_user_id uuid,
  p_session_id uuid,
  p_ttl_seconds integer
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_transaction_id is null or p_user_id is null or p_session_id is null
    or p_state_hash is null or pg_catalog.octet_length(p_state_hash) <> 32
    or p_ttl_seconds is null or p_ttl_seconds < 60 or p_ttl_seconds > 600 then
    return false;
  end if;

  insert into youtube_oauth_private.transactions (
    transaction_id, state_hash, user_id, session_id, created_at, expires_at
  ) values (
    p_transaction_id, p_state_hash, p_user_id, p_session_id, v_now,
    v_now + (p_ttl_seconds * interval '1 second')
  );
  return true;
exception
  when unique_violation then return false;
end;
$$;

-- The helper runs with the auth.sessions table owner's narrowly-scoped SELECT
-- visibility so service_role does not receive direct auth schema/table access.
-- Owner role availability and the privilege boundary must be verified in staging.
grant usage, create on schema youtube_oauth_private to supabase_auth_admin;

create function youtube_oauth_private.youtube_oauth_lock_bound_session(
  p_user_id uuid,
  p_session_id uuid
)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_session_id uuid;
begin
  if p_user_id is null or p_session_id is null then
    return false;
  end if;

  -- FOR SHARE holds the matching auth row lock until the caller's outer
  -- transaction commits, serializing sign-out/revocation updates with consume.
  select s.id
    into v_session_id
  from auth.sessions as s
  where s.id = p_session_id
    and s.user_id = p_user_id
  for share;

  return found;
end;
$$;

alter function youtube_oauth_private.youtube_oauth_lock_bound_session(uuid, uuid)
  owner to supabase_auth_admin;
revoke create on schema youtube_oauth_private from supabase_auth_admin;

revoke all on function youtube_oauth_private.youtube_oauth_lock_bound_session(uuid, uuid)
  from public, anon, authenticated;
grant execute on function youtube_oauth_private.youtube_oauth_lock_bound_session(uuid, uuid)
  to service_role;

create function public.youtube_oauth_consume_state(p_state_hash bytea)
returns table (
  transaction_id uuid
)
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_transaction_id uuid;
  v_user_id uuid;
  v_session_id uuid;
  v_now timestamptz := pg_catalog.clock_timestamp();
begin
  if p_state_hash is null or pg_catalog.octet_length(p_state_hash) <> 32 then
    return;
  end if;

  select t.transaction_id, t.user_id, t.session_id
    into v_transaction_id, v_user_id, v_session_id
  from youtube_oauth_private.transactions as t
  where t.state_hash = p_state_hash
    and t.expires_at > v_now
    and t.consumed_at is null
    and t.finished_at is null
  for update;

  if not found then
    return;
  end if;

  -- This helper locks the exact Auth session row within this transaction.
  -- Start also caps the transaction TTL at the verified JWT exp; a missing or
  -- mismatched row (for example after sign-out) leaves state unconsumed.
  if not youtube_oauth_private.youtube_oauth_lock_bound_session(v_user_id, v_session_id) then
    return;
  end if;

  update youtube_oauth_private.transactions as t
  set consumed_at = pg_catalog.clock_timestamp()
  where t.transaction_id = v_transaction_id
    and t.state_hash = p_state_hash
    and t.expires_at > pg_catalog.clock_timestamp()
    and t.consumed_at is null
    and t.finished_at is null
  returning t.transaction_id into v_transaction_id;

  if found then
    return query select v_transaction_id;
  end if;
end;
$$;

create function public.youtube_oauth_finish(
  p_transaction_id uuid,
  p_result_code text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_result_code is null or p_result_code not in (
    'provider_denied', 'exchange_failed', 'scope_rejected', 'channel_rejected',
    'refresh_missing', 'storage_failed'
  ) then
    return false;
  end if;

  update youtube_oauth_private.transactions as t
  set finished_at = pg_catalog.clock_timestamp(), result_code = p_result_code
  where t.transaction_id = p_transaction_id
    and t.consumed_at is not null
    and t.finished_at is null;
  return found;
end;
$$;

create function public.youtube_oauth_cutover_token(
  p_transaction_id uuid,
  p_refresh_token text
)
returns boolean
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if p_refresh_token is null or pg_catalog.btrim(p_refresh_token) = ''
    or pg_catalog.length(p_refresh_token) > 8192
    or p_refresh_token ~ '[[:cntrl:]]' then
    return false;
  end if;

  update youtube_oauth_private.transactions as t
  set finished_at = pg_catalog.clock_timestamp(), result_code = 'token_stored'
  where t.transaction_id = p_transaction_id
    and t.expires_at > pg_catalog.clock_timestamp()
    and t.consumed_at is not null
    and t.finished_at is null;
  if not found then
    return false;
  end if;

  insert into public.youtube_oauth_tokens (id, refresh_token, updated_at)
  values (1, p_refresh_token, pg_catalog.clock_timestamp())
  on conflict (id) do update
    set refresh_token = excluded.refresh_token,
        updated_at = excluded.updated_at;

  return true;
end;
$$;

revoke all on function public.youtube_oauth_reserve(uuid, bytea, uuid, uuid, integer)
  from public, anon, authenticated;
revoke all on function public.youtube_oauth_consume_state(bytea)
  from public, anon, authenticated;
revoke all on function public.youtube_oauth_finish(uuid, text)
  from public, anon, authenticated;
revoke all on function public.youtube_oauth_cutover_token(uuid, text)
  from public, anon, authenticated;

grant execute on function public.youtube_oauth_reserve(uuid, bytea, uuid, uuid, integer) to service_role;
grant execute on function public.youtube_oauth_consume_state(bytea) to service_role;
grant execute on function public.youtube_oauth_finish(uuid, text) to service_role;
grant execute on function public.youtube_oauth_cutover_token(uuid, text) to service_role;

commit;
