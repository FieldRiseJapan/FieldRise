# Phase 5 ロールバック・障害復旧

2026-10-14。設計のみ。公開操作NOT TESTED。原則：送信停止を維持し、新台帳を残して修正Versionへroll-forward。旧版単純再deploy、DB時点復元、承認消費巻戻しを禁止。

## 不変条件

DB復元は消費済み承認をAVAILABLEに戻し得る一方、復元時点より後のUNKNOWNを消し得る。R2/TikTokはDBと同時に戻らない。復元だけで整合性が保証されるという説明は禁止。既存21:42結果を成功/失敗に書き換えない。旧16:51を架空復元しない。履歴のUI不具合を理由に制限を初期化しない。

## 障害別手順

|障害|検知|停止・保護|復旧候補|復旧後確認/承認|
|---|---|---|---|---|
|Migration途中失敗|executor失敗/DDL hash差/履歴不一致|全writer停止、新表もDROPしない。旧job/lease比較|不足DDLを把握し、加算補修SQLを隔離検証。再実行で上書きしない|構造・履歴・全field不変。補修SQL個別承認|
|新build失敗|型/build exit非0|旧公開を維持、保守送信停止|固定sourceを修正・隔離build|追加コード承認。公開deployなし|
|新deploy失敗|Deployment失敗/旧SHA応答|mixed Worker含め外側停止、台帳保護|新safeVersion再deploy。旧版へ自動rollback禁止|allURL source/gate確認、deploy個別承認|
|認証異常|認証固定エラー、接続表示不一致|Secret/OAuthを勝手に変更せず停止。token非出力|request/session処理を隔離分析、必要最小修正|再認証は別承認、失敗中削除救済を確保|
|台帳不整合|FK/receipt/scope/key/UNKNOWN差|global halt＋外側停止、AVAILABLE発行なし|消費記録を保護、原因を隔離再現。既状態の強制変更禁止|修正/データ補修は別承認、dispatch count未確定はUNKNOWN維持|
|UNKNOWN表示異常|DB/履歴APIと画面の件数差|0件表示を送信許可根拠にしない|表示修正のみ、DBを初期化しない|job/key/lease/attempt比較、mock回帰後deploy承認|
|runner異常|failed>0/heartbeat途切れ/lock競合|cleanup停止＋send停止。消費を戻さない|cursor/fence/対象分類を診断、小batch再開|scheduler変更/再開承認、外部fetch遮断試験|
|R2削除失敗|固定R2 category/期限超過|locator保持、通常消去未完了と通知|同じ対象の冪等消去を再開、他ownerには触れない|R2消去確認・DB最小記録・期限、清掃救済承認|
|Worker停止/timeout|run未完了、dispatch CAS後UNKNOWN|自動送信再開/承認返却なし|清掃のみlease/fenceで再開、送信結果は不明維持|旧Workerがfenceを失ったことを確認、手動承認|
|旧Versionへ戻す要求|運用操作計画|新tableを残し、外側停止を保持。旧版は新haltを認識しない|安全fix版へroll-forward優先。旧版は全送信拒否/静止を実証した場合だけ候補|CTO評価＋社長個別承認。OFFだけで完全保証しない|

## 最終手段のDB復元

公開バックアップ機能・期間・対象識別は未確認。Cloudflare資料ではFree7日/Paid30日で、復元は既DBを上書きする。通常復旧として採用しない。

どうしても必要なら、社長の復元承認に加え次を事前に満たす：外側ゲート/全writer停止とinflight静止、復元直前の最新安全台帳・削除要求を暗号化保全、対象bookmark確認、隔離で差分検証。復元後は消費/UNKNOWN/削除要求の欠落を非出力比較し、現行状態を再構成する計画を個別審査。復元で復活したgrantは一律停止し、送信権限としない。削除済み個人データは再公開前に再消去。記録不足なら自動補完せず停止継続。実送信の結果はDBで推定しない。

最新台帳を安全に取得・比較・再適用する経路が保証できなければ復元案自体BLOCKED。不可逆な承認消費やTikTok受理可能性を巻き戻せない。元のデータ復旧と送信許可再開は別の判断。

## 公開前の復旧演習案（未実行）

合成D1/R2でpartial migration、旧worker mixed traffic、台帳差、R2失敗、cleanupロック失効、backupからAVAILABLE復活、消去済みprofile復活を再現する。TikTokは全通信mock、raw秘密出力禁止。実restore・実DBは使わない。既Phase4の102件はこれらの運用演習完了を意味しない。

出典確認日2026-10-14：[Cloudflare Time Travel](https://developers.cloudflare.com/d1/reference/time-travel/)・[D1 Limits](https://developers.cloudflare.com/d1/platform/limits/)。
