-- Execute only on verified Staging: BEGIN; state candidate; this file; ROLLBACK.
-- Synthetic identifiers stay inside the DB; no tokens, Auth rows or provider calls.
set local role service_role;
do $$
declare u uuid := pg_catalog.gen_random_uuid(); k uuid := pg_catalog.gen_random_uuid();
  k2 uuid := pg_catalog.gen_random_uuid(); c text := 'UC'||repeat('a',22);
  f text := repeat('a',64); r jsonb;
begin
  r := public.youtube_gateway_upload_reserve(u,k,c,f);
  if r->>'decision' <> 'accepted' then raise exception 'reserve_failed'; end if;
  if (public.youtube_gateway_upload_reserve(u,k,c,f))->>'state' <> 'accepted' then raise exception 'replay_failed'; end if;
  if (public.youtube_gateway_upload_reserve(u,k,c,repeat('b',64)))->>'decision' <> 'mismatch' then raise exception 'mismatch_failed'; end if;
  if (public.youtube_gateway_upload_reserve(u,k2,c,f))->>'decision' <> 'busy' then raise exception 'accepted_channel_block_failed'; end if;
  if not public.youtube_gateway_upload_begin(u,k,c,f) then raise exception 'begin_failed'; end if;
  if public.youtube_gateway_upload_begin(u,k,c,f) then raise exception 'second_begin_succeeded'; end if;
  update youtube_gateway_private.upload_attempts set created_at=pg_catalog.clock_timestamp()-interval '1 day' where user_id=u;
  if (public.youtube_gateway_upload_reserve(u,k2,c,f))->>'decision' <> 'busy' then raise exception 'stale_uploading_released'; end if;
  if not public.youtube_gateway_upload_complete(u,k,c,f,'outcome_unknown',null) then raise exception 'unknown_failed'; end if;
  if (public.youtube_gateway_upload_reserve(u,k2,c,f))->>'decision' <> 'busy' then raise exception 'unknown_channel_released'; end if;
  if public.youtube_gateway_upload_complete(u,k,c,f,'failed',null) then raise exception 'unknown_reset_succeeded'; end if;
  c := 'UC'||repeat('b',22);
  r := public.youtube_gateway_upload_reserve(u,k2,c,f);
  if r->>'decision' <> 'accepted' or not public.youtube_gateway_upload_begin(u,k2,c,f) then raise exception 'second_channel_failed'; end if;
  begin
    perform public.youtube_gateway_upload_complete(u,k2,c,f,'succeeded',null);
    raise exception 'missing_video_id_accepted';
  exception when raise_exception then
    if sqlerrm <> 'invalid_upload_result' then raise; end if;
  end;
  if not public.youtube_gateway_upload_complete(u,k2,c,f,'succeeded','Abcdef123_-') then raise exception 'success_failed'; end if;
  r := public.youtube_gateway_upload_reserve(u,k2,c,f);
  if r->>'state' <> 'succeeded' or r->>'videoId' <> 'Abcdef123_-' then raise exception 'success_replay_failed'; end if;
  if public.youtube_gateway_upload_begin(u,k2,c,f) then raise exception 'success_reopened'; end if;
  k2 := pg_catalog.gen_random_uuid();
  r := public.youtube_gateway_upload_reserve(u,k2,c,f);
  if r->>'decision' <> 'accepted' or not public.youtube_gateway_upload_begin(u,k2,c,f) then raise exception 'new_after_success_failed'; end if;
  if not public.youtube_gateway_upload_complete(u,k2,c,f,'failed',null) then raise exception 'definite_failure_failed'; end if;
  if (public.youtube_gateway_upload_reserve(u,k2,c,f))->>'state' <> 'failed' then raise exception 'failed_replay_failed'; end if;
end $$;
reset role;
do $$
declare r text; p text;
begin
  foreach r in array array['anon','authenticated'] loop
    foreach p in array array['SELECT','INSERT','UPDATE','DELETE'] loop
      if pg_catalog.has_table_privilege(r,'youtube_gateway_private.upload_attempts',p) then
        raise exception 'browser_table_privilege';
      end if;
    end loop;
    if exists (select 1 from pg_catalog.pg_proc x join pg_catalog.pg_namespace n on n.oid=x.pronamespace
      where n.nspname='public' and x.proname like 'youtube_gateway_upload_%'
      and pg_catalog.has_function_privilege(r,x.oid,'EXECUTE')) then raise exception 'browser_rpc_privilege'; end if;
  end loop;
  if exists(select 1 from pg_catalog.pg_proc x join pg_catalog.pg_namespace n on n.oid=x.pronamespace
    where n.nspname='public' and x.proname like 'youtube_gateway_upload_%'
    and (x.prosecdef or x.proconfig <> array['search_path=""'] or pg_catalog.pg_get_userbyid(x.proowner)<>'postgres'))
    then raise exception 'unsafe_rpc_metadata'; end if;
end $$;
