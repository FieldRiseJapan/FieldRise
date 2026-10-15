# Phase 5-E 無料枠・課金安全性
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


数値は2026-10-15の公式本文/検索確認。新規登録/カード登録/プラン選択/課金操作なし。無料枠と費用上限保証は別。

|項目|A Sites Plus|B Workers Free/D1/R2|C1 Vercel Hobby|C2 Pages＋CF API|
|---|---|---|---|---|
|基本|既Plus契約、追加額未検証|Workers Free $0、Paid最少$5/月は採用しない|Hobby $0だが商用不可|Pages公開repo無料、商用本体用途に制限|
|API|plan別beta制限、現在値未読取|100000 req/日、CPU10ms/req、128MiB|Hobby上限より先に商用条件不適合|static UIにAPIなし、B分加算|
|DB|実契約値未確認|D1 read500万行/日、write10万行/日、総5GB、1DB500MB、50query/invocation|永続DB別調達、$0未確定|Bと同じ|
|素材|Sites契約未確認|R2 Standard10GB-month、A100万/B1000万操作/月、egress無料|storage別調達|Bと同じ|
|scheduler|条件付きcloud task、cleanup成立未確認|Cron5/account、Queues10000操作/日・保持24h。Queue再試行をInbox再送に使わない|Hobby cron1回/日、時刻精度1時間内|Bと同じ|
|監視/backup|正式復旧経路未確認|Logs Free20万events/日・3日、D1 Time Travel7日|外部DB復旧含め未確定|Bと同じ|
|domain|既URL|workers.devで独自domain費不要候補、TikTok検証・本番適否別|vercel.appでも商用条件は変わらない|github.io＋API、CORS/認証別検証|
|超過|beta制限あり、契約詳細未確認|Workers/D1 Freeは制限・エラー、R2は従量課金|Hobbyは制限、事業用途不採用|Actions/外部backend別管理|
|支払情報|今回取得なし|Workers/D1の当account条件未確認。R2 subscription/checkout必要、billingによる支払手段確認があり得る|実登録不要のため未確認|公開standard Actions無料、storage等別|
|商用条件|Site責任・利用規約の適合審査要|Workers開発者契約のFieldRise適合NOT VERIFIED、Freeを非商用限定とは断定しない|BLOCKED：公式非商用のみ|BLOCKED/用途確認要：online business/SaaS制限|

## Bの費用ゲート
R2 Standard超過はstorage $0.015/GB-month、A $4.50/百万、B $0.36/百万。無料egressでも操作課金は残る。budget alertは通知のみで停止/capしない。アプリ上限だけではhostへの全アクセス/既課金を遮断できないため、hard-zero-costはNOT VERIFIED。R2 hard capの公式保証が確認できず、追加費用ゼロ必須条件は未充足。
GitHub standard hosted runnerはpublic repo無料。larger runnerは有料、artifact/cacheやprivate quota/支払状態は別。Actions workflowやsecretは今回作成しない。
CPU10msで全MP4 SHA-256処理が収まるか未試験、128MiBでbuffer複数保持も危険。既隔離139PASSはFree host性能保証でない。50MB以下でもstatic asset25MiB上限に抵触し得るためMP4をstatic bundleに移す案は採用しない。R2/転送コストを回避するFILE_UPLOAD案は別API/安全設計の調査候補に留め、今回方式変更しない。
Workers Logsは2026-12-01から料金体系変更予告があり、導入時に再確認する。3日logsは90日安全台帳backupの代わりにならない。

## 公式資料（2026-10-15確認）
- https://developers.cloudflare.com/workers/platform/limits/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/d1/platform/pricing/
- https://developers.cloudflare.com/d1/platform/limits/
- https://developers.cloudflare.com/d1/reference/time-travel/
- https://developers.cloudflare.com/r2/pricing/
- https://developers.cloudflare.com/r2/get-started/
- https://developers.cloudflare.com/billing/manage/budget-alerts/
- https://developers.cloudflare.com/billing/understand/billing-policy/
- https://developers.cloudflare.com/queues/platform/pricing/
- https://developers.cloudflare.com/workers/observability/logs/workers-logs/
- https://developers.cloudflare.com/workers/configuration/cron-triggers/
- https://developers.cloudflare.com/workers/configuration/secrets/
- https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/
- https://docs.github.com/en/billing/concepts/product-billing/github-actions
C候補の条件は比較資料の公式URL参照。未確定のカード必須有無・commercial適合をVERIFIEDと記載しない。

