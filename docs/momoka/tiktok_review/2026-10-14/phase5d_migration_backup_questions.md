# Phase 5-D Migration・backup詳細質問
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


Phase5-C migration/backup資料を再利用。公開DBには接続しない。以下を主照会Q4/Q5の補足として準備し、一括で内部資料を添付しない。

|ID|質問|回答で必要な条件|
|---|---|---|
|M01|SQLせず適用履歴/checksum/schema状態を読める正規管理方法は|権限・対象・表示範囲|
|M02|Drizzle journalとhost履歴の照合方式は|適用済みmetadata不変、誤差検出|
|M03|SQL適用とWorker uploadの順序は|既知workflowの正式確認、旧writer停止前提|
|M04|DDL/複数migration/receiptのtransaction範囲は|batch/REST/host executorを区別|
|M05|失敗deploy/部分DDLの確定手段は|成功・不明・未適用を区別|
|M06|再実行・checksum変更拒否・roll-forwardは|履歴を改ざんせず復旧|
|R01|backend/planとbackup保持期間は|当契約での仕様、一般D1との区別|
|R02|backup作成/復元の権限・停止手順は|all writer drain前提、影響範囲|
|R03|復元後の非機密整合性検査は|schema・件数・安全情報保全比較|
|R04|承認消費の巻戻りと削除情報の復活を防げるか|正規外部証跡/再適用・復旧時停止|
|R05|旧版codeとDB復元の組合せ制御は|停止解除を自動実行しない|

未取得の最新公開DB状態を0件/正常と推定しない。失敗時は送信停止維持、実UNKNOWN内容維持、roll-forwardを優先評価する。DB内容/ID/request key/利用者情報を照会に含めない。

