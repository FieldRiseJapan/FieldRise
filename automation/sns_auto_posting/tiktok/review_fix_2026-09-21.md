# TikTok Production Review Fix Log

## 2026-09-21 — Reviewer feedback remediation

Reviewer feedback:
- Demo video images were pixelated; use high-quality images.
- App icon was not displayed on the Privacy Policy and Terms of Service pages.
- App icon must also be visible in the browser tab as a favicon.

Completed in GitHub:
- Added `assets/fieldrise-creator-studio-icon.svg`.
- Added FieldRise Creator Studio app icon to the top/header of `privacy.html`.
- Added FieldRise Creator Studio app icon to the top/header of `terms.html`.
- Added favicon declarations to both pages.
- The icon asset uses the existing high-quality source image stored at `automation/sns_auto_posting/instagram/26.jpg`, cropped to a square presentation.

Still required before resubmission:
- Replace/re-record the TikTok review demo video using high-quality source images/video so the submitted demo is not pixelated.
- Verify the deployed GitHub Pages Privacy Policy and Terms pages visually after Pages deployment.
- Then resubmit the TikTok production review.

Security:
- No TikTok credentials, access tokens, refresh tokens, or client secrets are stored in this file.


## Final public-page icon fix
- Privacy Policy and Terms pages now reference the public high-quality JPG directly: `automation/sns_auto_posting/instagram/26.jpg`.
- The same JPG is used for the browser favicon declaration.
- This replaces the SVG-wrapper reference that failed to render the embedded image reliably on GitHub Pages.
- Commits: privacy `b7cb5a036c90d31034c44cb60b3761c033639905`, terms `06f221c2140df44c292c9d3b88a5e91165af9382`.
