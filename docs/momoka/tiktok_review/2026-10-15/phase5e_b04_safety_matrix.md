# Phase 5-E B04-01〜08
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


当Siteの適用証拠と一般機能を区別。全案の最終公開判定はBLOCKED。表のBは将来構成の能力評価で実施済みではない。

|要件|A Sites|B自主管理CF|C1 Vercel Hobby|C2 Pages＋CF|
|---|---|---|---|---|
|01全旧経路棚卸し|NOT VERIFIED|PARTIAL：versions/Version URLs/Previews/Deployments/routes/service bindings一覧が必要|NOT VERIFIED|frontendのみ静的、APIはB同様PARTIAL|
|02新規HTTP停止|PARTIAL：audience制限≠全停止|PARTIAL：workers_dev=falseだけでは他URL停止しない|NOT VERIFIED|UI非表示は不十分、B条件|
|03認証済/admin writer|NOT VERIFIED|PARTIAL：server原子halt/権限分離/全producer制御の設計が必要|NOT VERIFIED|backendが必要|
|04inflight/fetch/Cron/Queue把握|NOT VERIFIED|PARTIAL：logs/Cron/Queueはある、全実行一覧保証未確認|NOT VERIFIED|B条件|
|05静止完了証拠|BLOCKED|NOT VERIFIED→移行BLOCKED|NOT VERIFIED|B条件|
|06migration/deploy/rollback停止維持|BLOCKED|PARTIAL：DB独立halt＋CI旧版拒否を全版に強制する設計要|NOT VERIFIED|B条件|
|07旧Sitesの送信能力喪失|BLOCKED|BLOCKED：CF新hostは旧Sitesを停止しない|BLOCKED|BLOCKED|
|08権限/費用/監査|PARTIAL|PARTIAL：操作API/秘密管理あり、実権限・hard cap・監査欠落要確認|商用無料BLOCKED|商用用途制限＋backend条件|

## 新しく確認したCloudflareの経路分類
Version URLs（旧称preview URLs）は旧versionの設定/resourcesを使う。preview_urls=falseでVersion/alias URL routingを無効化できる。
一方、現在のPreviewsはbranch別bindings/Secret/URLを持つ独立環境で、固定Deployment URLもある。同じpreviewという語でも同一機能ではない。workers_dev=falseだけではVersion/Preview/Deployment URLをすべて止めない。
custom domains/routes、Wrangler environments、version overrides、Service binding/RPC、Cron/Queue/alarms/Workflows、CI/管理者の再deployも棚卸し対象。使用しない経路は作らず、実不存在を確認してNOT APPLICABLEへ変更する。

Workers HTTPは接続中の一律wall上限なし。20秒timeout、CPU10ms、Cron15分、ログに見えないことからdrainと判定しない。Version URLにはWorkers Logs/tail/Logpushで観測できない制限もある。全経路/全producerの拒否と、送信資格の一度限り消費、未完了実行の保守的ブロック、完了証跡を別設計する。
既外部fetchの物理取消やTikTok受理取消は保証しない。UNKNOWNは維持。単なるアプリproxy追加は旧directfetchから迂回できるため07の解決ではない。

出典（2026-10-15本文）：
- https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/
- https://developers.cloudflare.com/workers/previews/
- https://developers.cloudflare.com/workers/configuration/routing/workers-dev/
- https://developers.cloudflare.com/workers/platform/limits/
旧Siteへのこれら機能の適用は未確認、推測URLを生成/probeしない。

