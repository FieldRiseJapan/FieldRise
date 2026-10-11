# Public edition review package — do not submit yet

## Candidate products and scopes

Login Kit + Content Posting API, user.info.basic (account display) and video.upload (photo/video Inbox). No video.publish or Direct Post. Existing Portal scopes are unchanged and unverified because login is required.

## 日本語申請草案（実機試験完了後に事実を再確認すること）

FieldRise Creator Studioは外部のクリエイターが自分の写真・動画を準備するWebサービスです。利用者はChatGPTによるサインイン後にFieldRiseに登録し、自分のTikTokアカウントをLogin Kitで接続します。user.info.basicで取得した表示名・アバターを接続先の確認に使用します。写真のトリミング・並べ替え、タイトル・説明文の編集、動画プレビュー、個人の下書き保存を提供します。利用者の明示的な同意後にvideo.uploadでTikTok Inboxへ送信し、状態を表示します。写真はMEDIA_UPLOAD、動画はInbox uploadを使用します。動画の説明文はコピーしてTikTok内で入力します。最終編集、利用可能な音源の選択、公開は利用者がTikTok内で行います。Direct Post、予約公開、自動音源指定は提供しません。

注意：現時点ではTikTok接続設定と実機試験が未完了。上記を「稼働確認済み」として提出しない。

## English draft (verify all claims after live testing)

FieldRise Creator Studio is a web service for external creators to prepare their own photos and videos. Users sign in with ChatGPT, register with FieldRise, and separately connect their own TikTok account through Login Kit. We use user.info.basic to display the connected account's display name and avatar. Users crop and order photos, edit captions, preview videos, and save private drafts. After explicit consent, video.upload transfers their selected content to TikTok Inbox and we show the reported transfer status. Photos use MEDIA_UPLOAD; videos use the Inbox video upload endpoint. Video captions are copied for entry inside TikTok. Users complete editing, select an available sound, and publish inside TikTok. We do not provide Direct Post, scheduled publication or automatic official-sound selection.

Current status: TikTok runtime configuration and end-to-end testing are incomplete. Do not submit this as a statement of verified operational readiness.

## Actual-operation demo storyboard

Record the deployed public edition, readable 1920x1080 target, MP4 under 50 MB; maximum five review videos per official guideline. Hide email/password, tokens and developer credentials. Capture actual screens; no fabricated success frames. Do not reuse the eight-second title movie.

1. 0:00–0:30 Public home, actual features, Terms/Privacy/Support; identify Sandbox test environment.
2. 0:30–1:15 Sign-in and FieldRise registration (credentials entry omitted safely); Login Kit consent, return and display of real TikTok name/avatar. Explain user.info.basic.
3. 1:15–2:00 Select actual rights-cleared image, crop, JPEG preview, reorder, title/description, save. Show real connected target and explicit consent.
4. 2:00–3:00 Send photo to Inbox with video.upload; show actual processing and actual inbox result. In TikTok demonstrate continued editing and sound choice if available. Do not publish.
5. 3:00–4:00 Select MP4, preview, explain caption copy, consent, actual Inbox transfer/status. This requires specific permission for Sandbox transfer.
6. 4:00–4:30 Show history/errors and disconnect. Distinguish Inbox arrival from publication. If a scope path cannot be demonstrated, mark missing and do not claim readiness.

## Feedback response

- Prior Scopes mismatch: new real end-to-end demo required; pending.
- Prior demo legibility: high-resolution recording required; pending.
- Icon consistency: already completed, unchanged asset reused; no repeated investigation.
- Private-only use: now implementing genuine external-user service, not merely rewriting application text. Hosted multi-user and API testing remain pending.

## Submission checklist

[ ] Public end-to-end user journey confirmed with two isolated users.
[ ] Real Sandbox OAuth, basic profile, token refresh, photo/video Inbox demonstrated.
[ ] Verified media domain and callback; current Portal products/scopes inspected.
[ ] Actual video watched end-to-end, readable and contains no credentials.
[ ] Sound-selection limitations accurately disclosed; no royalty promise.
[ ] App description, website and scope list match real deployment.
[ ] President reviews URL, tests, impact, final JA/EN text and video.
[ ] President explicitly approves final submission.
[ ] Submit, then record Portal receipt/status/time/evidence (not yet done).

## Official references checked 2026-10-11

- https://developers.tiktok.com/docs/en/app-review-guidelines
- https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content
- https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post
- https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide
- https://developers.tiktok.com/docs/en/login-kit-web
- https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info

App Review disallows private/personal and still-in-development/testing apps. An incomplete public preview is not ready for submission. Photo upload requires verified public URLs, MEDIA_UPLOAD and video.upload. Official media guide lists JPEG/WebP; PNG input here is converted to JPEG. Creator Info/video.publish are intentionally unnecessary for Inbox.
