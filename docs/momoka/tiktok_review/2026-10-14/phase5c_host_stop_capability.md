# Phase 5-C 正規ホスト停止能力

確認記録時刻：2026-10-14 12:26:02 JST（03:26:02Z）。管理情報は同時刻直前の新規読取。基準953df97ed3027dc1e7104706d7f674d64b24a723、branch head一致。
**調査結果：B04 BLOCKED。正規停止機能不存在と断定せず、必要保証の証拠が得られていない。**

## 証拠台帳

|ID|情報源|確認範囲・結果|
|---|---|---|
|H1|Sites get_site、対象project appgprj_6acb0c3677d88191b7fc6ca303bcf3d7|active/public、呼出者owner、設定可能custom/public、current_live_url確認、current_preview_url=null、最新14、automations空配列。個人/credential/tokenフィールドを保存・出力しない|
|H2|Sites list_site_versions limit50|Version1〜14を保存済みとして確認、pagination cursorなし。保存版は到達可能な旧URLの証拠ではない|
|H3|Sites get_deployment_status|Version14 deployment appgdep_6accde9b243c819194554c0984de0805 succeeded、env revision19、source SHA b51be93f4bbd75877062530a49823c7243f02fc5。更新は10/12、取得は今日|
|H4|GitHub基準Commit source|build/sites-worker.ts fetch入口、lib/server.ts、.openai/hosting.json、journal、maintenance。Sites provider SHAとGitHub SHAは別履歴|
|H5|Sites storage skill正式workflow|D1/R2 provision、公開時Worker upload前にmigration、失敗deployでもDDL適用済みの場合がある|
|H6|Sites native toolの公開宣言|access/env/deploy/version/schedule管理は提供。全version drain/全writer凍結の操作契約は見当たらない。管理画面の未知機能を否定しない|
|H7|Phase5-B資料・139PASS記録|内部haltで旧版を止めない、模擬外側境界/drain PASS。再試験しない|

## 保証判定

|必要能力|証拠分類|評価|
|---|---|---|
|現在Siteの公開アクセス設定|VERIFIED|public、ownerがcustom/publicを選択可能。変更していない|
|全Version共通拒否|NOT VERIFIED / B04 BLOCKED|customの旧URL/preview/service経路への適用範囲不明、認可されたowner writerも停止する仕様は未確認|
|旧Version14停止|MODEL PASS|OFFは旧実装mockで効く。全旧Workerへ反映済みとは主張しない|
|Preview停止|NOT VERIFIED|current_preview_url nullは全過去/版別URL無効の保証ではない|
|全HTTP writer拒否|MODEL PASS|tests内外側境界のみ。GET callback等もDB writerとなり得る|
|実行中Worker/drain|NOT VERIFIED / BLOCKED|列挙・受付遮断後の静止・既外部通信受理の確認手段なし|
|Scheduled/Queue停止|NOT VERIFIED|tracked入口にhandlerなし、Site automation0。基盤内部consumer/Cronまで不存在とは言わない|
|Migration/rollback中の停止|NOT VERIFIED / BLOCKED|access/env変更とmigrationの原子的境界・旧deploy再有効化の拒否を保証する契約なし|

公開DB、Secret/env値、生workerログ、TikTokへアクセスしていない。get_siteは管理情報のみ選択抽出し認証情報を使用しない。access変更、credential発行、deploy、suspend操作は一切なし。

次の正規確認事項：全Route/Version URLへの保守拒否仕様、例外/bypass扱い、反映完了証拠、inflight・全writer一覧/静止、migration前停止維持、rollback制約。管理者/提供元の正式資料または回答を取得する必要がある。
