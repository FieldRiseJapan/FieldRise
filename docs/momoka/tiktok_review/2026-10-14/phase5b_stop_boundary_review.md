# Phase 5-B B04 停止境界

**隔離モデルPASS / hosted全停止BLOCKED。** 2026-10-14。読み取り以外のSites操作なし。

## 正規機能の確認

Sites skillのstorage referenceは、SQL/snapshot/journalをsourceに保存し、公開時にWorker uploadより前にmigrationを適用すると説明する。Native toolsにはversion履歴、deployment状態、access/env/deploy操作があるが、全旧version/preview URLを跨ぐ保守ゲート、全writer凍結、inflight列挙/drainの正規保証は確認できない。

read-only list_site_versions：最新保存Version14、Sites source SHA b51be93f4bbd75877062530a49823c7243f02fc5。
Deployment appgdep_6accde9b243c819194554c0984de0805：succeeded、env revision19、既存更新時刻2026-10-12T13:23:08Z。URL https://fieldrise-creator-studio.wryrice16.chatgpt.site。
この管理メタデータの読取はChrome実画面/DB状態確認ではない。現在のsite access mode、全preview到達経路・旧Worker実行中処理は未取得。Secret/env値、worker生ログ、DBは読み取っていない。

## 隔離モデル

既存T17はVersion14実装を使い、新control haltだけでは旧transportが動くこと、外部OFF設定で拒否することを示す。追加2試験は旧/新の実HTTP handlerを模擬外側境界で包み、3種のorigin/version pathへの新規POSTを拒否。停止前のinflightはcancelしたと主張せず、完了を待ってからdrainが成立することを検証した。

外側境界はtests内だけ。公開ホストに導入済みではない。旧versionへのrollback時も外側境界を維持するモデルであり、実ホスト能力の証明ではない。送信controlのDB操作だけで旧Versionを停止できると判断しない。

## 残る条件

正規停止経路、全URL/preview/旧deployment inventory、全writer凍結、inflight静止証拠、Migration適用時の外側境界維持、rollback時停止強制をホストの正式機能/権限で確認する必要がある。アクセス制限やenv更新を代用品として勝手に実行しない。確認不能なら公開適用BLOCKEDを維持。

今回のB01〜B03/B05隔離補修を完了しても、B04をPASSへ上書きしない。実TikTok送信・状態APIなし。公開停止・env/access変更・deployなし。
