# Phase 5-C 実行中通信の静止

確認日時2026-10-14 12:26〜12:28 JST。H1/H3/H4/H7および公式資料の読取。ライブログ/DB/TikTok確認なし。結論：実drain NOT VERIFIED、公開Migration BLOCKED。

Cloudflare公式Workers Limitsでは、接続中のHTTPに一律のwall上限はなく、Cron/Queueは15分。waitUntilの30秒は応答/切断後の延長で総HTTP時間の上限ではない。runtime更新時のgraceはruntime保守の挙動であり、Siteコードdeployの停止完了保証へ転用しない。

基準sourceのTikTok fetch20秒、upload10分、maintenance wall60秒はアプリの論理期限。Abort/Promise raceは外部受理の取消証拠ではない。新規入口を止めても開始済みfetchがTikTokに到達している可能性は残る。既UNKNOWNを失敗へ変更しない。

|確認対象|結果|公開前に必要な証拠|
|---|---|---|
|受付停止の反映|NOT VERIFIED|全origin/version/previewへの原子的拒否、反映完了状態|
|既Worker静止|NOT VERIFIED|実行中要求/外部fetch/writerの列挙とゼロ確認、流入停止の維持|
|Worker再起動時の再実行|NOT VERIFIED（host）|sourceに送信自動retryなし、外部scheduler/queue設定・retry仕様を確認|
|Scheduled/Queue継続|NOT VERIFIED|未表示のprovider内部経路を含む停止範囲|
|DB writer確認|NOT VERIFIED|秘密/本文を含まない実行一覧・隔離証拠。DB読取が必要なら別承認|
|模擬drain|MODEL PASS（Phase5-B）|停止前inflightを待ち、後続拒否。実ホストには導入していない|

一定時間待っただけで静止としない。正規一覧/drainがなければ、供給者による強制受付停止・全producer停止と終了証拠を検討し、証拠が揃うまでDBに触れない。時刻経過、CPU制限、deployment succeededをdrain証明にしない。

公式出典（2026-10-14）：[Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)、[ctx.waitUntil](https://developers.cloudflare.com/workers/runtime-apis/context/)。一般Workers仕様であり、Sites独自保証は別NOT VERIFIED。
