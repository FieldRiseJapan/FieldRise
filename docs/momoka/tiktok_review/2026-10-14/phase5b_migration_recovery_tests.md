# Phase 5-B B05 Migration・復旧実測

2026-10-14。内部executor＋隔離D1のみ。公開適用NOT TESTED。

## 変更

0000と承認済み0001 SQLを変更せず、0002_maintenance_safetyを追加。欠落していた0001 snapshot/journalを整備し、0002 snapshot/journalを生成した。raw DDLのtriggerはSQLを正本とする。既存metadata0000は不変。

内部migration-executorは公開HTTP/APIへ接続しない。期待checksum照合、履歴の一回性、各migrationの全DDLとreceiptをD1 batchで確定、履歴のchecksum相違拒否、sqlite_masterの定義監査を行う。SQLリテラルのcase/空白を保ってschema driftを検出する。正規Sitesの履歴そのものと内部試験receiptは別物。

## 実測

- 一時workerd/D1の空DBにjournalの0000→0001→0002を全適用。二重適用は変更なし。
- 既存合成UNKNOWN job/request key/open_id/owner/state/error等とlease全フィールドをsnapshot比較し不変。
- checksum不一致、missing table、CHECK文字列のcase差を拒否。
- DDL途中失敗を同batchでrollback。未適用の修正migrationをroll-forwardで適用できる。
- 同account複数UNKNOWNは全新規移行前にレビュー停止し元データ不変。別accountの複数UNKNOWNは個別移行しraw fields不変。
- 合成backup復元モデルでAVAILABLEが戻り得ることを示し、独立停止操作後の受付拒否を確認。承認を再消費・再発行しない。実Cloudflare restoreはしていない。

## 移行前条件

実Sites executorのmigration履歴/DDL状態、旧Version混在時の外側停止、backend/backup期間・復旧権限、実UNKNOWNと予約の完全比較は未確認。sourceの同名SQLを盲目的に再適用しない。部分適用を識別し、台帳を残した修正Version/加算SQLへroll-forwardを優先する。

backupだけを戻すと承認消費/UNKNOWN/削除済み情報の整合性が失われる。B04停止と最新安全記録の比較・消去再適用が保証できない場合は復元自体BLOCKED。ライブ21:42 UNKNOWN/key/予約は今回照会も変更もなし。旧16:51を架空復元していない。
