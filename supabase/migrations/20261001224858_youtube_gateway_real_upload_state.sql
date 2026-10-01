-- Forward-only candidate. Existing Phase 1 attempts/RPCs remain unchanged.
-- Created with official CLI 2.119.0; apply only after history/identity/billing gates.
create schema if not exists youtube_gateway_private;
revoke all on schema youtube_gateway_private from public, anon, authenticated;
grant usage on schema youtube_gateway_private to service_role;
create table youtube_gateway_private.upload_attempts (
  user_id uuid not null,
  idempotency_key uuid not null,
  channel_id text not null check (channel_id ~ '^UC[A-Za-z0-9_-]{22}$'),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  state text not null check (state in ('accepted','uploading','succeeded','failed','outcome_unknown')),
  video_id text check (video_id ~ '^[A-Za-z0-9_-]{11}$'),
  created_at timestamptz not null default pg_catalog.clock_timestamp(),
  updated_at timestamptz not null default pg_catalog.clock_timestamp(),
  primary key (user_id,idempotency_key),
  check ((state = 'succeeded') = (video_id is not null))
);
create unique index youtube_gateway_one_unresolved_channel
  on youtube_gateway_private.upload_attempts(channel_id)
  where state in ('accepted','uploading','outcome_unknown');
create index youtube_gateway_upload_rate on youtube_gateway_private.upload_attempts(user_id,created_at);
alter table youtube_gateway_private.upload_attempts enable row level security;
revoke all on youtube_gateway_private.upload_attempts from public,anon,authenticated;
grant select,insert,update on youtube_gateway_private.upload_attempts to service_role;

create function public.youtube_gateway_upload_reserve(p_user_id uuid,p_key uuid,p_channel text,p_fingerprint text)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_row youtube_gateway_private.upload_attempts%rowtype;
begin
  if p_user_id is null or p_key is null or p_channel is null or p_fingerprint is null or
     p_channel !~ '^UC[A-Za-z0-9_-]{22}$' or p_fingerprint !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_upload_binding';
  end if;
  -- User lock serializes same-key requests even with a different channel; channel lock serializes distinct users.
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_user_id::text, 20261002));
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(p_channel, 20261003));
  select * into v_row from youtube_gateway_private.upload_attempts
    where user_id=p_user_id and idempotency_key=p_key for update;
  if found then
    if v_row.channel_id <> p_channel or v_row.fingerprint <> p_fingerprint then
      return pg_catalog.jsonb_build_object('decision','mismatch');
    end if;
    return pg_catalog.jsonb_build_object('decision','existing','state',v_row.state,'videoId',v_row.video_id);
  end if;
  if exists (select 1 from youtube_gateway_private.upload_attempts where channel_id=p_channel
    and state in ('accepted','uploading','outcome_unknown')) then
    return pg_catalog.jsonb_build_object('decision','busy');
  end if;
  if (select count(*) from youtube_gateway_private.upload_attempts where user_id=p_user_id
    and created_at > pg_catalog.clock_timestamp()-interval '15 minutes') >= 3 then
    return pg_catalog.jsonb_build_object('decision','rate_limited');
  end if;
  insert into youtube_gateway_private.upload_attempts(user_id,idempotency_key,channel_id,fingerprint,state)
    values(p_user_id,p_key,p_channel,p_fingerprint,'accepted');
  return pg_catalog.jsonb_build_object('decision','accepted');
end $$;
create function public.youtube_gateway_upload_begin(p_user_id uuid,p_key uuid,p_channel text,p_fingerprint text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  update youtube_gateway_private.upload_attempts set state='uploading',updated_at=pg_catalog.clock_timestamp()
    where user_id=p_user_id and idempotency_key=p_key and channel_id=p_channel and fingerprint=p_fingerprint and state='accepted';
  return found;
end $$;
create function public.youtube_gateway_upload_complete(p_user_id uuid,p_key uuid,p_channel text,p_fingerprint text,p_state text,p_video_id text)
returns boolean language plpgsql security invoker set search_path = '' as $$
begin
  if p_state is null or p_state not in ('succeeded','failed','outcome_unknown') or
     (p_state='succeeded' and (p_video_id is null or p_video_id !~ '^[A-Za-z0-9_-]{11}$')) or
     (p_state<>'succeeded' and p_video_id is not null) then raise exception 'invalid_upload_result'; end if;
  update youtube_gateway_private.upload_attempts set state=p_state,video_id=p_video_id,updated_at=pg_catalog.clock_timestamp()
    where user_id=p_user_id and idempotency_key=p_key and channel_id=p_channel and fingerprint=p_fingerprint and state='uploading';
  return found;
end $$;
revoke all on function public.youtube_gateway_upload_reserve(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.youtube_gateway_upload_begin(uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.youtube_gateway_upload_complete(uuid,uuid,text,text,text,text) from public,anon,authenticated;
grant execute on function public.youtube_gateway_upload_reserve(uuid,uuid,text,text) to service_role;
grant execute on function public.youtube_gateway_upload_begin(uuid,uuid,text,text) to service_role;
grant execute on function public.youtube_gateway_upload_complete(uuid,uuid,text,text,text,text) to service_role;
