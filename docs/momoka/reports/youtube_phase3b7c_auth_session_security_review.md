# YouTube OAuth Phase 3-B7C: Auth Session Security Review

**Date:** 2026-09-27
**Decision:** REDESIGN READY WITH STAGING REQUIRED
**Scope:** Local code, tests, documentation, and GitHub main registration only. No database was changed.

## 1. Requested outcome and boundaries

B7C reviews how the OAuth callback proves that the Supabase Auth session bound at OAuth start is still present when the callback consumes state. Work starts from the formal B7B baseline (`40a1a5a851e6d5fa1d1ebc3f767b23b621e19357`).

The approved B7C scope prohibits applying migrations, creating fixtures, calling Google/OAuth/YouTube, deploying, or writing to Staging or Production. This report and the local migration candidate do not claim those operations occurred. Neither Staging nor Production was written to in B7C. No paid plan or add-on was enabled; the design remains Free-compatible.

## 2. B7B evidence used

B7B attempted the migration once in Staging and it rolled back at `ALTER FUNCTION ... OWNER TO supabase_auth_admin` with `must be able to SET ROLE "supabase_auth_admin"`. It was not retried. The subsequent read-only inspection found no migration history entry or partial OAuth objects, and Auth user count remained zero. Production was untouched. Staging was observed as Free and `ACTIVE_HEALTHY`.

At that inspection, the migration executor was `postgres` (`rolsuper=false`, `rolbypassrls=true`); `supabase_auth_admin` was not superuser and did not have BYPASSRLS, owned `auth.sessions`, and had SELECT/UPDATE on that table. `auth.sessions` had RLS enabled. These are B7B observations and must be rechecked in B7D before applying anything.

## 3. Official documentation review

Supabase recommends `SECURITY INVOKER` for ordinary database functions. A `SECURITY DEFINER` function executes as its owner; Supabase recommends an empty `search_path` and fully qualified object names when a definer function is necessary. PostgreSQL grants function execution to PUBLIC by default, so execute rights should be revoked and granted to the intended role only. Sources: [Supabase Database Functions](https://supabase.com/docs/guides/database/functions), [PostgreSQL CREATE FUNCTION](https://www.postgresql.org/docs/current/sql-createfunction.html).

Supabase documents `postgres` as the default administrative database role, `service_role` as an API role that bypasses RLS, and `supabase_auth_admin` as the role used by Auth middleware for Auth schema operations. Supabase also says Auth schema entities should be owned by `supabase_auth_admin`; changing their ownership can break future migrations. B7C does not change Auth object ownership or grant application roles direct access to `auth.sessions`. Sources: [Supabase Database Roles](https://supabase.com/docs/guides/database/postgres/roles), [Supabase Database Permissions](https://supabase.com/docs/guides/database/postgres/permissions).

Supabase documents that a session ID is present in the access JWT and can be matched to `auth.sessions`; a session row can be checked for sensitive operations. It also documents that revoking a session does not invalidate an already-issued access JWT before its expiry. `getUser()` makes an Auth server request and requires a JWT/current user context; it does not combine an Auth revocation check and this application's database consume in one transaction. Sources: [Managing User Sessions](https://supabase.com/docs/guides/auth/sessions), [Server-Side Auth](https://supabase.com/docs/guides/auth/server-side/creating-a-client), [JavaScript getUser](https://supabase.com/docs/reference/javascript/auth-getuser), [JavaScript signOut](https://supabase.com/docs/reference/javascript/auth-signout).

The OAuth callback receives the provider callback query and currently has no Supabase user JWT or cookie available to it. Adding a separate `getUser()` call would therefore require a new identity handoff and would still leave a check-then-consume race. The reviewed official documentation did not identify an Auth endpoint that atomically checks live session revocation together with the application's state consumption. This is a bounded documentation finding, not a claim that no such mechanism could exist in every Supabase setup.

## 4. Candidate assessment

| Candidate | Security and behavior | Cost and plan fit | Decision |
| --- | --- | --- | --- |
| A. Private, narrow `SECURITY DEFINER` capability helper; default migration owner; atomic session-row lock and consume | Keeps the live session-row check and state consume in one database transaction. Does not grant `service_role` direct `auth.sessions` SELECT or change any managed Auth owner/ACL. The helper returns only a boolean, has a pinned empty search path, uses qualified static SQL, and is executable only by `service_role`. Its default owner is powerful (`postgres` in observed Staging), so its code and grants must remain tightly constrained and be verified in Staging. | Database function and row lock use existing Postgres; no new service, paid feature, or plan upgrade. | **Selected for local candidate.** Most faithful to logout/revocation semantics under the current callback architecture. Requires B7D Staging proof. |
| B. Edge `getUser()` followed by a normal database consume | Callback currently has no user JWT. Introducing one changes the OAuth handoff. Even after that, Auth check and consume are separate operations and can race with session revocation. | Auth request and application DB request; no paid feature required, but extra flow complexity. | Rejected: does not preserve atomic session validation. |
| C. Store verified `user_id`, `session_id`, and JWT expiry at start; consume by expiry only | Avoids Auth table privileges, but a callback can finish after the user has logged out while the short transaction TTL remains valid. TTL limits the interval but does not eliminate it. | Existing DB only; Free-compatible. | Rejected: weakens revocation semantics. |
| D. Direct `service_role` access to `auth.sessions`, extra role membership, or ownership transfer to `supabase_auth_admin` | Gives broader standing access or changes managed Auth privilege/ownership. The B7B transfer failed because the migration runner could not `SET ROLE`; direct grants conflict with least privilege and may complicate Auth upgrades. | No required paid service, but unacceptable privilege/upgrade risk. | Rejected. No such grants or role changes are in B7C. |

## 5. Local redesign

The migration candidate at `supabase/migrations/20260927084829_youtube_oauth_transactions.sql` removes the grant of `USAGE, CREATE` on `youtube_oauth_private` to `supabase_auth_admin`, removes the helper ownership transfer and schema CREATE revocation, and leaves the helper owned by the migration executor that creates it. The observed Staging executor was `postgres`; the production migration runner and resulting owner still need confirmation in B7D.

The helper remains `SECURITY DEFINER`, `SET search_path = ''`, and references `auth.sessions` with a fully qualified name. It selects only the matching row's `id` using both `id = p_session_id` and `user_id = p_user_id`, locks that row `FOR SHARE`, and returns only `boolean`. Its execute grant is revoked from `PUBLIC`, `anon`, and `authenticated`, then granted to `service_role`. No `SELECT` grant is added to `service_role` or `postgres` on `auth.sessions`; no role membership is added; no Auth schema/table/function owner or ACL is changed.

The public reserve/consume/finish/cutover RPCs remain `SECURITY INVOKER`, use an empty search path, and have execute granted only to `service_role`. The consume path locks the OAuth transaction row and then the bound Auth session row before marking the state consumed. A missing or mismatched session leaves the OAuth state unconsumed. This design does not make the migration production-ready; the default owner and actual privileges must be verified against the target project before any later application.

## 6. Tests and local verification

- Test-first contract change: before the SQL change, the test failed because the migration transferred helper ownership to `supabase_auth_admin`.
- After the SQL change: `tests/youtube/test_oauth_db_contract.mjs` passed, 8/8.
- Related OAuth, Auth, gateway, and Creator Studio regression set passed, 64/64 Node tests.
- No live DB test, migration apply, Deno test, provider call, or deploy was run in B7C. Deno was unavailable in the local environment.
- `git diff --check` passed. A scan for credential-shaped values passed; the migration contains only the refresh-token parameter and existing cutover SQL, not a token value.
- Final repository and branch checks are part of the formal registration record below.

## 7. Required B7D Staging gates

Before any Staging apply, independently verify and record:

1. The migration executor and the created helper's actual owner; confirm the planned runner creates it as the expected role without an ownership transfer.
2. Exact helper ACL: only `service_role` can execute; `PUBLIC`, `anon`, and `authenticated` cannot. Confirm there is no direct `service_role` table privilege on `auth.sessions`, no new membership, and no managed Auth ownership change.
3. The private schema is not exposed through PostgREST, while the intended public RPCs remain callable only with server-side service credentials.
4. Helper behavior for a matching session, absent session, wrong user/session pair, and revoked session; confirm the row lock coordinates with session deletion/update.
5. Concurrent/replayed callbacks consume a transaction only once; missing session does not consume state; expired and already-finished state remains rejected.
6. Token cutover rollback behavior and existing-token preservation using dummy credentials only. Do not call Google or write a real refresh token.
7. Migration rollback/no-partial-object behavior and no unexpected Auth users or rows. Do not inspect or disclose session values.
8. Free plan and billing state immediately before and after the authorized Staging window; stop if an upgrade or paid add-on is required.

If the actual owner is broader than expected, ACLs differ, or these checks cannot be demonstrated, stop and mark the helper `SECURITY REVIEW REQUIRED`; do not compensate with role membership or wider Auth grants.

## 8. B7C registration record

The formal B7B base SHA is `40a1a5a851e6d5fa1d1ebc3f767b23b621e19357`. The B7C change set contains only this report, the migration candidate, and its contract test. No Staging/Production writes, migration apply, fixtures, deployments, Google/OAuth/YouTube calls, or billing changes are in scope or were performed.
