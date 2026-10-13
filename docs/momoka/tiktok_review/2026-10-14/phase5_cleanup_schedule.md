# Phase 5 清掃スケジュール・障害監視設計

基準Commit：3ea80f209e5797f6867dbda2e25982fdfab81ed7。2026-10-14。設計のみ、Cron未設定、公開DB未接続。公開運用BLOCKED。

## 現行runnerのレビュー

`lib/send-safety.ts::processDeletionQueue` はdeleting profileを全件抽出し、ownerごとR2削除→finishDeletionRowsを実行する。失敗はfailed集計、manifestを維持する。tombstoneはprofile消去後も抽出する。TikTok通信関数は呼ばない。`purgeSafety` は期限切れgrantと台帳・完了要求を消すが全件SQLで、run記録/ロック/カーソルなし。state/lease一般清掃なし。`build/sites-worker.ts`にはfetch handlerのみ、scheduled handlerなし。

現行runnerだけをCronから呼ぶ案は不採用。件数・時間上限、同時清掃とユーザー削除の調整、監視が不足する。Phase4試験はこれらの運用全体を保証しない。

## 推奨方式・設定案

|項目|提案|導入条件|
|---|---|---|
|実行方式|同一管理境界のscheduled handlerから内部関数を呼ぶ。公開HTTP cleanup APIを設けない|Sitesが正規scheduled導入/DB・R2権限を提供できるか未確認。できなければBLOCKED、他サービスへ無断移行しない|
|頻度|削除/短期state・lease清掃：15min、UTC `*/15 * * * *`。保持review/purge：日次UTC22:00（JST07:00）|頻度・無料上限は提案。Cron反映には最大15minの伝播余地がある|
|権限|cleanupにはDB/R2最小bindingのみ。Client Secret/token/TikTok fetch capabilityを渡さない|HKDF owner用途の鍵利用は既存秘密を表示しない内部呼出。専用鍵変更は今回対象外|
|上限|1run：owner2件、R2操作10件、D1 statement40以内、時間60秒目標。保持purge50行、合計budget超過なら継続カーソル|最初に隔離で計測。Free D1は1invocation50queries上限を考慮。超過時は次runへ、成功完了としない|
|同時実行|run/owner単位の原子的lease＋fencing世代。ユーザーDELETEも同じowner lock|新運用表/column・runner変更が必要。期限leaseだけでは遅延旧Workerを排除できない|
|実行結果|run_id、fixed stage/category、processed/failed/deferred/expired counts、duration、last_success、oldest_due_ageのみ|owner/open_id/HMAC/URL/token/request本文/raw例外/stackをログへ出さない|
|再試行|R2/DB清掃のみ、同一対象の冪等deleteと確認。次回runでbackoff15/30/60min、以後手動確認|送信/状態API/承認再発行は一切起動しない。DB結果不明は次回readで再照合|
|通知|監視画面の固定障害表示＋既存無料の運用経路を候補とする|新契約・メール/LINE送信・自動化作成は今回なし。通知経路と受信担当を公開前に確定|

上限は小規模初期値。backlog増大なら容量を再設計し、無料枠超過を課金で解決しない。

## 処理対象・検証順序

1. schema/hash/key_version/app_scope/bindings確認。不一致はrun失敗・送信停止。
2. global運用lockをCAS取得。ownerlockはユーザー削除と共通。期限切れtakeoverは前Workerがfenceを持てないことを検証後のみ。
3. 削除要求を期限順・cursorで抽出。非削除profileを巻き込まない。素材owner/id/readyを照合。R2失敗時はDB locator保持。
4. 24h tombstoneはupload最長10minを超え、全R2消去成功を確認後だけlocator消去。途中停止は再実行可能。
5. state期限・利用済み/期限切れleaseを用途別に除去。使用中leaseを無条件削除しない。削除対象 UNKNOWN job/key/leaseは通常掃除で触れず登録削除に限定。
6. review_dueを集計し手動必要性評価。台帳期限purgeは送信権限を発行せず、UNKNOWNを成功/失敗へ更新しない。
7. 最終集計保存。failed>0や期限超過は失敗/部分完了。例外を握りつぶしてCronを成功にしない。scheduledのpromise失敗を固定エラーで伝える。

## 監視・停止再開

last_successが45min超、連続失敗2run、24h削除目標超過、90日期限超過、DB schema/key異常でalert。期限超過時も安全情報を勝手に初期化しない。清掃停止中はsend_control haltと承認なしを維持。台帳破損・長期停止では既存pending dispatchも停止し、失敗監視を継続。

手動停止：承認済みcleanup停止フラグを設定（未実装）、送信停止維持。Cron削除のみでは伝播中/実行中Workerが残るため内部停止/fenceも必要。再開：原因解消・対象確認・dry-run集計・少数batch・failed0を確認、送信許可は別承認。failed runを消さない。手動操作も社長の個別承認が必要。

## 必要な隔離追加試験（未実行）

B01補修：2scheduler競合、lease期限切れ旧Worker継続、ユーザーDELETEとの競合、budget停止/カーソル、R2部分失敗、D1結果不明、fence喪失、期限境界、Cron固定失敗表示、外部fetch遮断。B03補修：state/lease purgeとdispatch中予約保護。runner停止でもgrantが復活しないことを確認する。

## 出典（2026-10-14）

[Cloudflare Cron](https://developers.cloudflare.com/workers/configuration/cron-triggers/)：UTC/設定伝播/実行履歴。
[scheduled handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)：promise失敗と実行結果。
[D1 limits](https://developers.cloudflare.com/d1/platform/limits/)：Free query上限とbatch実行制限。
Cloudflare一般仕様とSitesでの利用可否は別。ホスト管理権限・プラン・通知はNOT VERIFIED。
