# Phase 5-C 正規Migration・backup能力

確認日時2026-10-14 12:26 JST。H4/H5と公式D1資料。公開D1接続/SQL/backup作成/復元なし。

|事項|確認できたこと|未確認|
|---|---|---|
|バックエンド|hosting.json logical DB/BUCKET、SitesがD1/R2をprovisionする正式workflow|実UUID/backend世代/プラン/直接Cloudflare権限|
|Migration入口|Sites公開workflowはWorker upload前にSQL/snapshot/journalを適用|実適用履歴・使用receipt表/一回性・複数migration間のtransaction|
|0001条件|基準journalに0001、approved SQL不変|公開既適用/部分適用。再実行を勝手に許可しない|
|0002条件|基準journal0002、隔離pipeline/制約検証記録|公開適用履歴・host executorとのsnapshot扱い|
|履歴読取|一般D1はmigration履歴を管理、内部試験receiptは別|正規Sitesに公開DDL履歴だけを返す管理機能を確認できず。DB接続なら事前承認|
|transaction|D1 batchは同batch内を原子的に処理する一般仕様|Sitesの全DDL/履歴単位が同batchか不明、隔離内部executorと同一としない|
|失敗・再適用|Sites正式資料ではfailed deployでもDDLが適用済みになり得る|実部分状態を確認せず再deploy/再SQLは不可|
|backup期間|一般D1 Time TravelはFree7日/Paid30日、対応backend条件あり|当Sites契約・bookmark/export経路・owner復旧権限|
|復元影響|一般Time Travelは既DBを上書き。Worker rollbackはstorageを戻さない|当Site復元停止境界/最新安全記録・削除要求再適用|
|roll-forward|新加算SQL/修正Versionという運用案は作成済み|B04停止と実履歴が前提。採用・deployは未承認|

正規ホスト資料を確認→全version停止・drain→必要なら社長の公開DB読取承認→非出力schema/履歴/count/完全比較→backup復旧可能性→migrationの個別承認、という順序を推奨。今回DB読取承認を求めていない。正規管理資料で解決できる項目を先に確認する。

UNKNOWN・承認消費・削除済み情報はDB復元で巻戻り得る。原本安全台帳・削除要求の比較/再適用が保証できなければ復元BLOCKED。旧16:51消失を架空復元しない。実21:42の存在/件数/全fieldは今日未確認。

出典2026-10-14：[D1 batch](https://developers.cloudflare.com/d1/worker-api/d1-database/)、[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)、[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)、[Worker Rollback](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/)。source workflowはSites storage skill（H5）。
