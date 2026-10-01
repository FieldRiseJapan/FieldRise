# YouTube Production Readiness Final

Date: 2026-10-02 JST

**PRODUCTION CUTOVER NOT READY** — implementation candidate prepared; no Production cutover authorized or executed.

## Baseline / scope

B9C formal baseline: `ced89de961172bf12f411eb4fb6c96b386dd120e`.
Working baseline/current main before registration: `b56d87dcd3e6956aaf75c596358c0655b5c0276b`.
B9C is an ancestor. The only newer commit adds site favicon/app-icon markup to index.html. Full patch reviewed: no OAuth/Auth/Gateway/migration interference. Preserved without editing. New detached worktree used; previous local worktrees preserved.

Staging `zjgmgwjeebphkbbqjbfi`, FieldRise Staging, ap-northeast-1, ACTIVE_HEALTHY. Production `nmkcjtrllzkwjxmjromw`, ap-northeast-1, ACTIVE_HEALTHY. Identity checked with connector, Staging rechecked immediately before transactional SQL test. No Production token row/value query, DDL, DML, Auth, Secret, ACL, Function or billing changes.

## Migration history

Staging still has `20261001115200` and `20261001115628`, corresponding by name/source to repository `20260927080000` and `20260927084829`. B9C source correspondence evidence retained. No replay or manual history mutation. Official [migration repair](https://supabase.com/docs/reference/cli/supabase-migration-repair) changes history without replaying schema SQL; documented Staging-only sequence remains in readiness plan.

No existing CLI authentication/DB password/URL or saved CLI token path available. MCP exposes no repair operation. No secret requested/exposed and no credential extraction attempted. **MIGRATION HISTORY BLOCKED**; independent work continued as explicitly directed. Deno absent and not installed. Official CLI 2.119.0 was acquired locally through pinned npx (no global install), command help verified. migration new generated 20261001224858_youtube_gateway_real_upload_state.sql; source copied from the runtime-tested forward candidate. repair --help confirms supported status/project-ref/db-url paths. CLI availability does not supply missing authentication; no repair attempted without it.

## authenticated HTTP / cleanup

**AUTHENTICATED HTTP TEST BLOCKED.** No supported existing Staging Auth admin create/token/cleanup path available. No Auth config relaxation, manual managed Auth insertion, forged JWT or Production user used. No test Auth fixture created; Auth users remain 0.

Fresh actual Staging metadata: authenticated table SELECT/INSERT/UPDATE/DELETE privilege false; authenticated OAuth RPC executable count 0. Both token/transactions RLS enabled, policies 0, owner postgres, service_role SELECT/INSERT/UPDATE only. anon HTTP 8 denial probes from B9C retained as prior evidence, not claimed rerun. These are compensating catalog evidence, not authenticated HTTP success.

## Gateway implementation

Shared server-side core now refreshes token in memory, checks exactly one expected channel before insert, initiates resumable upload and PUTs bounded MP4. Fixed private/category 10/madeForKids false; 2 MiB video ceiling and container ftyp/brand validation. Resumable Location is memory-only, never returned/stored/logged; exact Google HTTPS host/path validation, no redirects and no automatic retry. Provider raw bodies/exception text are not exposed.

Existing handler authorization/verified claims/AAL2/allowlist/exact Origin/body bounds retained. Default runtime remains validation_only. Real mode is additionally restricted to the exact approved Production project URL, so Staging cannot contact Google even if an activation flag exists. Server-only opt-in flag selects real mode; browser request cannot select mode. Service key stays server-side. No legacy shared upload secret used by new core.

Fingerprint covers video SHA-256 + normalized title/description + channel + private/category/kids values. DB user/key PK, user/channel advisory xact locks, partial UNIQUE unresolved-channel index, 3 requests/15 minutes. same-key/same-fingerprint returns existing sanitized state/result; mismatch 409. CAS accepted→uploading must commit before provider call. succeeded requires valid video ID. definite pre-insert failures→failed. Any insert reachability/PUT ambiguity→outcome_unknown. Crash/stale uploading/unknown never auto-release; new-key same-channel blocked. Terminal DB persistence failure leaves uploading unresolved and cannot cause retry.

Minimal responses contain safe decision/state, authorization/validation flags, private and confirmed videoId. Existing random request correlation field retained; no user/session identifier returned. Logs have fixed error event only, without credential/identifier/metadata/exception dump.

## Local / Staging verification

Node **89/89 PASS** (prior 70 unchanged + 19 real-upload tests). Tests cover provider mock success, refresh failure, channel rejection, MP4 input, immutable metadata, Location host/path denial, ambiguous failure/no retries, payload fingerprint, replay/mismatch, concurrent same-key at most one mocked provider call, unknown/channel block, terminal write failure, safe responses/logs and legacy closure. No live Google/YouTube communication.

Staging transactional DB test: BEGIN → candidate state DDL → service_role runtime assertions → catalog assertions → ROLLBACK. PASS. Tested reserve/replay/mismatch, accepted channel block, begin exactly once, stale uploading block, unknown block/non-reopen, invalid terminal rejection, success replay/no-reopen, failed replay, authenticated/anon effective denial and INVOKER/empty search_path/postgres owner. New candidate object cleanup=true; token/OAuth/Auth fixture counts=0. Existing migration objects retained.

This is real PostgreSQL runtime verification, **not** persistent migration application, HTTP Edge validation, or independent-connection concurrent DB proof. Existing OAuth concurrency/replay/atomic token rollback remain inherited B9B/B9C evidence. Candidate persistence/deploy validation still required.

Staging Deploy: **NONE**. No existing Staging Functions or safe authenticated fixture/allowlist path, and current paid feature/compute metadata is unavailable. Optional deployment was not performed merely to create an untestable endpoint; new real flag was never activated. Deno format/lint/typecheck: **DENO VALIDATION NOT AVAILABLE**; not a standalone RED gate.

Security advisor: existing two INFO RLS-enabled/no-policy only. [Official explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy). Browser grants remain denied; no policy added for server-only data.

## Legacy closure / rollback

Repository legacy index now serves fixed 410 tombstone for all requests without credential, DB or provider processing. Production deployed legacy version7 remains unchanged. Closure candidate tested locally. Cutover must deploy/verify tombstone BEFORE Gateway real activation. Rollback retains tombstone, sets Gateway validation-only, disables posting UI; never restores legacy real path. Attempts/unknown/video outcome records and DB migrations preserved. No token backup/read/reset assumed; successful OAuth cutover token retained if runtime rollback needed. No automatic video deletion/re-upload.

## Production READ-ONLY audit

Catalog only: token table ordinary table, owner postgres, bigint id PK, refresh_token text NOT NULL, updated_at timestamptz NOT NULL default now(), RLS true/policies 0. anon/authenticated table privilege false. service_role has existing broader privileges; no change. That ACL minimization is separate hardening and is not independently RED.

No B8 OAuth RPCs/transaction table exist. Production history lists eight existing TikTok migrations, no bootstrap/B8. No unrelated history edited. Exact selective manifest needed: repository strict bootstrap would reject existing broad ACL, so do not blindly db push or falsely mark it applied. Existing token table can be preserved for B8, but history/baseline compatibility must be settled using official workflow before applying pending migrations.

YouTube Function metadata: callback ACTIVE v8 verify_jwt=false; legacy upload ACTIVE v7 verify_jwt=false; gateway ACTIVE v12 verify_jwt=true; hardened OAuth Start not deployed. No runtime invocation/Secret value read. Secret-name existence cannot be retrieved with available connector; deployment plan lists expected names, existence is not falsely asserted.

## Billing

Fresh organization metadata `plan=free`, `tier=tier_free` at start and end. No upgrade/payment/compute/add-on/spend-cap changes. Current Spend cap, compute size, IPv4, PITR, custom domain and remaining paid Add-on configuration not exposed by connector. Earlier dashboard observations are not substituted for latest evidence. **Free confirmed; full current billing gate UNVERIFIED**. No billing operation performed, no new paid dependency introduced; incremental invoice/0-yen assertion unavailable.

## ONE-SHOT gate

| # | Gate | Result / evidence |
|---|---|---|
|1|Staging health|GREEN fresh ACTIVE_HEALTHY|
|2|Billing Free|GREEN fresh org plan|
|3|Spend cap enabled|RED latest metadata unavailable|
|4|Paid Add-on absent/free compute|RED latest metadata unavailable|
|5|Migration history safe|RED official repair auth/manifest pending|
|6|authenticated HTTP denial|RED HTTP fixture path unavailable; SQL denial confirmed|
|7|token write atomic rollback|GREEN inherited B9C real DB proof|
|8|RLS/ACL|GREEN fresh catalog; candidate transactional assertions|
|9|replay protection|GREEN prior OAuth + new local/DB sequential proof|
|10|OAuth concurrency <=1|GREEN inherited B9B proof; new upload DB parallel proof still pending|
|11|Gateway implementation complete for Production|RED candidate implemented; migration/deploy validation pending|
|12|Gateway local tests|GREEN 89/89 suite|
|13|legacy closure ready|GREEN repository tombstone; Production closure intentionally not executed|
|14|Production identity|GREEN fresh exact ref/health|
|15|token preservation plan|GREEN no token-row reads/writes/reset; atomic cutover retained|
|16|Production migration plan|RED exact history/bootstrap compatibility + new state apply/deploy pending|
|17|OAuth deploy plan|GREEN existing hardened artifacts/verify_jwt settings; Secret existence preflight required|
|18|scope/reconsent plan|GREEN upload + readonly approved scopes;本人操作 required later|
|19|channel verification plan|GREEN exactly one allowed channel; core also checks refreshed credential|
|20|private upload plan|GREEN one <=2 MiB MP4 via Gateway; current real API forbidden|
|21|rollback plan|GREEN safe disable/tombstone/unknown preservation|

Minimum blocker groups: (1) official history repair + exact Production migration manifest; (2) authenticated HTTP fixture/deployed Staging validation + new state independent-connection DB concurrency; (3) latest full Billing configuration evidence. Implementation is reviewable and tested, but these unresolved evidence gates prevent READY. No extra RED for absent Deno, known INFO or broad Production service_role ACL alone.

## Git validation / registration

All changed files limited to Gateway/shared core/state SQL, tests, legacy tombstone, readiness design and this report. Existing bootstrap/B8 source unchanged. Node regression PASS; git diff --check PASS; staged credential pattern scan PASS (known synthetic fixture identifiers are tests only). Scan is pattern-based, not a guarantee that every possible secret form is detected. Final registration SHAs and all-file GitHub SOURCE MATCH reported separately after registration. No Production Deploy, real OAuth/reconsent/channels.list/token exchange/upload, UI release or billing action.
