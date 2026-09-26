# YouTube Studio 認証準備画面

GitHub Pages の `/FieldRise/automation/sns_auto_posting/youtube/auth/` に置く独立画面です。投稿機能には接続しません。

- 通常ログインは Magic Link の `shouldCreateUser: false`。最初の本人登録ボタンだけ `true` を指定します。
- 既定の Magic Link テンプレートに合わせて implicit flow を使用します。callback は SDK がセッションを確立した後、URL の fragment/query を履歴から取り除きます。
- TOTP の QR はブラウザ内に一時表示し、登録時の factor ID もページ内メモリのみで扱います。登録済み factor は Supabase Auth API から取得します。
- AAL は Supabase Auth の `getAuthenticatorAssuranceLevel()` で確認します。AAL2 表示は投稿許可や投稿成功を意味しません。
- `public-config.mjs` は Project URL と公開用 publishable key だけを含みます。値を Secret として扱うサーバー設定はここへ追加しません。

Auth 設定変更は未実施です。配置後、Site URL を `https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/youtube/` に変更し、Redirect URL に `https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/youtube/auth/callback.html` を追加する計画です。変更前に別途承認を受けます。本人登録とメール送信も未実施です。
