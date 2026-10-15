# Phase 5-F 無害化方式A〜D
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


|方式|公式確認と保証候補|不足・再有効化|UNKNOWN/データ影響|判定|
|---|---|---|---|---|
|A Sites提供元全停止|共有制限はDOCあり。Suspendはworkspace資料、Plus適用不明|全版/Preview/旧deploy/admin/内部producer/drain/rollback維持の正式回答必要|データ保持型停止なら候補。export/復旧は未確認|NOT VERIFIED→BLOCKED|
|B TikTok資格失効|DOCにOAuth revoke、refresh APIあり|全access/refresh系列・反映遅延・既通信・再認可を排除する保証不足|履歴は別保全。失効は過去UNKNOWNを失敗にしない。新旧同appへの影響要確認|PARTIAL→BLOCKED|
|C 外部送信遮断|旧codeすべてが通るhost egress拒否なら設計候補|Sitesに正規全版egress制御の証拠なし。新proxy/haltはdirectfetchで迂回可能|外部受理を取消せず、data writer静止とも別|NOT VERIFIED→BLOCKED|
|D Delete site|DOC：永久削除、復元不可|全旧経路/既Worker/既外部fetchの終了時点・保持資源範囲の保証なし|保全と復旧を損なう危険。D1/R2全消去詳細を推定しない|安全な移行手段としてBLOCKED、実行禁止|

優先はAのデータ保持型全停止の正式保証。B/Cは補完候補であり、外部送信を拒否できても全DB writerのdrainは別。Dを最短手順として提案しない。
各案で停止完了の時刻・範囲・例外・適用プラン・権限・rollback後の維持・保全先を正式証拠として求める。単一HTTPエラーや失効応答だけで全無害化と判定しない。
既16:51消失履歴の架空復元禁止。既21:42 UNKNOWNの今日の実在/完全性はNOT VERIFIED。Grant/Lease/request keyは変更せず、同素材再送禁止。バックアップ復旧でgrantをAVAILABLEへ戻さない。

DOC（2026-10-15取得）：https://learn.chatgpt.com/docs/sites 、https://learn.chatgpt.com/docs/enterprise/sites （SuspendはPhase5-Eで取得済み）、https://developers.tiktok.com/docs/en/oauth-user-access-token-management 。

