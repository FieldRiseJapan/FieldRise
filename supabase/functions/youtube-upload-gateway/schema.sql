-- Phase 1 only. Apply after review, before deploying the function. No video, JWT or token storage.
create schema if not exists youtube_gateway_private;
revoke all on schema youtube_gateway_private from public, anon, authenticated;
grant usage on schema youtube_gateway_private to service_role;

create table if not exists youtube_gateway_private.attempts (
  user_id uuid not null,
  idempotency_key uuid not null,
  state text not null check (state in ('processing', 'validated', 'failed')),
  created_at timestamptz not null default now(),
  primary key (user_id, idempotency_key)
);
alter table youtube_gateway_private.attempts enable row level security;
revoke all on youtube_gateway_private.attempts from public, anon, authenticated;
grant select, insert, update on youtube_gateway_private.attempts to service_role;
create index if not exists youtube_gateway_attempts_recent
  on youtube_gateway_private.attempts (user_id, created_at desc);

create or replace function public.youtube_gateway_reserve(p_user_id uuid, p_key uuid)
returns text language plpgsql security invoker set search_path = '' as $$
declare v_now timestamptz := now();
begin
  -- Transaction-scoped lock serializes calls for the one allowed user across Edge instances.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 20260926));
  if exists (select 1 from youtube_gateway_private.attempts
             where user_id = p_user_id and idempotency_key = p_key) then
    return 'duplicate';
  end if;
  if exists (select 1 from youtube_gateway_private.attempts
             where user_id = p_user_id and state = 'processing'
               and created_at > v_now - interval '2 minutes') then
    return 'busy';
  end if;
  if (select count(*) from youtube_gateway_private.attempts
      where user_id = p_user_id and created_at > v_now - interval '15 minutes') >= 3 then
    return 'rate_limited';
  end if;
  insert into youtube_gateway_private.attempts(user_id, idempotency_key, state)
  values (p_user_id, p_key, 'processing');
  return 'reserved';
end $$;

create or replace function public.youtube_gateway_finish(p_user_id uuid, p_key uuid)
returns text language plpgsql security invoker set search_path = '' as $$
begin
  update youtube_gateway_private.attempts set state = 'validated'
  where user_id = p_user_id and idempotency_key = p_key and state = 'processing';
  if found then return 'validated'; end if;
  return 'unavailable';
end $$;

revoke all on function public.youtube_gateway_reserve(uuid, uuid) from public, anon, authenticated;
revoke all on function public.youtube_gateway_finish(uuid, uuid) from public, anon, authenticated;
grant execute on function public.youtube_gateway_reserve(uuid, uuid) to service_role;
grant execute on function public.youtube_gateway_finish(uuid, uuid) to service_role;
