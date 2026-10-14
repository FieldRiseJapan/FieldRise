# Phase 5-B 限定補修・隔離試験 正式結果

2026-10-14 JST。基準remote f87794040ab304273e4c1111519bcf39babfccdc。コード/SQL/試験のみ専用branch、公開適用BLOCKED。

|ID|完了状況|実証範囲|
|---|---|---|
|B01|限定実装・隔離PASS|bounded batch/巡回cursor/二重lock/fencing/deadline/再開/固定監視/停止世代|
|B02|限定実装・隔離PASS|認証済み削除受付、早期通常情報消去、鍵/台帳不一致の救済・global halt・review証跡、遅延操作拒否|
|B03|限定実装・隔離PASS|legacy作成日起算、30/90/24h境界、bounded期限清掃、inflight lease保護、停止世代・自動承認禁止|
|B04|モデルPASS / hosted BLOCKED|既旧実装halt無視、外側境界/3origin/drainを模擬。正規全version停止は未確認|
|B05|限定実装・隔離PASS|journal/checksum/DDL+receipt batch/schema比較/二重適用/失敗rollback/非破壊legacy/合成復元停止|

## 最終検証

全体139 PASS / FAIL0 / SKIP0 / CANCEL0。Phase4基準102件に対して追加37件、既存削除試験の期待値は202受付→実runner完了に合わせて更新し、安全条件は緩めていない。
コマンド：`FIELD_RISE_PREFLIGHT_FIXTURE=<synthetic MP4> node --test --test-concurrency=1 tests/*.test.cjs tests/*.test.mjs`。
TypeScript `--noEmit --incremental false` PASS、framework build PASS、diff check PASS。既存worker/clientビルドの通常警告のみ。Secret/Token検査は固定診断canaryと代表credential静的pattern0件。絶対的漏洩不存在の保証ではない。実秘密は読んでいない。

Miniflare/workerd一時D1/R2、合成鍵/owner/open_id/token/materialのみ。ローカル遅延serviceを明示mockし、その他外向きfetchを遮断。TikTok実通信0、公開DB接続0、Sites変更0。

## 独立レビューと修正

Critical0 / Important6 / Minor1。Importantは受付0行成功、pause/generation無視、cursor飢餓、有効形式の異なるledger鍵、SQLリテラルdrift見逃し、固定clock/R2期限不備。全て再現RED→GREEN、修正後全139件PASS。修正パスは1回、再レビューなし。独立レビューは彩花CTO正式承認ではない。

受付はbatch内assertion、retentionはpause/世代と最終receipt、cursorはrestart可能な巡回、鍵不一致はDB由来対応で救済必須、SQL比較は文字列リテラル保持、runtimeは実時間deadlineとlate DB確定拒否。ロック/不要cursorの有限清掃も追加して再検証。

Minor保留：永続query_countが最後のglobal release1操作を含まない。返却カウントとhard budgetはその操作を含む。厳密請求/監査の根拠に使わない。後続補修候補としてCTOへ提示。

## 技術判断（Rulings）

- 0001 SQLは不変、0002へ運用表を追加、欠落snapshot/journalを補修。代償：実host executorの既適用履歴を公開前に別途確認。
- 鍵救済は認証済みowner証明＋全送信停止で受領しaccount権限を推定しない。代償：正当性reviewまで他の送信も停止する。
- hosted全version境界を証明できないためB04はBLOCKED、独立補修は継続。代償：コードPASSでも公開適用は進めない。
- R2期限後の物理キャンセル/分散transaction/exactly-onceは保証しない。代償：同じ不変object keyのlocatorを保持し、late completionでDBを確定しない。
- アカウント内複数UNKNOWNはまとめて移行せず事前拒否、異なるaccountは個別移行。代償：該当実データがあれば手動reviewが必要。
- paused retentionへの変更に伴い、旧隔離テストは明示resumeしてから消去を検証。代償：自動test設定とpublic pauseを混同せず、新paused不変試験を維持する。

## 公開環境と未確認

read-only Sites metadataで最新保存Version14と既存deployment succeeded/source b51be93f4bbd75877062530a49823c7243f02fc5/env revision19を確認。Chrome画面/実D1/実R2/全preview経路/inflightは未確認。公開code・env・OAuth/採用動画は変更していない。

B04正規停止/drain、実migration履歴、backup権限/期間、scheduler/通知、保持・Privacy/Terms/Supportの法務/業務採用が残る。新承認発行・送信・状態API・Portal操作は未実施。公開適用READYとはしない。

## 成果物

- phase5b_cleanup_tests.md
- phase5b_deletion_retention_tests.md
- phase5b_stop_boundary_review.md
- phase5b_migration_recovery_tests.md
- phase5b_preproduction_reassessment.md
- 本結果書

変更ファイル/全SHA-256は同日phase5b_sha256.jsonとlatest_reportへ保存。最終GitHub全文一致確認後に報告。次は彩花CTO評価とB04正規機能・実移行運用の読取確認。公開DB適用/deploy/Cron/実送信/審査提出は別承認のまま。
