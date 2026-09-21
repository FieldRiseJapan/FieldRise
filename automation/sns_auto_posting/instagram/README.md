# Instagram automation

Instagram-specific automation files for FieldRise SNS Studio.

Platform-specific configuration, API integration, test assets, and publishing workflow for Instagram are kept separate from TikTok and YouTube.

## Instagram API publish test

**Status:** SUCCESS  
**Date:** 2026-09-21  
**Account:** `runa_girl8215`

The end-to-end Instagram API publishing test completed successfully.

Verified flow:

1. Test image hosted publicly through GitHub Pages.
2. Supabase Edge Function authenticated with the Instagram API using a server-side secret.
3. Instagram media container creation succeeded.
4. The publish action was executed only after explicit user confirmation.
5. Instagram API returned `ok: true` and `published: true`.
6. The published image was visually confirmed on the Instagram account.

### Safety / architecture

- Instagram credentials and access tokens remain server-side in Supabase Secrets.
- No access token is stored in this repository or exposed to the browser.
- Container creation and publishing are separated so publishing requires an explicit action.
- Instagram implementation remains isolated under `automation/sns_auto_posting/instagram/`.
- TikTok and YouTube implementations remain separate.

### Next step

Build the Instagram section of FieldRise SNS Studio so the user can select prepared media, review generated caption/hashtags, explicitly approve, and publish without manually operating the Supabase test interface.
