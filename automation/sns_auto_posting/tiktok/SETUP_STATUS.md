# TikTok Auto Posting — Setup Status

最終更新: 2026-09-13

## 目的

FieldRise SNS Auto Posting の① TikTokについて、SandboxでのOAuth、Content Posting API、Direct Post、トークン自動更新基盤、Production審査用Creator Studio UIの構築・検証状況を記録する。

> セキュリティ方針: Client Secret / Access Token / Refresh Token / 一時テストキー等の秘密情報はGitHubへ保存しない。

## 現在の状態

### 完了

- TikTok Developer App / Sandbox設定
- Sandbox Target User: Runa-Girl8215
- Login Kit OAuth接続
- Supabase OAuth callback / start Edge Functions
- OAuth tokenのサーバー側保存
- `user.info.basic`, `video.publish`, `video.upload` の認可確認
- TikTok User Info API実接続成功
- Content Posting API Creator Info取得成功
- Direct Post初期化成功
- FILE_UPLOADによるMP4転送成功
- `SELF_ONLY` 投稿テスト
- 投稿ステータス `PUBLISH_COMPLETE` を確認
- TikTok Access Token自動更新用Edge Functionを実装
- 6時間間隔のCronを設定
- Refresh実行履歴を記録する監視ログ基盤を実装
- 一時的なSandbox投稿テスト用公開入口を閉鎖しJWT必須へ変更
- Production AppのBasic information設定
- Production AppにLogin Kit / Content Posting APIを追加
- Production Direct PostをON
- Production scopes: `user.info.basic`, `video.publish`, `video.upload`
- Production Redirect URI設定
- Production App icon / Category / Description / Terms / Privacy / Web URL設定
- 審査用FieldRise Creator Studio TikTok投稿UIをGitHub Pages用に実装
- Creator Studio用の短時間セッションをOAuth callbackで発行する方式を実装
- Creator Studio APIをSupabase Edge Functionとして実装
- 投稿前プレビュー、Caption、Privacy、Interaction、Commercial disclosure、AI-generated content、明示的同意、投稿状態表示をUIへ実装

### 残作業

- GitHub Pagesへ反映されたCreator Studio UIの実ブラウザ確認
- 新UI経由でSandbox Login Kit OAuthを再実行
- 新UI経由でCreator Info取得を確認
- 新UI経由でMP4投稿し `PUBLISH_COMPLETE` を確認
- App Review説明文の最終入力
- TikTok App Review用デモ動画を録画・アップロード
- `Submit for review` 実行
- Cronの実自動起動ログ確認
- Access Token残り12時間以下で実際にRefreshが成功することを確認
- Production審査・監査完了後、公開アカウント向け運用へ移行

## Creator Studio UI

GitHub Pages配置:

`automation/sns_auto_posting/tiktok/index.html`

想定公開URL:

`https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/tiktok/`

### UI実装内容

1. TikTok Login Kit接続
2. 接続Creatorのnickname / username / avatar表示
3. MP4選択（審査UIでは最大50MB）
4. ローカル動画Preview
5. Caption / hashtags編集
6. TikTok Creator Info APIが返すPrivacy候補から手動選択
7. Comments / Duet / Stitch設定
8. Creator側でInteractionが無効の場合はUI側も無効化
9. AI-generated content設定
10. Your brand / Paid partnership disclosure
11. 投稿内容を確認したことを示す明示的Consent
12. ユーザーが `Post to TikTok` を押した場合のみ投稿開始
13. `PROCESSING_UPLOAD` から最終状態までStatus polling
14. `PUBLISH_COMPLETE` / `FAILED` をUI表示

Privacyは初期値を自動選択せず、TikTok APIから取得した利用可能な選択肢からユーザーが手動で選ぶ。

## Creator Studio セキュリティ設計

OAuth callback成功後、TikTok Access Token / Refresh Tokenそのものはブラウザへ渡さない。

代わりに、30分有効のランダムなCreator Studio session tokenを発行し、DBにはSHA-256 hashのみ保存する。

ブラウザ側ではOAuth callbackからGitHub PagesへURL fragmentで一時sessionを渡し、`sessionStorage`へ保存した後、fragmentをURLから除去する。

Creator Studio APIは以下を確認する。

- Originが `https://fieldrisejapan.github.io` であること
- `x-fieldrise-session` が有効で期限内であること
- 投稿Status確認時は同じCreatorのpublish jobであること

TikTok Access Token / Refresh Token / Client SecretはSupabase側のみで扱う。

## Supabase構成

Project ref: `nmkcjtrllzkwjxmjromw`

### Database

`public.tiktok_oauth_tokens`

保持項目:
- open_id
- access_token
- refresh_token
- scope
- token_type
- expires_at
- refresh_expires_at
- updated_at

`public.tiktok_creator_studio_sessions`

- session_hash
- open_id
- expires_at
- created_at
- last_used_at

`public.tiktok_creator_studio_publish_jobs`

- publish_id
- open_id
- created_at

各テーブルはRLSを有効化し、秘密情報はサーバー側のみで扱う。

### Edge Functions

- `tiktok-oauth-start` — OAuth開始、state生成
- `tiktok-oauth-callback` — authorization code交換、token保存、Creator Studio session発行、GitHub Pagesへ戻す
- `tiktok-creator-studio-api` — Creator Info / Direct Post / Status確認をCreator Studio UIへ提供
- `tiktok-api-test` — API疎通確認。現在JWT必須
- `tiktok-token-refresh` — Access Token更新処理。現在JWT必須
- `tiktok-sandbox-post-test` — Sandbox投稿検証用。検証後に閉鎖/JWT必須化
- `tiktok-post-status-test` — 投稿ステータス検証用。検証後に閉鎖/JWT必須化

## Token Refresh設計

- Cron: 6時間間隔
- Access Token残り時間が12時間より多い場合: `skipped`
- 12時間以下の場合: TikTok OAuth token endpointへRefresh Tokenを送信
- 新しいAccess Token / Refresh Token / 有効期限をDBへ保存
- TikTokからRefresh Tokenが更新された場合は必ず新しい値を保存
- 実行結果を監視ログへ記録

想定ログ状態:
- `skipped` — Tokenがまだ十分新しい
- `refreshed` — 更新成功
- `refresh_failed` — TikTok側の更新失敗
- `exception` — システム側例外

## Direct Post実証結果

2026-09-13、Sandbox Target User `Runa-Girl8215` を対象に実投稿試験を実施。

確認結果:

```text
Creator Info: SUCCESS
Privacy: SELF_ONLY
MP4 Upload: SUCCESS
fail_reason: null
Final status: PUBLISH_COMPLETE
```

これにより、以下の経路が実際に動作することを確認した。

```text
Runa-Girl8215
  ↓ OAuth
Supabase
  ↓ stored token
TikTok Content Posting API
  ↓ Direct Post / FILE_UPLOAD
TikTok processing
  ↓
PUBLISH_COMPLETE
```

未審査Sandbox Clientの制限により、実投稿検証時は対象TikTokアカウントを一時的に非公開とし、`SELF_ONLY` で検証した。

## Production移行時の重要事項

Production App Reviewが完了するまでは、①TikTokの最終完了判定を行わない。

Production審査では、実装したCreator Studio UIを使って以下のend-to-end flowをデモ動画で示す。

```text
FieldRise Creator Studio
  ↓ Connect TikTok
TikTok Login Kit authorization
  ↓
Connected creator info
  ↓
Select MP4 / Preview
  ↓
Caption / Privacy / Interaction / Disclosure
  ↓
Explicit consent
  ↓ Post to TikTok
Content Posting API
  ↓
PUBLISH_COMPLETE
```

## 次の確認

1. Creator Studio公開URLをブラウザで開く
2. `Connect TikTok` を実行
3. Runa-Girl8215のCreator情報がUIへ表示されることを確認
4. テストMP4を選択し、Preview / Privacy / consentを確認
5. UIからSandbox Direct Postを行い `PUBLISH_COMPLETE` を確認
6. この一連の操作をApp Review用Demo videoとして録画
7. App Review説明文と動画を設定してSubmit for review
8. 並行してToken refresh Cronログと実Refresh成功を確認
