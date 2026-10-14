# Phase 5-B B01 cleanup補修・実測

基準：f87794040ab304273e4c1111519bcf39babfccdc。2026-10-14 JST。専用ブランチ内・隔離D1/R2のみ。公開Cronなし。

## 実装

maintenance_control（初期paused1/generation1）、maintenance_locks（global/owner lease+fence+cursor）、deletion_tasks、maintenance_runs、safety_exceptionsを加算0002に追加。send-safetyから内部runnerへ委譲。owner2、R2操作10、SQL40、実時間60秒を初期上限とする。request受付・owner消去・素材清掃のDB書込はfence/世代を確認する。

永続巡回cursorは利用者の生IDでなく削除request IDとasset IDを用いる。先頭障害後も次の対象へ進み、restart後も再開する。ownerの途中素材はready=-1で進捗を保持し、R2失敗はlocatorを消さない。owner lockは失効から30日で清掃候補、不要なglobal cursorも清掃する。

R2にはPromise.raceによる残りwall budgetのdeadline。deadline後に処理が解決してもDB確定しない。R2自体の物理キャンセルやrollbackは保証しない。対象object keyの再利用を行わず、late upload locatorを保持する。時刻clockと実行時間wall clockを分けた。

pause/resumeは世代を更新し送信controlを停止状態に保つ。retentionもpause/世代を守る。途中世代変更はbatch内assertionでrollbackし、消去完了と報告しない。public HTTP cleanup/再開APIは設けない。

## 試験

実workerd/D1でlockの競合・takeover、owner+global fence、停止世代、SQL/R2予算、R2部分失敗/再開、profile消去後tombstone清掃、カーソルのrestart、stale heartbeat/期限超過集計を確認。2つの実Workerリクエストでローカル遅延serviceを挟み、旧処理のDB確定を防いだ。未知の外部fetchは全遮断、遅延serviceはMiniflare内mock。

R2長時間待機の再現はdeadlineを外した際に700ms以内の完了条件がFAIL、復元後PASS。通知情報は固定分類と集計のみ。stale run、24h超の未完了要求を集計し、個人識別子を返さない。正式通知先・scheduler導入は未設定。

## レビュー結果

Important：受付0行成功、pause無視、cursor飢餓、wall deadline不備をRED→GREENで修正。tombstone loop位置/DB wrapperのbatch欠如は原因を修正し回帰試験。予算を緩和していない。
Minor保留：maintenance_runsのquery_countは最後のglobal releaseの1操作を含まない。返却countとhard budgetは実呼出分を含むため、上限保証には影響しない。集計値を厳密な請求/監査数に利用しない。

## 未検証

公開scheduler、実ホストbudget/通知、ライブDB・R2、清掃遅延SLAはNOT TESTED。停止中の公開cleanupを実行していない。24hは運用目標で履行済み保証ではない。
