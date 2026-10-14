# Phase 5-C Scheduler・監視能力

確認日時2026-10-14 12:26 JST。H1/H4/H6とCloudflare公式Cron/limits。公開設定変更なし。

Site管理情報のautomations=[]は、現在このSiteに紐づくcloud taskがないことを示す。Sites create_scheduleはprompt/VEVENT/timezoneでcloud taskを作る管理機能で、Worker scheduled handlerを正規に接続するAPIとは同一ではない。代用品としてcleanupを公開HTTPへ露出させない。

基準build workerはfetchだけでscheduled/queue handlerなし。Phase5-B内部runner/一時D1試験のPASSは公開定期起動のPASSではない。

|能力|判定|必要な確認|
|---|---|---|
|一般Workers Cron|VERIFIED（公式一般）|scheduled handler＋trigger、UTC、設定伝播の遅れ。Sites管理権限とは別|
|当Siteの正規scheduled設定|NOT VERIFIED|hostのsupported設定、owner権限、停止・再開・反映完了証拠|
|同時制御・budget|MODEL PASS|Phase5-B：owner2/R2 10/SQL40/wall60s、lock/fence/cursor。実ホストCPU/料金条件未確認|
|無料枠|NOT VERIFIED（当契約）|一般D1 Free query50、Worker実行制限あり。Sitesプランを推測しない、有料契約なし|
|通知|NOT VERIFIED|管理担当・固定通知経路・到達/失敗監視を確認。通知送信は未承認|
|heartbeat/期限超過|MODEL PASS|staleRuns/overdueDeletions/failedRuns集計。公開読取・通知なし|
|cleanup停止再開|MODEL PASS|pause/generationとglobal停止維持。正規operator実行経路未確認|
|運用ログ|NOT VERIFIED（host）|URL/query/body/headers/IP/token非露出設定と実保持期間。生ログを取得していない|

## query_count保留の再評価

基準maintenance.tsの終端は、telemetry UPDATE時のcountを保存した後、global releaseを1件追加して返す。正常完了経路で永続値は返却値より1少ない。hard budgetは別counterで末尾release用余裕を確保しており、上限突破の原因ではないというPhase5-B試験を再利用する。

しかし永続値を正確な監査数/請求数と表示するのは不適切。表示・利用を暫定参考に限定し、監査に使う公開運用前の修正を推奨（優先度：中）。補修案：最終予定数を保存し、成功/失敗・release失敗を区別した実呼出数試験。今回はコード未変更・追加試験未実行。

保持はrun集計30日候補、owner lock失効後30日候補、token/個人値を監視ログに入れない。公開方針採用前に実hostのログ・backup期間を確認する。

出典2026-10-14：[Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)、[Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)、[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)。
