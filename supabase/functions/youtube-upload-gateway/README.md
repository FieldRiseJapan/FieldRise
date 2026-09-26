# YouTube upload gateway — Phase 1

This function validates a Supabase Auth user JWT and a small multipart request. It does **not** call Google or YouTube, and it does not save video content. Creator Studio's posting button stays disabled.

## Boundaries

- Hosted function setting: `verify_jwt=true` in `supabase/config.toml`; the handler additionally calls Supabase Auth `getClaims(jwt)` and authorizes verified `role`, `sub`, `is_anonymous`, `aal` claims.
- Server-only `YOUTUBE_GATEWAY_ALLOWED_USER_ID`: the single permanent Auth user's UUID, configured outside GitHub. An absent or invalid UUID fails closed. No user metadata or email authorization.
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` are used to verify Auth claims; `SUPABASE_SERVICE_ROLE_KEY` is used only inside the Edge runtime for the atomic DB state RPC. No existing YouTube credentials are read.
- Exact browser Origin `https://fieldrisejapan.github.io`; CORS does not replace authorization and cannot distinguish paths on the same GitHub Pages origin.
- Test-only video cap: 2 MiB, with a separate 2 MiB + 16 KiB request cap. This is not a production upload limit. No actual upload is wired.
- The SQL in `schema.sql` is **not yet applied**. Apply and review it before deploying the function. The atomic per-user transaction lock coordinates all Edge instances; repeated keys, one active processing request, and a maximum of three attempts per 15 minutes are enforced in DB. If RPC is unavailable, requests fail closed. A failed finish leaves a processing lease for up to two minutes; the same key remains permanently reserved. Retention/cleanup policy remains for a later phase.

## Deployment gate

Review the SQL grants, Auth Email OTP/TOTP settings, the single server-side allowlist value, and tests before any deployment. Deploy only this new function with JWT verification enabled. The existing `youtube-upload` and `youtube-oauth-callback` are not touched. The frontend must never send `x-fieldrise-upload-secret` or any Google credential.

Phase 1 responds with `status: validation_only`, `authorized`, `validated` and fixed `privacyStatus: private`; this acknowledges gateway validation only, never a YouTube upload. It has no `videoId`. The next phase needs measured size/runtime limits, production idempotency lifecycle, a safe upload module, old endpoint closure and callback state binding before posting can be enabled.
