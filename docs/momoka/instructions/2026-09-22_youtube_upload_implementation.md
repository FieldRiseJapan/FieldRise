# 桃花 実装指示 — YouTube自動投稿

## 目的
FieldRise SNS Studio のYouTube自動投稿機能を、TikTok/Instagramとは分離して実装する。

## 現在地
- Google Cloud project: FieldRise YouTube (project id: fieldrise-youtube)
- YouTube Data API v3: 有効化済み
- OAuth Web client: 作成済み
- scope: https://www.googleapis.com/auth/youtube.upload
- テストユーザー: 登録済み
- Supabase callback: youtube-oauth-callback
- callback OAuth認証: 成功（"FieldRise YouTube authorization succeeded." を確認）
- OAuth Client ID / Client Secret はSupabase Secretsで管理。GitHubへ秘密情報を絶対に書かない。

## 実装
1. YouTube専用フォルダを使用:
   automation/sns_auto_posting/youtube/
2. TikTok/Instagramのコード・設定ファイルと混在させない。
3. Supabase側にYouTubeアップロード用Edge Functionを実装する設計を作る。
4. OAuth refresh token/access tokenはサーバー側のみで保存・更新し、ブラウザ/GitHubへ出さない。
5. YouTube Data API v3 videos.insert を使う。
6. 初回テスト投稿は privacyStatus=private 固定。
7. 社長が動画・タイトル・説明文を確認して明示的に投稿操作した場合だけアップロードする（Human-in-the-loop）。
8. フロント側は動画選択、タイトル、説明、公開設定、最終確認、投稿結果を表示。
9. エラー時に秘密情報をログ/レスポンスへ出さない。
10. READMEにセットアップ、テスト手順、既知の制約を記録。

## 完了報告
docs/momoka/reports/latest_report.md に以下6項目を報告:
1. 完了状況
2. 変更ファイル
3. SHA
4. Push先
5. 未完・ブロッカー
6. 次確認ファイル

## 注意
秘密値（Google Client Secret、access token、refresh token、Supabase private keys）はGitHubへ絶対に保存しない。
