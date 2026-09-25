# YouTube Creator Studio

YouTube専用の投稿準備画面です。TikTok／Instagramの画面・設定・履歴・内部実装から分離しています。

## 現在の状態

- 動画（MP4）の選択・ブラウザ内プレビュー・ファイル名／サイズ表示
- タイトル／説明文の編集と最終確認
- 公開設定は `private` 固定。public／unlistedを選択するUIはありません。
- 明示確認欄と投稿状態表示を用意
- **実アップロードは未接続で、投稿ボタンは常に無効**

`index.html` はGitHub Pagesの静的ページです。現状の `youtube-upload` Edge Functionは `x-fieldrise-upload-secret` を要求しますが、その値をブラウザへ渡す実装は禁止されています。静的ページだけではそのヘッダーを安全に作れないため、この画面からEdge Functionへ直接アクセスするコードや、YouTube／Supabaseのトークンを含むコードはありません。

## 投稿を有効化する前に必要な安全設計

同一オリジンのサーバー側ゲートウェイを用意してください。例えば、ゲートウェイがサーバー管理の認証（Secure・HttpOnly・適切なSameSite cookie等）を検証し、認可済み利用者に限り、サーバー側だけで保存した `YOUTUBE_UPLOAD_SECRET` をEdge Functionへ付与します。ログイン保護、CSRF対策、短いセッション期限、リクエストサイズ制限、エラー応答の秘匿化も設計・テストしてください。ブラウザにはGoogle OAuth access／refresh token、Supabase service role key、アップロードsecretを返さないこと。

ゲートウェイのホスト先・認証／セッション方式・権限モデルが決まり、運用側で安全性を確認するまで、投稿ボタンは有効化しないでください。既存のYouTube OAuth scope、Client設定、refresh token、Supabase secrets値は本変更で参照・変更していません。

## ローカル確認

```sh
node --test tests/test_youtube_creator_studio.cjs
node --check automation/sns_auto_posting/youtube/creator-studio.js
git diff --check
```

ブラウザ内プレビューはローカルの選択ファイルからObject URLを生成し、画面を閉じると解放します。ファイルを外部へ送信しません。実アップロードテストは未実施です。
