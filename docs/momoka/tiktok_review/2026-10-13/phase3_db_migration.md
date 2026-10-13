# Phase 3 DB設計・移行・ロールバック計画
2026-10-13。SQLはレビュー用文書。今回は実行しない。DDL/DMLをmigrationディレクトリへ配置しない。
現行jobs/leases/profiles/暗号化connectionsは改変しない追加方式。Production環境には導入しない。

## スキーマ案A（4追加表）
```sql
CREATE TABLE send_control (
  environment TEXT NOT NULL CHECK(environment IN ('sandbox','production')),
  app_scope TEXT NOT NULL,
  halted INTEGER NOT NULL DEFAULT 1 CHECK(halted IN (0,1)),
  schema_version INTEGER NOT NULL CHECK(schema_version=1),
  PRIMARY KEY(environment,app_scope)
);
CREATE TABLE send_grants (
  grant_id TEXT PRIMARY KEY NOT NULL,
  environment TEXT NOT NULL CHECK(environment='sandbox'),
  app_scope TEXT NOT NULL,
  owner_key TEXT NOT NULL,
  account_key TEXT NOT NULL,
  key_version INTEGER NOT NULL CHECK(key_version=1),
  media_sha256 TEXT NOT NULL CHECK(length(media_sha256)=64),
  approval_ref TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('AVAILABLE','CONSUMED','REVOKED','EXPIRED','LEGACY_CONSUMED')),
  issued_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL CHECK(expires_at>issued_at),
  consumed_at INTEGER,
  CHECK((state IN ('CONSUMED','LEGACY_CONSUMED') AND consumed_at IS NOT NULL)
     OR (state NOT IN ('CONSUMED','LEGACY_CONSUMED') AND consumed_at IS NULL)),
  FOREIGN KEY(environment,app_scope) REFERENCES send_control(environment,app_scope)
);
CREATE INDEX send_grants_owner ON send_grants(environment,app_scope,owner_key,state);
CREATE TABLE send_attempts (
  attempt_id TEXT PRIMARY KEY NOT NULL,
  grant_id TEXT UNIQUE NOT NULL REFERENCES send_grants(grant_id),
  environment TEXT NOT NULL CHECK(environment='sandbox'),
  app_scope TEXT NOT NULL,
  owner_key TEXT NOT NULL,
  account_key TEXT NOT NULL,
  request_key_hash TEXT NOT NULL,
  payload_hash TEXT NOT NULL,
  media_sha256 TEXT NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('RESERVED','DISPATCH_STARTED','UNKNOWN','PENDING','DEFINITIVE_REJECT','TERMINAL')),
  source TEXT NOT NULL CHECK(source IN ('NEW','LEGACY_DB')),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  receipt INTEGER NOT NULL DEFAULT 0 CHECK(receipt IN (0,1)),
  review_at INTEGER NOT NULL,
  purge_at INTEGER NOT NULL,
  CHECK(review_at<=purge_at),
  UNIQUE(environment,app_scope,owner_key,request_key_hash)
);
CREATE UNIQUE INDEX send_one_unresolved_account
 ON send_attempts(environment,app_scope,account_key)
 WHERE state IN ('RESERVED','DISPATCH_STARTED','UNKNOWN','PENDING');
CREATE INDEX send_attempts_purge ON send_attempts(purge_at,state);
CREATE TABLE delete_requests (
  owner_key TEXT PRIMARY KEY NOT NULL,
  request_id TEXT UNIQUE NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('QUEUED','DELETING','COMPLETE')),
  requested_at INTEGER NOT NULL,
  completed_at INTEGER,
  purge_at INTEGER NOT NULL
);
```
- 名前/hash/digest/requestIdも機微になり得るためAPI・ログへ非公開。digestは同一素材の照合にだけ使用、素材自体を新表へ保存しない。
- payload_hashはserver正規化でenvironment/app_scope/account_key/種別/mediaHash/順序/cover/投稿パラメータ/同意バージョンを含める。URL秘密部分・tokenは含めない。owner_keyも含め別ownerreplayを防ぐ。
- state移行は固定allowlist/DBトリガー案でCONSUMED→AVAILABLE、attempt→RESERVEDの逆行を拒否。raw古いjobをUPDATEして新stateへ変えない。
- LEGACY_CONSUMEDは過去承認使用済みを表す無効grantで、新承認ではない。AVAILABLEを移行で作らない。
- 新attempt INSERT前のトリガーでgrantの同一environment/app/owner/account/media/keyVersionとAVAILABLE/有効期限を照合、send_control halted=0、delete_requests QUEUED/DELETINGなしを検査。旧データ移行は別の管理専用経路でhalted=1のままsource=LEGACY_DB。通常HTTPからsource/grantを指定させない。
- 十六進数の字種/固定長/時刻整合などはbind前検証+DB CHECKを実装時追加し隔離試験で証明する。これらのDDLは最終migration承認前にレビュー対象。
- jobsにattempt_idを追加しない最小案：attempt_id=新job.id。legacyも現job.idを内部で参照（外部ログへ出さない）。失われた旧jobはattemptを作らない。

## 原子的受付
Cloudflare公式：D1 batchはSQL transactionで、SQL失敗は全体rollback。0rows更新はSQLエラーではない点に注意。BEGIN/外部awaitによる対話的transactionを仮定しない。
1. 認証/同意/scopes/素材/実URL/hashを既存処理で検証。これは予備確認、最終認可ではない。
2. 同一D1 batch：
   - 新attemptをINSERT（grant/control/deletionをtriggerで検査、grant1attempt/account未解決unique）。
   - AVAILABLE grantをCONSUMEDへ更新しconsumed_at設定。固定CHECK/triggerで期待行を検査。
   - jobsをINSERT：profiles.deleting=0、同接続open_id/scopes、draft.revision、素材ready、準備lease対象/期限を再照合。VALUES内の条件subqueryが不足ならNOT NULL失敗でrollback。ownerrawは既存jobsにのみ保存。
   - 対象ready leaseを同jobへ移動。lease hash/owner/asset/revision binding一致を条件。
   - UPDATE send_attempts SET receipt=CASE WHEN (grant consumed + job存在 + lease job一致) THEN 1 ELSE -1 END。CHECK receipt IN(0,1)により0rows/不成立を全rollback。attempt.id条件が外れないことを保証し行数も検査。
3. commit後に外部await。別batch/SQLのclaimDispatchはRESERVED→DISPATCH_STARTED CAS、receipt=1、control有効、profile.deleting=0、lease有効、接続一致を再照合。RETURNING勝者1件のみfetchを許す。成功判定/UNIQUE違反のrawメッセージはログへ出さない。
4. CASのDB応答が不明なら通信しない。再要求は既存attemptだけ返す。期限でRESERVEDをAVAILABLEへ戻さない。
5. 外部fetchとD1保存は別。成功応答後保存失敗でもDISPATCH_STARTEDが未解決として残り追加送信を拒否。UNKNOWN更新は新attemptと既存jobへ同batch、job消失なら安全に停止。実際の成功を永久exactly-once保証とは称さない。

## 削除の線形化・R2
beginAccountDeletionはprofiles.deleting=1、delete_requests作成、未使用grant REVOKEDを同batch。RESERVEDのdispatch CASと同じDB順序で競合を裁く。
- 削除が先：profile/deletion境界でsend/dispatch不可。
- dispatchが先：既に外部通信へ進み得る。取り消し保証をしない。素材URL失効/個人データ削除がTikTok取込を中断する可能性を説明する。
- 現存21:42UNKNOWN/rawjobs/leaseは初期移行で変更しない。将来の削除要求はQUEUED受付と有限保持の説明。既存データ削除の追加承認前に実削除しない。
- 恒久的削除保留を採用しない。保持方針承認後、期限でtoken/個人素材/draft/履歴を削除し、必要最小attemptだけ有限保持する。削除によってgrant/attemptを自動AVAILABLEにしない。
- R2消去にはtransactionがなく、profilesとassetsのmanifestを短期保持し再開可能にする。リトライはR2削除のみ、TikTok送信なし。新schemaのdelete_requestsはowner_keyのみ、rawowner/素材IDのmanifestは既存profiles/assets側に保持して処理完了で消す。
- complete後delete_requestは短期purge、profileも削除、再登録可能。既存台帳が期限消去された後もgrant未発行default deny。
- 30日review/90日purge/manifest完了24hは候補、今回決定ではない。保持期間未承認なら公開適用しない。

## 移行手順（将来、各承認後）
M0：秘密を表示せず対象Sites/DB/Version14/ソースを確認。接続・job・leaseの保全snapshotを安全な非公開保存先へ取る案。tokenのexportは不要。backup/復元手段を確認できなければ移行STOP。
M1：旧workerが新schemaを無視する混在期間の送信を止める。TIKTOK_ENABLED=false→承認済み版反映で送信停止を確認する案（環境変更は別承認）。既存接続tokenを削除しない。旧inflight drain/未確定要求の有無が確認できなければSTOP。公開UI操作禁止だけでは不十分。
M2：追加DDLを適用、send_controlのSandbox行halted=1。Production用grantを作らない。既存tablesのDML0。
M3：現job21:42はすべての元カラムそのまま。HMACでowner/accountを内部導出、新LEGACY_CONSUMED grant＋UNKNOWN attemptを追加。source=LEGACY_DB、receipt=1。原本のjob/request/leaseは更新しない。
旧16:51は履歴文書の既往事実として参照し、失われたjobを再構成しない。accountに過去2回不確定の管理reviewを記録し、新許可を自動発行しない。
M4：全件保全比較、UNKNOWN数一致、duplicate/index/control/schema検査。口頭の「1件」のみではSTOP解除しない。
M5：新安全コードを承認後に配備。halted=1で拒否経路/履歴だけ検証。通常利用者からgrant作成不可を確認。
M6：今回の社長指示ではhalted解除/新grantは不可。実送信計画と新承認まで送信停止を維持。

## 整合性確認SQL案（読み取り、今回は未実行）
```sql
SELECT COUNT(*) AS unknown_count FROM jobs WHERE state='STATUS_UNKNOWN';
SELECT COUNT(*) AS orphan_job_leases
 FROM leases l WHERE l.job_id NOT IN ('preflight')
 AND l.job_id NOT LIKE 'ready:%'
 AND NOT EXISTS(SELECT 1 FROM jobs j WHERE j.id=l.job_id AND j.owner=l.owner);
SELECT COUNT(*) AS available_grants FROM send_grants WHERE state='AVAILABLE';
SELECT COUNT(*) AS incomplete_receipts FROM send_attempts WHERE receipt<>1;
SELECT COUNT(*) AS inconsistent_grants
 FROM send_attempts a JOIN send_grants g ON g.grant_id=a.grant_id
 WHERE a.environment<>g.environment OR a.app_scope<>g.app_scope
 OR a.account_key<>g.account_key OR a.owner_key<>g.owner_key
 OR a.media_sha256<>g.media_sha256
 OR g.state NOT IN ('CONSUMED','LEGACY_CONSUMED');
SELECT COUNT(*) AS unsafe_controls FROM send_control WHERE halted<>1;
PRAGMA foreign_key_check;
```
実行時epoch/対象scope/owner条件をバインド。ゼロべき件数だけ外部報告。ハッシュ/ID一覧は出力しない。
旧jobs/lease全フィールドの比較は内部スナップショット同士で実施し、値ではなく一致boolean/件数だけ報告。現在期限切れleaseも削除せずそのまま比較。preflight/ready予約を孤立job扱いしない。

## 切り戻し
- 追加DDLだけ/未使用なら旧コードへ戻せるが、旧版には元の削除ゲート問題があるためTIKTOK_ENABLED=falseを維持。台帳/制御rowを残す。既存Version14へ戻しただけで安全としない。
- grant消費/attempt記録後：新table DROP/used値巻戻しは禁止。disable中の安全版へ戻すか新版を修正、used維持。DB全体復元は後続承認消費を消すので自動実行禁止。
- schema部分適用、key不一致、snapshot不一致、想定外job/lease、DB結果不明：停止継続。既存UNKNOWNを成功/FAILEDへ書換えない。
- 不可逆：外部送信、個人データ/R2削除、台帳purge。いずれも今回未実施。削除前backupsはPrivacy保持と安全基盤に従い、秘密を報告へ添付しない。
- Cloudflare Time Travelは一般仕様があってもSitesで操作権限/保持期間があるとは未確認。旧16:51の復元は本計画にも含めない。

## 公式根拠（2026-10-13取得）
https://developers.cloudflare.com/d1/worker-api/d1-database/
https://developers.cloudflare.com/d1/reference/time-travel/
batch保証はD1内。R2とTikTokへの分散transaction保証はない。実装時に同compatibilityDate/flagsのworkerd隔離試験を必須とする。
