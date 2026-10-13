# Phase 5 非破壊Migration・公開反映計画

2026-10-14。基準3ea80f209e5797f6867dbda2e25982fdfab81ed7。実行用指示ではなく将来承認の対象。公開適用BLOCKED、公開DB/設定/デプロイ未操作。

## 基準照合

GitHub branch headは基準SHAと一致。Phase4 manifest17件はGitHub全文SHA-256とlocalに一致。102件PASS/型/buildはPhase4記録を採用し再試験しない。最新公開Version/DB状態/ジョブ件数/予約件数はNOT VERIFIED。Version14、21:42UNKNOWN1件は既存社長確認/記録であり今日の実測ではない。

## SQL構造審査

|対象|確認した定義|評価|
|---|---|---|
|send_control|environment sandbox/production CHECK、複合PK、halted DEFAULT1、schema_version1|DDLだけでは制御行を自動作成しない。行なしはgate拒否|
|send_grants|grantPK、control複合FK、sandbox限定、key_version1、期限CHECK、消費状態CHECK、owner索引|不可逆状態/不変binding trigger。通常APIから発行しない|
|send_attempts|attemptPK、grant UNIQUE/FK、request複合UNIQUE、account未確定partial UNIQUE、purge索引、receipt CHECK|同account未確定を複数移行できない。実DBで対象複数なら停止し設計確認|
|delete_requests|ownerPK、request UNIQUE、状態CHECK|ownerはHMAC、期限の自動強制/未完了清掃は別運用が必要|
|trigger|grant no_restore/binding immutable、attempt validate/consume/no_restore|既存表へtriggerを追加しない。INSERTの制約で誤許可を拒否|
|既存表|0001にDROP/ALTER/既存表UPDATE/DELETEなし、新表から既存jobs FKなし|加算DDLとして非破壊。公開DDL実測ではない|
|再実行|CREATE TABLE/INDEX/TRIGGERにIF NOT EXISTSなし|同じSQL直接再実行は失敗。migration履歴で1回適用、部分適用を手動再実行しない|

Drizzle journalは0000のみで0001未登録。Sitesがraw SQL方式かDrizzle migratorか未確認。自動デプロイで0001が適用されると仮定しない。正規migration executor、statement-breakpoint/trigger解析、transactionとmigration記録の原子性を隔離で確認する補修/手順検証が必要。

## 既存UNKNOWNの保全

21:42ジョブのid/request_key/state/error/publish_id/owner/draft_id/open_id/createdと予約の全フィールドを、秘密を出力しない内部完全比較で保持。件数だけでは保全PASSにしない。原本snapshotは暗号化・アクセス限定、報告は件数と比較booleanのみ。

migrateUnknownは実STATUS_UNKNOWNだけからLEGACY_CONSUMED/UNKNOWNを新表へ作る。元job/leaseを変更しない。app_scope/HMACは実行環境内部で算出、秘密値表示なし。複数UNKNOWN/accountがある場合UNIQUEにより失敗し得るため事前検出して停止。素材hashは実原本/予約と照合し、すべてに任意の同じhashを与えない。review/purge起算点差はB03で直す候補。旧16:51消失を架空復元しない。1件しか見つからなくても旧試行UNKNOWNはリスク記録として維持する。

## 将来実行の順序と停止条件

|Step|手順・保存証跡|停止条件|
|---|---|---|
|1変更凍結|source SHA、Deployment ID、設定存在/boolean、DB/bucket識別を記録。Secret値は取得しない。登録/削除/素材操作/全writerも保守停止|凍結を強制できない、対象ID未一致|
|2送信停止|旧/新全URL・preview/version URLを含むPOST jobsを外側で拒否する保守ゲートが第一候補。旧VersionにTIKTOK_ENABLED=falseを反映する案は補助。OAuth接続データは維持|Sitesで外側ゲート/旧worker停止/全writer停止を実証できない、既dispatch通信が残る|
|3静止確認|旧init/送信fetch最大待機・実行中処理の完了を監視。単なる時間待ちを完全停止証拠としない|実行中の要求を列挙/遮断できない。止まったと推測しない|
|4識別・backup|サイトprojectとDB UUID/binding/backend/プランを照合。復旧可能bookmark/exportを秘密データ非表示で保管。backup権限/期限を確認|正規権限経路なし、復旧範囲未確認。新課金は禁止|
|5事前比較|schema/version・migration履歴・jobs/UNKNOWN/leases counts、全フィールドsnapshot、外部キー整合性を確認|想定1件から差、破損/不一致、重複account、期限切れ、写像欠如|
|6Migration|承認済み0001 hashとexecutor確認。新4表/index/triggerと履歴を1回適用。controlはhalted1、AVAILABLE承認0|executor未対応、部分DDL、constraint不一致、違うSQL|
|7非破壊移行|内部停止下で21:42のみ実レコードからlegacy台帳へ。元job/key/lease全比較|一部commit/二重移行/期限起算未修正/素材不一致。旧16:51は作らない|
|8新Version|補修承認後の固定SHA、停止ゲート保持、全source hash確認。段階mixed trafficは使わない|型/build差、旧Workerが無承認送信可能|
|9安全確認|履歴/接続表示、ledger/DB異常時拒否、承認なし拒否を正規診断で確認。実TikTok通信を遮断した検証が必要|試験がreal sendを誘発する、画面だけでserver停止を断定|
|10清掃/監視|B01/B02/B03補修・隔離検証後、承認済みscheduler設定。初回dry-run→少数清掃→集計監視|host scheduler不可、lock/budget/通知/期限保証未達|
|11最終判定|CTO評価/社長承認。送信controlは停止、実grant未発行のまま公開機能を確認|どれかNOT VERIFIEDなら停止継続。実送信/Production提出は別承認|

### 将来の読み取り確認SQL案（未実行）

```sql
SELECT name,type FROM sqlite_master WHERE name LIKE 'send_%' OR name='delete_requests';
PRAGMA foreign_key_check;
SELECT state,COUNT(*) AS n FROM jobs GROUP BY state;
SELECT COUNT(*) AS n FROM leases;
SELECT environment,halted,schema_version,COUNT(*) AS n FROM send_control GROUP BY environment,halted,schema_version;
SELECT state,COUNT(*) AS n FROM send_grants GROUP BY state;
SELECT state,source,COUNT(*) AS n FROM send_attempts GROUP BY state,source;
SELECT state,COUNT(*) AS n FROM delete_requests GROUP BY state;
```

app_scope/owner/HMAC/key/URL/publish_idをSELECT出力しない。全フィールド比較は将来の専用非出力検証処理で行う。migration履歴テーブル名はホストexecutorを確認してから決める。公開D1へのSQLは今回は一切実行していない。

## 停止方式の判定

Phase4隔離試験は旧Version14にOFF設定が効くことを証明したが、旧deploy全体への設定反映、既実行fetch、外部経路の遮断は未実証。DB haltedだけでは旧コードを止めない。保証できる正規境界が見つかるまでP04/P13はBLOCKED。保守ゲートは認証/接続解除やSecret変更の代用品ではない。

## 公式資料（2026-10-14）

[D1 Migration](https://developers.cloudflare.com/d1/reference/migrations/)：migration順序/履歴/DB名とbindingの区別。
[Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)・[Limits](https://developers.cloudflare.com/d1/platform/limits/)：Free7日/Paid30日、in-place復元は破壊的。Sitesの契約がどちらかはNOT VERIFIED。
