# FieldRise Creator Studio — public Inbox edition

Isolated public-service implementation. See docs/RELEASE.md for verification limits and deployment gates; docs/REVIEW_PUBLIC.md for the candidate review text/storyboard.

Public APIs do not use the existing internal Supabase. No internal posting data or SoundOn seeds are bundled. Uses Sites-hosted ChatGPT sign-in, owner-scoped D1 records and R2 media. Only user.info.basic + video.upload are requested. TikTok is disabled until correct credentials, redirect/domain verification and live Sandbox validation.

## Checks

- `node --test tests/*.test.*`
- `node node_modules/typescript/bin/tsc --noEmit`
- Sites build helper: `node <sites-plugin>/scripts/build-site.mjs`

The tests do not send content to TikTok. The Workers integration test substitutes authentication only in its temporary in-memory bundle; that test entry is not deployed.

Runtime secrets must be set via the hosting environment, never committed. Deployment source is synchronized to a dedicated FieldRise GitHub branch as well as the Sites source repository. Existing internal services are unchanged.
