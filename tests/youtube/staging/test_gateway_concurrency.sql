-- Staging-only four-case protocol. Never run on Production.
-- For EACH case, dispatch A on an independent request, yield while it sleeps,
-- then dispatch B before A finishes. Await both; no retry after a safety violation.
-- Require distinct backend IDs, B.contended=true and B.started < A.ended.
-- Merely Promise.all on one serialized dispatcher does not establish overlap.
-- 2026-10-02 actual yielded-request runs satisfied all four overlap predicates.

-- CASE A: accepted/busy; one active row
-- Request A (run separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);
r:=public.youtube_gateway_upload_reserve(md5('fr-closure-A-user-A')::uuid,md5('fr-closure-A-key-A')::uuid,'UC'||repeat('e',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);
perform pg_sleep(8);
perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,pg_backend_pid() as backend;

-- Request B (run during A's sleep, separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);
contended:=not pg_try_advisory_xact_lock(hashtextextended('UC'||repeat('e',22),20261003));
perform set_config('fieldrise.race_contended',contended::text,false);
r:=public.youtube_gateway_upload_reserve(md5('fr-closure-A-user-B')::uuid,md5('fr-closure-A-key-B')::uuid,'UC'||repeat('e',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);
perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,current_setting('fieldrise.race_contended')::boolean as contended,pg_backend_pid() as backend;

-- CASE B: accepted/existing; one same-key row
-- Request A (run separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);

r:=public.youtube_gateway_upload_reserve(md5('fr-closure-B-user')::uuid,md5('fr-closure-B-key')::uuid,'UC'||repeat('f',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);

perform pg_sleep(8);
perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,pg_backend_pid() as backend;

-- Request B (run during A's sleep, separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);
contended:=not pg_try_advisory_xact_lock(hashtextextended('UC'||repeat('f',22),20261003)); perform set_config('fieldrise.race_contended',contended::text,false);
r:=public.youtube_gateway_upload_reserve(md5('fr-closure-B-user')::uuid,md5('fr-closure-B-key')::uuid,'UC'||repeat('f',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);


perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,current_setting('fieldrise.race_contended')::boolean as contended,pg_backend_pid() as backend;

-- CASE C: accepted/mismatch; original fingerprint preserved
-- Request A (run separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);

r:=public.youtube_gateway_upload_reserve(md5('fr-closure-C-user')::uuid,md5('fr-closure-C-key')::uuid,'UC'||repeat('g',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);

perform pg_sleep(8);
perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,pg_backend_pid() as backend;

-- Request B (run during A's sleep, separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);
contended:=not pg_try_advisory_xact_lock(hashtextextended('UC'||repeat('g',22),20261003)); perform set_config('fieldrise.race_contended',contended::text,false);
r:=public.youtube_gateway_upload_reserve(md5('fr-closure-C-user')::uuid,md5('fr-closure-C-key')::uuid,'UC'||repeat('g',22),repeat('b',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);


perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,current_setting('fieldrise.race_contended')::boolean as contended,pg_backend_pid() as backend;

-- CASE D: A transitions to outcome_unknown; B busy; zero new accepted/uploading
-- Request A (run separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);

r:=public.youtube_gateway_upload_reserve(md5('fr-closure-D-user-A')::uuid,md5('fr-closure-D-key-A')::uuid,'UC'||repeat('h',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);
if r->>'decision'<>'accepted' then raise exception 'fixture_reservation_failed'; end if;
if not public.youtube_gateway_upload_begin(md5('fr-closure-D-user-A')::uuid,md5('fr-closure-D-key-A')::uuid,'UC'||repeat('h',22),repeat('a',64)) then raise exception 'fixture_begin_failed'; end if;
if not public.youtube_gateway_upload_complete(md5('fr-closure-D-user-A')::uuid,md5('fr-closure-D-key-A')::uuid,'UC'||repeat('h',22),repeat('a',64),'outcome_unknown',null) then raise exception 'fixture_unknown_failed'; end if;
perform pg_sleep(8);
perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,pg_backend_pid() as backend;

-- Request B (run during A's sleep, separately):
begin; set local statement_timeout='20s'; set local role service_role; do $$ declare r jsonb; contended boolean; begin
perform set_config('fieldrise.race_start',clock_timestamp()::text,false);
contended:=not pg_try_advisory_xact_lock(hashtextextended('UC'||repeat('h',22),20261003)); perform set_config('fieldrise.race_contended',contended::text,false);
r:=public.youtube_gateway_upload_reserve(md5('fr-closure-D-user-B')::uuid,md5('fr-closure-D-key-B')::uuid,'UC'||repeat('h',22),repeat('a',64));
perform set_config('fieldrise.race_decision',r->>'decision',false);


perform set_config('fieldrise.race_end',clock_timestamp()::text,false);
end $$; commit; select current_setting('fieldrise.race_start') as started,current_setting('fieldrise.race_end') as ended,current_setting('fieldrise.race_decision') as decision,current_setting('fieldrise.race_contended')::boolean as contended,pg_backend_pid() as backend;

-- Assert only generated dummy channels after all participants finish.
do $$ begin
if exists (select 1 from youtube_gateway_private.upload_attempts
where channel_id in ('UC'||repeat('e',22),'UC'||repeat('f',22),'UC'||repeat('g',22),'UC'||repeat('h',22))
group by channel_id having count(*)<>1) then raise exception 'duplicate_fixture_row'; end if;
if (select count(*) from youtube_gateway_private.upload_attempts
where channel_id in ('UC'||repeat('e',22),'UC'||repeat('f',22),'UC'||repeat('g',22),'UC'||repeat('h',22)))<>4
then raise exception 'missing_fixture_row'; end if;
if exists (select 1 from youtube_gateway_private.upload_attempts where channel_id='UC'||repeat('g',22)
and fingerprint<>repeat('a',64)) then raise exception 'fingerprint_mismatch_accepted'; end if;
if exists (select 1 from youtube_gateway_private.upload_attempts where channel_id='UC'||repeat('h',22)
and state<>'outcome_unknown') then raise exception 'unknown_bypass'; end if;
end $$;
-- Cleanup only generated users AND channels, never migration objects:
delete from youtube_gateway_private.upload_attempts
where user_id in (md5('fr-closure-A-user-A')::uuid,md5('fr-closure-A-user-B')::uuid,
md5('fr-closure-B-user')::uuid,md5('fr-closure-C-user')::uuid,
md5('fr-closure-D-user-A')::uuid,md5('fr-closure-D-user-B')::uuid)
and channel_id in ('UC'||repeat('e',22),'UC'||repeat('f',22),'UC'||repeat('g',22),'UC'||repeat('h',22));
select count(*) as remaining_gateway_fixture_count from youtube_gateway_private.upload_attempts;
