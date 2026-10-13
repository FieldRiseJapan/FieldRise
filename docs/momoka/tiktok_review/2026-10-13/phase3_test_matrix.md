# Phase 3 隔離テスト仕様・実装承認チェックリスト
2026-10-13。全ケースDESIGNED / NOT RUN。今回はテスト設計のみ、アプリ実装・DB実行なし。既存30件・9+5PASSの不要な再実行なし。

## 隔離ハーネス
Node test＋既存Miniflare/workerd実アプリバンドル、compatibilityDate=2026-05-15/nodejs_compat。実装時に現行設定が同じか再確認。
合成owner/open_id/鍵/token/mediaだけ、実アカウント資格情報を読まない。DB/R2はtempdir、ライブbinding/remote flag禁止。
outboundService全URL拒否を既定、許可したsynthetic Inbox応答だけローカル返却。TikTokへ到達できないようにする。通信回数はmock counterで判定。
同時操作はbarrierでinterleave固定、sleep任せにしない。Worker crashはreserve/claim/fetch/save各境界へ合成fault。仮想時計で期限評価。
各試験後D1のgrant/attempt/job/lease整合性、呼出回数、snapshotを内部確認。秘密/例外全文をfailure dumpにも含めない。
未来コマンド候補：node --test tests/send-safety-workers.test.cjs tests/send-safety-migration.test.cjs。実装後に型チェック・既存関連テスト・build。今回はこれらを実行しない。

## 必須ケース
|ID|前提|操作|期待結果・アサート|失敗時|
|---|---|---|---|---|
|T01|未使用grant1/接続/素材/lease全一致|reserve→claim1回|grant CONSUMED1、attempt/job1、receipt1、mock1|SQL境界修正、適用停止|
|T02|T01と同じgrant|異requestkey2件を同時reserve|勝者1、敗者409、attempt1/mock<=1、grant消費1|UNIQUE/trigger/batch修正|
|T03|同key/同payloadで既存attempt|同要求2回（同時/逐次）|既存attempt返却、mock増加0、lease再発行0|冪等性経路修正|
|T04|UNKNOWN/消費済み|新keyで同/別素材send|固定拒否、mock0増、UNKNOWN保持|新grant/誤解除禁止|
|T05|UNKNOWNあり|削除要求→承認済み削除policyをfixtureで完了|used不変、AVAILABLE0、現legacy保全は初期queue段階で一致、削除policy後も再送0|削除境界修正|
|T06|通常profile消去、台帳残存/又はpurge後|再登録→直接jobs|grant未発行で拒否、mock0。purgeを初回承認扱いしない|登録/台帳設計修正|
|T07|profile正常/grant有効|delete先/dispatch先の両barrier順|delete先mock0、dispatch先max1・queue/消費維持、jobs0化で再受付なし|線形化点修正|
|T08|reserve済み|Workerをcommit前/後、claim後/fetch前、fetch後/save前で停止|commit前allrollback。後は消費維持、mock0又は1、次要求mock増0。INITIALIZINGやDISPATCH_STARTEDは未確定表示|回復で再送しない修正|
|T09|claim済み|timeout/abort/TypeError/3xx/nonJSON/保存失敗を注入|再送0、UNKNOWN又はDISPATCH_STARTED、grant消費、3xx追従0|固定分類・保存確認|
|T10|grant/lease期限境界|now==expires、before/afterを仮想時計で判定|未使用expired拒否、usedはAVAILABLEにならない。lease期限=結果確定とはしない|TTLロジック修正|
|T11|匿名/別owner/別account/不正scope/production|reserve/send直接要求|401/403固定、外部0、既存データ不変、grantの存在を他人へ漏らさない|認可修正|
|T12|UIボタン無視、preparedなし/同意false/PHOTO|直接POST jobs|サーバー拒否、mock0、grant消費0|UI依存排除|
|T13|21:42相当syntheticjob全カラム/lease/key|追加schema/legacybackfill|旧全カラム一致、UNKNOWN1/legacyattempt1、AVAILABLE0、再実行で増殖0。16:51は文書事実のみ|移行STOP/非破壊修正|
|T14|canary token/Secret/URL/private error/名前|正常/例外/DBconstraint/ログcapture/APIresponse|禁止canary出現0、hash/owner/internalID公開0、固定stage/categoryのみ|公開前STOP、機密無し検査|
共通：失敗時は隔離fixtureだけ破棄/修正。本番変更・TikTok再試行で検証しない。

## 追加の必須境界
|ID|前提/操作|期待結果|失敗時|
|---|---|---|---|
|T03b|同keyで宛先/素材/順序/本文/同意version変更|409 IDEMPOTENCY_CONFLICT、既存attempt返却で誤認しない、mock0増|canonicaldigest修正|
|T07b|削除とprepare/素材upload競合、R2一部失敗|delete先send不可、manifest再開で通常data消去、URL無効、grant復活なし|R2再開/認可修正|
|T10b|review30/purge90の候補clock到達、未確定あり|30 review/90個人最小記録purgeの方針、制限自動復活なし。新grant無しdeny|Privacy方針/運用を再承認|
|T15|INSERT/updatelease0行、jobNOTNULL/断片移行失敗|batch全rollback又はhalted停止、fetch0、旧job/lease無変更|assertionSQL修正|
|T16|異owner・同TikTokaccountで同素材/未確定|account未確定uniqueにより追加dispatch0、owner分離維持|accountkey境界修正|
|T17|新台帳導入後旧Version14相当へ戻す|送信停止設定の下でmock0、used/legacy保持、制御無視でsend可能なら切戻し禁止|旧版へ安全と称して戻さない|
|T18|HMAC keyversion不一致/欠落table/control/読取エラー|fail closed、me.sendGate不可、履歴取得エラーと0件区別|migration/鍵計画見直し|
|T19|同素材を別key/別grantで再要求|未確定なら拒否。terminal後も新明示承認無しdeny、内容SHA永久banなし|重複policy修正|
|T20|GLOBAL halted後既存workerがleaseを持っている|新codeclaim拒否、旧inflightが残る場合移行STOP。停止後に勝手に成功/失敗確定しない|drain計画修正|

## 根本原因の再現仕様
現行fixtureでjob1を作り、現removeAccount相当を実行→再register→jobsCOUNT0になることを確認予定。TikTokmockは通信禁止、prepare/受付の件数条件が再度成立し得ることだけをアサート。これはコード読み取りで確認済みの問題を隔離で再現する試験であり、今回は未実行。

## 実装承認チェックリスト
- [x] 基準Commitと最新ブランチ一致、server/UI/schemaの根拠特定
- [x] 原因・発生条件・通常同時受付の既存保護を区別
- [x] A/B比較・推奨台帳/原子受付・変更候補/インターフェース作成
- [x] SQL案・境界・0行失敗・既存保全・移行/rollback計画
- [x] T01–T14＋追加ケース/隔離条件・停止条件を設計
- [x] 採用動画固定、既存UNKNOWN/秘密保護
- [ ] 社長/CTOによるDB/原子境界のレビュー承認（AI自己レビューと区別）
- [ ] 30/90日候補保持・削除要求への対応・Privacy説明を承認
- [ ] HMAC用途分離・キーversion・app_scope対応を承認
- [ ] 限定コード実装＋隔離試験を社長承認
- [ ] DB適用/停止用環境設定/公開反映を個別承認
- [ ] モック実結果/型/build/漏洩/非破壊移行検証PASS（まだ未実施）
- [ ] 旧UNKNOWNの扱い/実送信再開条件を判断。新送信承認は別
- [ ] OAuth/Inbox証拠/Portal現行値/最終資料が整合、社長提出承認

## 残リスクとブロッカー
1. 過去2回は結果UNKNOWN。新設計/TTLはTikTokの未受理を証明しない。
2. 外部sendとDBのexactly-onceは保証できない。at-most-one dispatchと不明時の停止で重複を抑える。
3. D1 batch/trigger設計は公式仕様に基づく案、実workerdで未検証。DB reviewer承認前にmigration適用しない。
4. R2/D1削除の原子化不可、inflightと削除の競合は線形化と再開処理で扱う。利用者削除要求時の適用法/保持必要性はFieldRiseとして判断が必要。法令適合保証ではない。
5. 仮名台帳purge後は過去未確定の個別識別が失われる。自動grant発行をしない運用を必須とする。この運用と有限Privacy保持のトレードオフを社長レビュー。
6. 既存鍵deriveには鍵更新のリスク、Secret値変更なしでも実装時用途分離検証が必要。
7. Version14からの移行/rollback時には旧codeが台帳を無視する。確実な送信停止/混在drainが確認不可なら適用不可。
8. 写真/Productionの一般公開送信にこの限定Sandbox承認を流用しない。将来の一般quota/外部user実機隔離は別設計。
9. 現Portal設定/成功受信/OAuth録画不足はPhase2から継続。提出READYではない。
