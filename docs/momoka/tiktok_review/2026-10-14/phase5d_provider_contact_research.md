# Phase 5-D 提供元・正式窓口
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


## 特定結果
サービスはChatGPT Sites、提供元はOpenAI。基盤のCloudflare Workers/D1/R2と、Sitesの管理契約は別。Phase5-Cのmanifest・Sites管理記録とOpenAI公式資料を照合した。今回Site管理・実画面・DBを再実測していない。

正式技術照会の入口：OpenAI Support。https://help.openai.com/ の右下chat bubbleから相談開始し、必要ならSites技術担当への転送を依頼する。公式問い合わせ案内本文を確認済み。今回サポートUIを開く・入力する・送信する操作はしていない。担当者応答やチケット発行、アカウント固有の利用可否は未確認。

|項目|判定|
|---|---|
|公式製品/管理資料|VERIFIED：下記S1・S2|
|正規Support入口|VERIFIED：S3|
|専用フォーム/メール/SitesチケットAPI|NOT VERIFIED：推測アドレスを採用しない|
|公式Sites GitHub Issues|調査資料に正規窓口として案内なし、NOT VERIFIED。公開Issueへ内部情報を投稿しない|
|プラン制限/SLA/応答期限|NOT VERIFIED。使用アカウントの契約を推定しない|
|相談に必要な情報|製品・目的・質問・日時/タイムゾーン・利用環境。アカウント/プランは社長が正規非公開窓口で確認し必要時のみ提供|
|全Version停止/drain契約|NOT VERIFIED、B04 BLOCKED|

## 公式根拠
S1 https://learn.chatgpt.com/docs/sites?surface=app （本文取得済み）。Sitesの製品・管理入口・版保存と公開、共有制限、対応範囲を確認。全旧版停止/drain保証は見つからない。
S2 https://help.openai.com/en/articles/20001338-managing-chatgpt-sites-for-your-workspace （本文取得済み）。管理者/ownerの公開・アクセス制御、機能不足時のOpenAI Support案内。Business/Enterprise/Edu対象資料を個人契約へそのまま転用しない。
S3 https://help.openai.com/en/articles/6614161-how-can-i-contact-support （本文取得済み）。サポートチャット、説明に必要な情報、機密除外。
S4 https://help.openai.com/en/articles/20001339-creating-and-using-chatgpt-sites （検索取得あり、直接本文openは2回timeout）。本文未取得として扱い、結論はS1〜S3で裏付けた。
補助：Sites正式skill storage workflow（再読取済み）。公開前migration・failed deploy後DDL残存の可能性は既知で、support質問へ記載。公開Web仕様と区別する。

## 開示・送信手順案
社長確認後にS3の正規窓口で日英どちらか1通だけ送る。一般仕様照会ではSite/Deployment ID・URL・repo・利用者名を初稿に含めない。サイト固有診断が必要なら公開URLを最初に、opaque IDは用途確認後に別承認。生ログ/HAR/DB/token/コード詳細は送らない。機微情報を要求されたら代替の固定分類・集計を提案し、再確認する。

