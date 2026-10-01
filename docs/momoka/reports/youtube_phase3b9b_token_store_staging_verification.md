# Phase 3-B9B YouTube Token Store Staging Verification

Date: 2026-10-01
Staging: `FieldRise Staging` / `zjgmgwjeebphkbbqjbfi` / `ap-northeast-1`
Production: not accessed for database, token, Auth, Secret, RPC, or Function operations.

## Result

**STAGING VERIFIED WITH BLOCKERS**

The bootstrap and B8 migrations applied successfully to the intended Staging project. Catalog checks, ACL checks, state lifecycle assertions, replay/concurrency checks, expiry checks, and dummy cutover/rollback assertions passed. Two items remain before calling the overall migration path fully verified:

1. Supabase migration history recorded execution-time versions (`20261001115200` and `20261001115628`) while the repository migration filenames use `20260927080000` and `20260927084829`. The applied object names match, and the operations were each executed once. Do not run `db push` or replay these migrations until the migration history/version mapping has been reconciled without rewriting history.
2. A token-store write error was not induced by changing ACLs or adding temporary schema objects. The test did prove that a successful cutover followed by an outer transaction rollback preserves the old dummy and rolls the transaction finish back. A failure inside the token write itself remains unproven.

The Supabase migration tool applied both migration bodies successfully. One expired-fixture setup attempt was rejected by the table TTL check because the test used two slightly different clock reads; the statement rolled back without residue. The fixture was corrected to use one captured timestamp and all final assertions passed.

## Baseline and billing

- B9A formal ancestor: `b3700dc5e75cfacffebb92d2a9b6a1ce777ca824`.
- B9B starting `origin/main` and local `HEAD`: `01a21d0324ec40e47853c0013a2ec4a83331440b`.
- The intervening commits were AI secretary/reporting updates; no OAuth, Auth, Gateway, or migration conflict was found.
- Organization tier was `free` (`tier_free`); project remained `ACTIVE_HEALTHY`. Prior Staging dashboard evidence showed Free, spend cap enabled, `$0.00` past invoice/spend, NANO/t3.nano, and no paid compute/add-ons. No billing setting was changed and no paid feature was used.
- B9B did not read Production token data or issue any Production write. No Google, OAuth provider, YouTube API, upload, redeploy, Secret, or Auth-management operation occurred.

## Bootstrap migration

File: `supabase/migrations/20260927080000_youtube_oauth_token_store_bootstrap.sql`

- Migration version sorts before B8 `20260927084829_youtube_oauth_transactions.sql`.
- Applied once to Staging through the Supabase migration operation; result was success.
- Resulting relation: `public.youtube_oauth_tokens`, owner `postgres`, ordinary table, RLS enabled, no policies, zero rows after fixture cleanup.
- Columns: `id bigint NOT NULL`, `refresh_token text NOT NULL`, `updated_at timestamptz NOT NULL DEFAULT now()`; primary key is `id`.
- `anon` and `authenticated` have no SELECT/INSERT/UPDATE/DELETE or other direct table privileges. `service_role` has SELECT/INSERT/UPDATE only; no DELETE/TRUNCATE/REFERENCES/TRIGGER.
- Migration validation checks relation kind, owner, columns, default, primary key, RLS, policies, ACL grantees, and effective privileges. It does not insert or modify token rows.
- No Auth schema objects, custom roles, `BYPASSRLS` roles, `ALTER ROLE`, role memberships, owner escalation, `supabase_auth_admin` dependency, or Auth ACL change was introduced.

## B8 database audit

- B8 migration `20260927084829_youtube_oauth_transactions.sql` applied once after bootstrap; result was success.
- Created `youtube_oauth_private.transactions` and four public RPCs: `youtube_oauth_reserve`, `youtube_oauth_consume_state`, `youtube_oauth_finish`, `youtube_oauth_cutover_token`.
- Private schema and table owner: `postgres`. RLS is enabled on the transaction table; no policy exists. `anon`/`authenticated` have no schema USAGE or table SELECT. `service_role` has schema USAGE and SELECT/INSERT/UPDATE only on the transaction table.
- All four functions are owned by `postgres`, are SECURITY INVOKER (not SECURITY DEFINER), use an empty `search_path`, and grant EXECUTE only to `service_role`. Effective `anon`, `authenticated`, and PUBLIC EXECUTE checks were false.
- The catalog contained no Auth-session table dependency in these B8 objects. No function owner or managed Auth ownership/ACL was changed.
- The PostgREST schema setting was not exposed through the SQL connector (`current_setting('pgrst.db_schemas', true)` returned NULL). Browser denial was verified through effective PostgreSQL table/function/schema privileges, not by making HTTP calls to PostgREST.
- Standard Supabase `service_role` use is covered by the CTO approval in B9B. No custom bypass role or role escalation was used.

## Functional verification

All fixtures were generated inside Staging, contained no real user, Auth session, JWT, email, provider token, or Google data, and were removed after testing.

- Valid reserve and consume succeeded; malformed hash, out-of-range TTL, expired state, replay, and finished transaction were rejected.
- Expiry checks: before expiry succeeded; at the recorded expiry boundary and after expiry were rejected. The database enforced the five-minute maximum TTL; local regression also covers the JWT-expiry-bounded TTL behavior.
- Two concurrent consume requests against the same fixture returned success counts `1` and `0`; total successes were one.
- Dummy cutover rejected NULL, empty, whitespace-only, invalid transaction, and finished transaction cases. Valid cutover committed a new dummy (`NEW_DUMMY_COMMITTED`).
- An outer transaction rollback after a successful cutover preserved the previous dummy (`OLD_DUMMY_PRESERVED`) and rolled back the transaction finish. A low-level token-table write error was not directly forced (see blocker above).
- Token table contract matches the legacy `youtube-upload` runtime's expected `public.youtube_oauth_tokens(id, refresh_token)` lookup shape. No runtime upload or provider communication was exercised.
- Fixture cleanup left token row count `0` and transaction row count `0`. Bootstrap and B8 migration objects remain installed for review.
- Trust model remains Start-time AAL2 + short-lived capability. Callback-time AAL2 was not claimed or tested; callback completion after logout is covered by the existing local contract/tests and the B8 database has no session-table dependency.

## Security advisor and local validation

- Security advisor returned two INFO notices: RLS enabled with no policy on the token table and transaction table. This is the intended deny-by-default state; no unrelated warnings were changed.
- Node/YouTube/Creator Studio/DB contract/bootstrap regression: **70/70 passed** (B8 baseline 66, plus four bootstrap contract tests).
- `git diff --cached --check`: pass for the complete three-file staged change set.
- Credential-pattern scan (`eyJ…`, common Google/API key and OAuth access-token shapes): no matches. Dedicated `gitleaks`/`detect-secrets` binaries were unavailable.
- Deno was unavailable; no global install was attempted.

## Remaining blockers and boundaries

- Reconcile the migration history version mismatch before a future CLI `db push` or automated migration replay. Do not edit migration history as part of B9B.
- Token-table write-error rollback still needs a safe, reviewed staging method that does not broaden ACLs or leave schema changes.
- PostgREST HTTP denial was not directly probed; effective database grants deny browser roles.
- No Production migration/deploy or Production verification is included.

## B9B files

- `supabase/migrations/20260927080000_youtube_oauth_token_store_bootstrap.sql`
- `tests/youtube/test_token_store_bootstrap_contract.mjs`
- `docs/momoka/reports/youtube_phase3b9b_token_store_staging_verification.md`
