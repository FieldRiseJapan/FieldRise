# Production審査 残工程・URL所有権検証（2026-10-12）

OAuth・F5接続維持は社長実機PASS。再検証不要。実操作動画未撮影、Inbox送信未実施、申請未提出。Windows操作システム開発は保留。

## URL・申請設定の対応
|項目|公開版に合わせる値|状態|
|---|---|---|
|Web|https://fieldrise-creator-studio.wryrice16.chatgpt.site/|公開版URL、Portalの最終一致未確認|
|Terms|https://fieldrise-creator-studio.wryrice16.chatgpt.site/terms|コード内容確認済み、Portal保存未実施|
|Privacy|https://fieldrise-creator-studio.wryrice16.chatgpt.site/privacy|暗号化保存・2時間メディアURL説明あり|
|Support|https://fieldrise-creator-studio.wryrice16.chatgpt.site/support|現行Sandbox状態との説明を更新|
|Callback|https://fieldrise-creator-studio.wryrice16.chatgpt.site/api/tiktok/callback|Sandbox実機PASS、Production保存未実施|
|製品|Login Kit / Content Posting API Upload|Portal最終照合・保存は承認後|
|scope|user.info.basic / video.upload|Sandbox実機PASS。Production既存video.publish削除は承認後|

## MEDIA_DOMAIN_VERIFIED解消の順序
1. 公式資料：https://developers.tiktok.com/docs/en/content-posting-api-media-transfer-guide と https://developers.tiktok.com/docs/en/getting-started-create-an-app （2026-10-12確認）。PULL_FROM_URLは所有URL、HTTPS、リダイレクトなし、ダウンロード中継続アクセスが必要。
2. Sites共有親ドメインchatgpt.siteのDNSはFieldRise管理外のため親ドメイン全体の検証を試さない。URL prefix方式を候補とする。
3. 社長承認後、App ID7664531024089532432のURL propertiesを確認。公式手順はProductionモード指定であるため、この登録は現在のProduction変更禁止と別途調整が必要。申請本文・スコープ・Submitは触らない。
4. Web/terms/privacyと /api/media/pull/ を覆う公開版ルート https://fieldrise-creator-studio.wryrice16.chatgpt.site/ をURL prefix候補にする。Portalが指示する正確なファイル名と署名ファイルを取得する。
5. 署名ファイルは認証情報ではない。内容・名前を改変せず、公開版Sitesの指定パスへ配置する。配置コードとデプロイは専用ブランチ、旧環境変更なし。実ファイル未入手なので今はファイル名や内容を捏造しない。
6. 公開URLへ未ログインGETで200、リダイレクトなし、署名ファイル一致を確認→Portal Verifiedを確認。SandboxのContent Posting APIに同プロパティが適用されるかPortal表示で確認。
7. 実際のメディアURLもTikTokが認証なしで取得できるか確認する。現在コードでは最大2時間の一時URLだが、Sites入口認証が妨げないか実HTTP検証が必要。署名ファイル成功だけでメディア取得成功としない。
8. 上記成功後、社長の別承認で公開版MEDIA_DOMAIN_VERIFIED=trueだけ変更/再デプロイ。TikTok側Verified未確認でゲートを解除しない。
9. 社長の個別承認後のみ1件のSandbox Inbox送信。再送を自動化せず、SEND_TO_USER_INBOXを確認。TikTok側公開はしない。

## 不足する動画証跡
- 一般公開版の実画面録画、利用者認証・登録・素材準備
- 新規OAuth認可画面（既存接続を解除せず接続開始可能）→正常復帰→プロフィール表示。成功は確認済みだが録画は未取得
- user.info.basicプロフィール利用説明
- video.uploadの実Inbox送信・応答・状態。未送信を成功として編集しない
- 実MP4を受領後、編集・字幕・マスキング・容量50MB以下・全編確認。1本に合成可能だが別収録を同一連続実演と偽らない

## 最小限の撮影依頼（1回にまとめる）
ドメイン検証とSandbox送信承認が揃ってから、公開版起動→認可→接続表示→MP4選択→保存/同意→1回Inbox送信→状態表示をまとめて録画する。現在は送信禁止のため送信場面を実行しない。アドレスバー/機密を録画しない。社長はPCの録画と実クリックが必要（GPTによるWindows操作不可）。編集・字幕・品質検証はGPT担当。

## 提出判定
CONDITIONAL。動画、URL所有権・メディア取得、Inbox実機証跡、Production項目一致が未完了。最終承認は完成サービスURL・動画・JA/EN文・scopes・変更影響を提示後に求める。受付が確認されるまで完了と報告しない。
