# Phase 3 現行処理調査・原因分析
確認日：2026-10-13 JST。調査/設計のみ。ライブDB・TikTok API・公開設定は未操作。
基準/最新head：6d6503d3e596093e9980402765de3e7d8c14a8c1。compare identical、ahead/behind 0。現在のブランチ変更なしを開始時確認。

## 根拠ファイル（このCommitに固定）
|ファイル|Git blob|
|---|---|
|apps/tiktok-public/lib/server.ts|425dfc803f95b5866fc2a8876573b9ecfa18e196|
|apps/tiktok-public/app/studio/studio.tsx|7176c223443e3508e97cdb492709fc302b0618c8|
|apps/tiktok-public/db/schema.ts|f57ca0ebd25c0bd28b6c5b8fd211bd2432d271f6|
|apps/tiktok-public/drizzle/0000_clammy_captain_america.sql|b3c654d9ba8d4148a546ca2ac4b50682128fe1c1|
|apps/tiktok-public/lib/policy.mjs|c637d2377d7f9c0351b1818768e88ebc60756b09|
|apps/tiktok-public/tests/inbox-workers-phase1.test.cjs|e147de7a5b39d34eb61188dc668ea6f9068df69f|
|docs/momoka/reports/latest_report.md|396633b81cf7a0f3d1128f7ab9c29e6522c7d745|
誤候補lib/schema.ts、src/db/schema.tsは404。実在するdb/schema.tsとmigration原本で確定。新規コード変更なし。

## 処理順序
1. handle→dispatch：origin確認、ChatGPT利用者取得、非GETのsameOrigin、profiles存在/deleting確認。GET healthと期限付きmedia pullは認証前の例外。
2. prepare-inbox（server 168–179）：設定/Sandbox/mediaVerified→同意→下書きrevision・動画1本→所有素材→表示名Runa-Girl8215と2scope→ownerのjobs COUNT=0→承認済み容量/原本digest→ready予約生成（2時間）→実URL全体GET/hash。TikTok APIなし。
3. POST jobs（182–196）：設定/mediaVerified/同意/requestKey→owner/key既存jobなら同job返却→下書き/素材→Sandbox VIDEO限定のconfirmSend・prepared lease・表示名・jobs0・実URL再照合→connection（必要時token refresh）→条件付きINSERT INITIALIZING→leaseをjobへ移動→Inbox API1回→publish_id保存。
4. atomic INSERTはownerの24h件数とINITIALIZING/PROCESSING/STATUS_UNKNOWN不在を同SQLで判定。通常2同時受付を排除する保護は存在。owner/request_key UNIQUEも存在。単純SELECTだけの設計ではない。
5. catch：明示的な特定TikTokエラーのみFAILED、その他STATUS_UNKNOWN。HTTP502でjobを返す。D1結果保存失敗/Worker終了ならINITIALIZINGのまま残る可能性。外部APIとD1は原子化できない。
6. GET jobs（181）：ownerで新しい順100件。UI refreshHistoryは取得エラーを0件と扱わず、act失敗時も取得し直す。UNKNOWN成功/失敗を補完しない。POST jobs/idはpublish_idがなければ拒否するが、今回は実行禁止。
7. removeAccount（97）/DELETE account（131）：profiles.deleting=1→各R2削除→DB.batchでleases/states/connections/jobs/drafts/assets/profilesをowner単位削除。未確定状態保護・独立承認台帳なし。
8. 再登録（130）はprofiles INSERT OR IGNOREのみ。送信承認の確認/消費なし。

## 確定原因と影響
- 全削除でjob/lease/request_keyが消え、再登録後jobs0になるためSandbox VIDEOの件数ゲートが復活する。現在のSQLと2026-10-12社長削除記録が整合する。
- 「TikTokで未受理」「必ず重複した」は未確定。16:51と21:42の結果はUNKNOWNのまま。
- connection.open_id UNIQUEは接続競合を防ぐが、削除で接続を消すと別owner再接続が可能。owner件数だけではTikTokアカウントを跨ぐ安全性情報を維持しない。
- 同一素材digestは今回の承認素材照合に使われるが、独立の送信消費状態ではない。新requestKeyでも件数保護が消えれば再受付の余地がある。
- Sandbox PHOTOはVIDEO専用1回ゲートを通らず、通常LIMITS.sends=5に入る。Phase 3では新しい安全境界で未承認写真を拒否する設計が必要。
- 削除はdeleting書込み・R2削除・DB.batchが分かれる。途中でprofile確認を済ませた送信との競合は未解決。R2とD1の分散原子性なし。途中失敗時deleting維持で削除再開UIが出るが、先行sendの通信を確実に止める設計ではない。
- UI send disabled条件（studio 41）：busy/同意/dirty/保存draft/素材/接続/設定/mediaVerified/準備URL+1時間残。jobs件数/UNKNOWNを直接参照していない。準備ゲート拒否がprepared不在を生み無効になる場合があり、現在の無効ボタンをサーバーの恒久的禁止状態と混同しない。
- 履歴状態確認ボタンはbusyのみで無効化。publish_id有無はUIに渡されない。今回このボタンを操作しない。

## Worker障害・ログ
送信APIfetchは20秒timeout、動画Inboxのみmanual、3xx拒否/非追従、固定例外分類。タイムアウトは未受理の証明ではなくUNKNOWN保持。
ログはstage/httpStatus/category固定、本文/token/署名URLを記録しない設計。素材サイズ診断は固定eventと容量。プラットフォームaccess logsがURL等をどう秘匿するかは別検証が必要。
jobsにはowner/open_id/request_key/draft_id/publish_id等の個人に結びつく情報がある。connectionsには暗号化token。leasesはURL鍵のhashと所有者/素材/期限。安全性台帳を匿名情報と言い切らない。
今回新規ライブログ/秘密値/DBを取得しない。既存記録とソースによる判定。21:42残存は社長指示と前工程の実機/DB記録による、10/13にDB再確認済みとは記載しない。

## 固定成果物
社長承認のfieldrise_v14_review_part1_final.mp4/SRTを正式採用版として固定。編集/再デコード/再テストなし。コードの成功やInbox受信証拠として扱わない。
