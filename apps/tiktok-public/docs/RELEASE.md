# FieldRise public Inbox edition — implementation checkpoint

Date: 2026-10-11. This is not a completed Production application and no submission has been made.

## Architecture

Separate Sites project, D1 and R2. No connection to existing Supabase Production. ChatGPT sign-in is the account identity provider; agreeing to Terms registers the FieldRise account. Independent email/password signup is not implemented. TikTok Login Kit is a separate account connection.

Owner-filtered server queries protect drafts, assets, transfers and connections. No service key goes to the browser. Tokens use AES-GCM with owner ID as associated data. OAuth state is random, hashed, expires after ten minutes, single-use and bound to the signed-in user plus a Secure/HttpOnly/SameSite cookie. Requests that write data require same origin. Draft revisions prevent stale overwrites. Atomic transfer reservation plus idempotency prevent duplicate initializations. Ambiguous outcomes block automatic retry. Time-limited media capability URLs are available for two hours; no arbitrary remote URLs are fetched.

Only crop geometry is reused from the internal photo editor core.mjs at 21bf95b478f0333c9f74ba5673a28c1d90636e1b. Its seed, SoundOn information and localStorage are excluded. Existing MP4 API behavior informs payload/status handling, but its internal fragment session system and creator_info dependency are not used.

## Implemented / not yet verified live

- Authenticated registration, separate user data, drafts CRUD/duplicate/export, revision conflict.
- Photo selection (JPEG/PNG/WebP), crop, JPEG conversion, reorder/cover, text/tags, AI disclosure.
- MP4 upload and preview; video captions copied manually, never advertised as API transfer.
- Server OAuth/profile, encrypted tokens/refresh, photo/video PULL_FROM_URL Inbox adapter, consent, status/error handling, account deletion.
- Terms, Privacy, Support; existing published privacy contact reused.
- **Not live verified:** hosted sign-in, actual D1/R2 user flow, OAuth, Inbox photo/video, refresh, official sound selection, browser rendering and real operation recording. No mock is evidence of real API success.

## Runtime configuration

Provisioned only for this new project: SITE_ORIGIN, TOKEN_ENCRYPTION_KEY (secret), TIKTOK_ENABLED=false, TIKTOK_MODE=unconfigured, MEDIA_DOMAIN_VERIFIED=false.

Required to enable a controlled Sandbox test: correct Sandbox TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET (secret); registered HTTPS redirect URI `/api/tiktok/callback`; registered website/Terms/Privacy and verified public media prefix `/api/media/pull/`; approved/available Sandbox scopes and target-user eligibility. Do not copy or rotate existing Production secrets. Store values directly in protected runtime configuration, never in source or chat.

Production requires separate readiness and scope approval. Current code has no Direct Post endpoint and requests only user.info.basic + video.upload. No Portal scope changes have been made.

## Limits and lifecycle

Product limits (not assertions about maximum TikTok capability): 35 photos, JPEG 5 MiB each, MP4 50 MiB, 100 MiB/user, 1 GiB total reserved storage, 30 drafts/user, 5 transfer attempts/24h, one unresolved transfer/user. Assets retained until user deletion. Removing a draft does not silently delete shared assets. Temporary URLs expire without deleting the user's original. Failed streaming upload releases reservation. No automatic billing, payment integration or scheduled posting.

Local disconnect deletes local credentials. Users can revoke TikTok permission in TikTok settings. FieldRise account deletion removes its records/objects and does not delete their ChatGPT account or already transferred TikTok content. Infrastructure backups/logs follow providers' policies.

## Verification and risks

Run `node --test tests/*.test.*`, `node node_modules/typescript/bin/tsc --noEmit`, and the Sites build helper. API tests use SQLite plus fake TikTok/R2/auth, not Production. Current suite: 30 tests PASS (29 policy/API checks plus one real local Workers/D1/R2 streaming and isolation integration). Hosted browser UX and live TikTok need independent validation. Local Workers/D1/R2 integration passed. The managed environment has no advertised control-browser skill; the Sites skill prohibits improvising a preview browser, so browser QA has not been claimed.

Before rollout: verify hosted upload streaming (local Workers/R2 passed); validate MIME/codec/dimensions on actual media (current server checks signature/size; browser checks video metadata); exercise deletion/parallel-operation behavior and live OAuth revocation; inspect rate limits and abuse protection under realistic load. Cross-user access tests pass but are not a comprehensive external security audit.
