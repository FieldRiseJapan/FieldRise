# Phase 5 公開適用前判定・補修承認チェック

2026-10-14 JST。資料作成 COMPLETE、公開適用 **BLOCKED**、Production提出 BLOCKED。
基準Commit/branch head：3ea80f209e5797f6867dbda2e25982fdfab81ed7、一致。今日の公開DB/Sites実測なし。

## P01〜P15

PASSは表で示した限定範囲だけ。公開運用確認を伴わない。

|No.|判定|根拠・確認区分|解消条件|
|---|---|---|---|
|P01コード一致|PASS|基準GitHubとlocal・Phase4 manifest17件全文SHA一致。branch以降差分なし|将来のdeploy SHAは別途確認|
|P02非破壊Migration|PASS|読取レビューで加算4表/索引/triggerのみ、既存表破壊なし。Phase4隔離非破壊試験記録|正規executor/履歴/部分失敗は公開NOT TESTED、B05で隔離確認|
|P03既存UNKNOWN保護|BLOCKED|合成T13の全field不変PASSは記録確認。今日の公開UNKNOWN/raw予約/owner対応NOT VERIFIED|停止下の完全比較、legacy期限と複数account移行の確認|
|P04送信停止方式|BLOCKED|旧版OFFはPhase4mock PASS。全Version/preview/inflightの停止保証なし|ホストの外側ゲート・静止・全writer凍結の実証|
|P05危険な旧版戻し防止|BLOCKED|haltを旧版が無視すること確認済み、roll-forward設計済み|運用の強制停止境界と復旧演習|
|P06保持期間|BLOCKED|30/90/24は運用案。TikTok契約全文/法務/実装起算一致未確認|B02/B03補修と方針承認・法務/契約確認|
|P07削除要求|BLOCKED|Phase4模擬要求・再開PASS。24h待機→目標遅延、鍵異常救済未整備|早期最小化/救済/期限監視の隔離追加試験|
|P08清掃schedule|BLOCKED|設計完成、scheduled handler/正規host経路/lock/budget未実装|B01・ホスト能力確認。Cron設定は別承認|
|P09清掃失敗安全性|BLOCKED|R2失敗manifest維持は隔離PASS。重複scheduler/fencing/期限超過・集計保存未実証|B01/B03競合・停止・alert試験|
|P10HMAC鍵管理|BLOCKED|HKDF/key_version/用途分離はPhase4隔離PASS。実keyを取得せず実形式/移行scope未確認|値非出力の正規診断とbackup/復旧鍵継続性確認|
|P11Secret非露出|PASS|Phase4canary/固定診断/静的0件の記録、Phase5は秘密値未取得、文書は実秘密を含まない|ホスト生URL/headerログ設定は別NOT VERIFIED、公開前確認|
|P12backup復旧|BLOCKED|Time Travel一般仕様確認。実DBbackend/プラン/権限/bookmark未確認|正規backup経路と安全台帳/削除再適用演習|
|P13適用順序|BLOCKED|凍結→停止→backup→加算DDL→全比較→safeVersion→清掃監視計画済み|P04とexecutor保証、B05演習|
|P14公開文面一致|BLOCKED|Privacy台帳保持なし、Terms5回制限混同、SupportURL説明差。提案作成済み|コード補修・法務・社長採用承認、公開更新は別承認|
|P15実送信禁止|PASS|今回TikTok送信/状態通信・承認発行/解除なし。DB/Sites/env操作なし|次工程でも別明示承認まで維持|

## 追加補修候補（未実装・未実行）

|ID|問題箇所・発生条件|影響|修正候補と必要な隔離試験|
|---|---|---|---|
|B01|processDeletionQueue/purgeSafety全件処理・lock無し、scheduled無し。複数呼出/大量backlog|重複cleanup、予算/期限超過、誤成功|bounded cursor、global/owner lock+fencing、ユーザーDELETE調整、heartbeat/固定失敗通知。2worker/lease失効/部分失敗/budget/TikTok遮断を試験|
|B02|deletionReadyはUNKNOWN時request+24hから、ownerSafetyは有効鍵/Sandboxに依存|24h完了目標不一致、鍵異常時の削除不能|即時通常情報最小化＋台帳保護、正規救済経路。鍵不一致・未接続・再登録・late callback/upload競合を試験|
|B03|legacy期限は移行日から、purgeは未確定を期限で削除、state/lease一般清掃無し|保持起算延長、期限超過、再承認の手動判断材料消失|起算統一、目的別期限清掃、集計証跡、UNKNOWN期限後も自動grant禁止/個別リスク評価。早期消去/90日境界/進行中lease保護を試験|
|B04|旧Version全URL/inflight停止境界が未確認|旧版から無承認dispatch可能|ホストの正規入口停止/全writer凍結を調査、isolated mixed-versionでOFF/外側停止証明。正規境界不可ならdeploy BLOCKED|
|B05|Drizzle journal0000のみ、0001 raw適用経路不明、再実行は失敗|Migration未適用/部分DDL/履歴差|正規executorと一回履歴・transactionを固定、partial/replay/recovery/unknown複数を隔離検証。SQL/code変更は承認後のみ|

既存102件の価値は維持し、運用境界の新試験に限定する。追加補修の仕様・DB運用表は社長/CTO承認後にのみ作成する。Phase5ではアプリ/SQL/公開文面を編集していない。

## 次の最小承認

まずB01〜B03/B05の専用ブランチ限定補修・隔離試験と、B04の正規停止/backup/scheduler能力の読取調査を承認候補として提示する。実Secret/公開DBへの接続は必要性と値非露出経路を別途審査。保持・文面案は業務/法務/TikTok全文確認後に採用。公開Migration/デプロイ/cron実設定をこの承認に混ぜない。

Windows操作は今回不要。正式CTO最終技術評価は提出待ちであり、桃花の自己評価を彩花の承認と扱わない。次の公開適用承認はBLOCKEDが解消した証拠を揃えてから依頼する。

## 成果物

保持/削除、清掃/監視、移行/反映、10障害の復旧、Privacy/Terms/Support提案、このP01–P15表を作成。Phase4実装・テスト・採用動画は固定。SHA一覧とGitHubCommitはlatest_report追記参照。
