# Phase 5-B B02/B03 削除・保持実測

2026-10-14。完全隔離・合成データのみ。公開利用者・token未取得。

## 削除

認証済みowner/profileの確認後、owner lockと原子的receiptで削除要求を受理する。lock喪失/0行は全batch rollback。HTTP DELETEは202受領を返し、完了と区別する。接続token/stateは受領時に消去し、新規操作を止める。素材と下書き等はbounded runnerで通常情報を消去するため、UNKNOWNの24h待機を廃止した。

鍵が利用不能・ledgerのowner/account/scope対応が不一致の場合は、認証を弱めず救済要求を記録する。global haltと最小限のランダムsalt付き例外digestを保持し、アカウント権限を認定しない。正常形式だが不一致のHMACもreview必須。旧UNKNOWNのHMAC/試行状態を勝手に書き換えず、新承認は作らない。アカウント単位の再開には正当性確認・別承認が必要。

削除後の遅延Callbackは生ownerのdeletion taskと認可開始時刻で最終saveを拒否。uploadは既存deleting/ready fenceを維持し、遅延素材のcleanup locatorを保全する。再登録は未完了task中拒否、完了後も送信承認なし。UI/public policy文面は変更していない。

## 保持

legacy review/purgeを移行日から元試行作成日起算へ補修。30日review、90日消去候補は暫定運用案。期限でUNKNOWNを成功/失敗へ変えず消去し、scopeを先に停止する。例外digestも90日候補で消去しglobal停止維持。未使用grantの失効と削除は一度に50件まで。

期限切れstateと用途終了leaseはbounded清掃。INITIALIZING/PROCESSING/STATUS_UNKNOWNのjobに属するleaseは期限だけでは削除しない。完了delete_requests/deletion_tasksは完了+24hで消去候補、素材locatorはR2成功を確認して24h以降に除去。失敗はlocator/未完了taskを保持し期限超過alert対象。

期限後も権限を自動生成しない。送信承認発行経路は今回作らない。例外・法務方針は未確定であり、運用停止の解除・実鍵ローテーションは未実施。

## 実測したケース

認証なし拒否、鍵利用不能受付、正しい形式の異なるledger key、受付中takeover rollback、UNKNOWN早期通常情報消去、R2 failureと再開、既存試行不変、遅延Callback/upload、削除後再登録拒否、30/90/24h境界、paused retention不変、途中世代変更拒否、進行中lease保護、例外/owner lock有限清掃。合成ownerによるものでライブ保全の新実測ではない。

## 未確認

公開削除要求の処理能力・保持期間の法務/TikTok契約適合・バックアップ/運用ログ消去はNOT VERIFIED。24h達成には正規scheduler/監視導入が必要。通常データ消去と最小記録保持、受領と完了を利用者へ区別する。
