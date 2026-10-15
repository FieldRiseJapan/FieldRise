# Phase 5-E 非実行・段階的移行計画
確認日：2026-10-15 JST。基準：feaee5e16f4077fc9c81300ad2a17fe937ebf311。公開環境・実DB未接続、実通信/移行なし。
判定：調査資料。B04・公開適用・移行実行はBLOCKED。


Bを技術調査第一候補とするだけで、採用/移行未承認。旧Sites無害化が証明できない現在は**計画実行不可**。

|段階|必要な確認/成果|停止条件・別承認|
|---|---|---|
|G0仕様|U1と正式技術回答を分離し、旧全経路/停止/drain/backup/費用契約を確定|証拠不足なら調査継続のみ|
|G1棚卸し|Sites全Version/Preview/Deployment/直通/producer/CIを正規管理で一覧化、UNKNOWN保全元を特定|実DB読取が必要なら先に個別承認|
|G2停止計画審査|host強制停止＋全writer drainの手順・例外・完了証拠を定義。新hostは未作成|停止/認証変更の実行承認は別。保証不成立なら以降禁止|
|G3保全|承認下で正規backup/export、schema/journalと最小完全比較証跡、削除要求・消費済み承認の最新記録保護|backup権限/復旧経路未確認で開始しない|
|G4完全隔離|合成DB/R2/鍵/ownerでmigration・旧版競合・再登録・二重dispatch・restore巻戻り・CPU/memoryを検証|TikTok通信遮断。既139を全やり直しせずadapter/host差分中心|
|G5host設計/審査|権限分離、URL全制御、同意/原子受付、非再送、独立halt、cleanup/監視をレビュー|商用/支払/hard cap未解決なら公開不可|
|G6旧環境無害化|別承認下で全経路停止・既writer静止を実測、旧資格の能力喪失を検証|新CFのdisableだけでは旧Sites停止証拠にならない|
|G7データ移行|承認下でhalt状態の新DB/R2へコピー、全field/size/hash/owner/UNKNOWN/lease/request key比較|差異・鍵非継続・delete再生成で停止。実データのログ出力禁止|
|G8callback/URL|別承認で新HTTPS callback、SITE_ORIGIN/cookie/state/CSRF、TikTokメディアprefix所有権、Terms/Privacy/Supportと申請説明を変更|旧Callback codeを再利用しない。既session移行を推定しない|
|G9非送信公開検査|承認なし受付拒否、未知job保護、cleanup/監視の責任・期限、rollback禁止条件を確認|新規grant/状態API/送信なし|
|G10個別実証|過去UNKNOWN・重複リスク評価、別素材/対象/回数/停止条件を特定し社長承認を取得|不明時再送なし。承認を自動発行しない|
|G11審査|不足OAuth/Inbox受信の真実の証跡と採用済み第一部を保持、Portal整合確認後に社長最終承認|提出は別承認、未成功を演出しない|

失敗時は両系統の送信停止を維持。DBだけのrollbackでgrantや削除情報を復活させない。旧Version14を再公開して戻さず、比較証跡を保持したroll-forwardを優先する。復旧能力が不明なら再開せずBLOCKED。

Cloudflare正規MigrationはSQLファイルの適用履歴を管理できるが、Drizzle journalと同じ履歴表とは限らない。公式Wrangler資料は失敗したmigrationをrollbackし、先行成功分は残すと説明している。複数ファイル全体を単一transactionと推定しない。承認済み0001/0002のhash・snapshot・journalを照合し、実適用済みmetadataを改変せず、隔離で正規executorとの対応を検証する。Worker rollbackはDB/R2を復元しない。

R2 lifecycleの期限処理は通常期限後24時間内だが遅延もあり、24時間の削除完了目標や即時通信取消の保証ではない。素材の復旧コピー能力はD1 Time Travelと別に確認する。

関連公式資料（同日本文確認）：https://developers.cloudflare.com/d1/reference/migrations/ 、https://developers.cloudflare.com/workers/wrangler/commands/d1/ 、https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/ 、https://developers.cloudflare.com/r2/buckets/object-lifecycles/ 。

Secretsは社長管理の正規Secret入力/安全な直接移送、平文取得/チャット/CLI引数/ログ/GitHub/HARに出さない。暗号化鍵/HMACの継続不明時は移行停止。callback/メディアdomain変更にはTikTok登録・利用者再認可の影響があり、今回操作しない。

TikTok公式（2026-10-15本文確認）：
- https://developers.tiktok.com/docs/en/login-kit-web ：登録済みのstatic HTTPS callback、state保護とserver側Secret管理。
- https://developers.tiktok.com/docs/en/content-posting-api-reference-upload-video ：video.upload、Inbox init、PULL_FROM_URLのdomain/prefix検証、TikTok側で最終編集/公開。
これらの要件適合はhost移行のTikTok承認やSoundOn公式音源/収益を保証しない。今回はVIDEO Inbox調査に限定し、画像中心の長期運用方針やSoundOnデータを変更しない。

