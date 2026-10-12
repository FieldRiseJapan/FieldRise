# Sites Secret設定・OAuth再開手順（2026-10-12）
対象Site: appgprj_6acb0c3677d88191b7fc6ca303bcf3d7
公開URL: https://fieldrise-creator-studio.wryrice16.chatgpt.site
Sandbox: FieldRise Public Inbox Test / 7695356222514235410
対象ユーザー: runa_girl8215（Portal登録確認済み）

## 正式な入力経路
公式資料：https://learn.chatgpt.com/docs/sites （Configure runtime environment values）
ChatGPTのSites一覧 → 対象Site → More actions → Settings。所有者が hosted environment variables / secrets を直接登録する。設定保存後は承認済みsaved versionの再デプロイが必要。
現アカウントの具体的なボタン配置は未実機確認。SettingsにSecret項目が見当たらない場合、値をチャット・添付ファイルへ渡さず、非秘密の画面ラベルだけ確認する。別サービスへ転送しない。

## 社長が入力する2項目
- TIKTOK_CLIENT_KEY：今回の新SandboxのClient key。保管上はSecret扱いにする。
- TIKTOK_CLIENT_SECRET：今回の新SandboxのClient secret。Secret扱いにする。
値は社長が管理画面に直接入力。AIによる取得・読み取り・表示・ログ出力を行わない。既存Production/社内Sandboxの値を流用しない。
TOKEN_ENCRYPTION_KEYは既にSecretとして登録済み。変更・再生成しない。
TIKTOK_ENABLED=false、MEDIA_DOMAIN_VERIFIED=falseは入力時点では維持する。TIKTOK_MODEは接続有効化時にsandboxへ変更する。

## 確認済みの構成
環境revision1。2つのTikTok資格情報は未登録。暗号鍵は is_secret=true、値null（非表示）。
稼働saved version1のsource SHA: c68e93f0471c432d432aa1bccc6de2496afe5711
GitHub確認head: 2926e4dabf02b5cf214b23edeb511c07c676bfbe
Sites sourceとGitHub apps/tiktok-publicの134ファイルはbyte単位ですべて一致（2026-10-12）。別Gitリポジトリの履歴なのでSHA自体は一致しない。報告書追記によるGitHub head更新はアプリの変更ではない。

## OAuthコード確認（実API未検証）
Callback: /api/tiktok/callback。Portalの保存URLと完全一致。
要求scope: user.info.basic,video.upload。video.publish要求なし。
ChatGPTユーザー認証とFieldRise登録を開始・Callback両方に要求。
state: 暗号学的乱数32bytes、SHA256をDB保存、10分、owner結合、CallbackでDELETE RETURNINGして一度限り。
cookie: Secure, HttpOnly, SameSite=Lax, Path=/api/tiktok, Max-Age600。
token交換はサーバー側。Client SecretをAPIの応答に含めない。
access/refresh tokenはAES-GCM、ownerを追加認証データとして暗号化。プロフィールAPIのopen_id一致を確認。
匿名利用・他ユーザー・期限切れ/再利用stateの拒否は既存テストに含む。既存30件を再実行していない。
Client keyはOAuthのclient識別子であり、TikTok認証URLへ含まれる設計。Client Secretと同じ非公開性を保証する値ではない。公開コードへの埋め込みはない。
サーバーコードにconsole出力なし。プラットフォームのリクエストURL/ログの秘匿は未実機確認。認証コード・stateをスクリーンショット/ログとして収集しない。

## 入力後の残作業
1. メタデータのみで2項目の存在とis_secretを確認（値を取得しない）。
2. TIKTOK_MODE=sandboxとOAuth有効化を設定し、既存saved versionを再デプロイ。既存Supabaseは触らない。
3. サインイン済み社長ユーザーからOAuth開始、権限画面の2scope・対象アカウントを確認。新しい同意/規約が表示された場合はその場の確認条件を守る。
4. プロフィール表示と暗号化保存・Token Refreshの実API結果を検証。未実施を成功扱いしない。
5. 送信は禁止のまま。MEDIA_DOMAIN_VERIFIED=falseで現実装は送信を拒否する。ドメイン所有確認・Sandbox送信は別途承認/条件に従う。
6. 実操作録画。送信が未承認ならvideo.uploadの送信結果場面は未撮影として明示。審査用完成動画はまだない。
7. 審査提出は資料提示後の社長最終承認まで行わない。
