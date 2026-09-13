# TikTok Auto Posting — Setup Status

最終更新: 2026-09-13

## 目的

FieldRise SNS Auto Posting の① TikTokについて、SandboxでのOAuth、Content Posting API、Direct Post、トークン自動更新基盤の構築・検証状況を記録する。

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

### 残作業

- Cronの実自動起動ログ確認
- Access Token残り12時間以下で実際にRefreshが成功することを確認
- Production用の投稿UI/確認フロー実装
- Production App設定の復旧・最終確認
- App名のReview適合性確認
- App icon / Category / Description / Terms / Privacy / Web URL確認
- Login Kit / Content Posting API / Direct Post / scopes確認
- TikTok App Review用デモ動画と説明準備
- Production審査・監査完了後、公開アカウント向け運用へ移行

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

RLSを有効化し、OAuth tokenはサーバー側のみで扱う。

### Edge Functions

- `tiktok-oauth-start` — OAuth開始、state生成
- `tiktok-oauth-callback` — authorization code交換、token保存
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

Sandboxで投稿成功しただけではProduction自動投稿完成とはしない。

Productionでは、TikTok Content Posting APIの要件に合わせて、投稿前プレビュー、編集可能な投稿文/ハッシュタグ、プライバシー選択、interaction設定、明示的な投稿同意、必要に応じたCommercial Content disclosure、投稿結果/失敗状態の表示を実装する。

Production App Reviewが完了するまでは、①TikTokの最終完了判定を行わない。

## 次の確認

1. Cronの自動実行履歴を確認
2. Token残り12時間以下のタイミングで `refreshed` を確認
3. Production向け投稿フローを実装
4. Production App Review準備
5. TikTok完了後、② Instagramへ進む
