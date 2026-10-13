# Phase 4 限定実装・隔離試験報告（2026-10-13 JST）

判定：限定コード実装・隔離試験 PASS。公開適用 NOT APPROVED。Production審査 BLOCKED。

## 実装
独立した一回承認台帳と原子的受付を実装。send_control/send_grants/send_attempts/delete_requests の4表を追加する加算Migration。初期停止、承認自動発行なし、消費の不可逆化、環境・owner・TikTok account・素材・request/payload照合、削除中拒否、外部通信前のdispatch CASをサーバー側で強制する。D1 batchの0行は制約違反でrollbackし、結果不明時は通信しない。Inbox動画通信はredirect:manual、3xx非追従拒否、固定例外分類を維持。

登録削除は要求を原子的に記録し、未使用承認を取消、未確定試行を仮名記録へ最小化して保持する。通常素材・個人情報の削除再開処理と有限保持の内部runnerを実装。新規承認発行API・自動承認・自動再送はない。Token暗号化アルゴリズムと実Secretは変更していない。

## 実測
- 全関連試験：102 PASS / 0 FAIL / 0 SKIP / 0 CANCEL。
- 実行：node --test --test-concurrency=1 tests/*.test.cjs tests/*.test.mjs（合成MP4 fixture使用）。
- TypeScript --noEmit --incremental false：PASS。
- 最終framework build：PASS（終了コード0）。
- git diff --check：PASS。
- Miniflare/workerd、ローカル永続一時D1、一時R2、ローカルmockのみ。外部fetchは遮断。実TikTok通信ゼロ。
- 既存UNKNOWNを合成fixtureで移行し、jobs/leases全フィールド不変と繰り返し移行の冪等性を確認。実21:42ジョブへの照会・変更はなし。旧16:51レコードは生成していない。

## T01–T20実測一覧
以下は実行ログの成功行。番号の細分化を含み、関連API試験がHTTP handler・実R2競合を補完する。

- T12 actual API rejects missing approval and explicit confirmation (22993.318844ms)
- T02 actual simultaneous requests dispatch only once (17226.217709ms)
- T05 actual UNKNOWN deletion keeps history and source metadata (10070.817981ms)
- T03b actual handler rejects replay with changed payload or account (44716.391691ms)
- T07b direct upload and preparation remain blocked during UNKNOWN deletion (213.929389ms)
- T07b R2 failure preserves deletion manifest and safe retry finishes after 24h (326.502065ms)
- T10b maintenance runner completes queued deletion at 24h using only local R2 (1877.738929ms)
- T18 HKDF identity is stable, separated by owner and app, and rejects invalid keys (1836.566831ms)
- T17 exact Version14 ignores new control but external OFF prevents old transport (426.530474ms)
- T01 consumes exactly one approval and dispatch claim (19922.17529ms)
- T02 two concurrent reservations accept only one (19038.896598ms)
- T03 replay returns existing attempt without dispatch (10526.07866ms)
- T03b changed payload with same key is conflict (12208.339462ms)
- T04 unknown never returns approval or permits another attempt (15631.23969ms)
- T05 unknown deletion queues and preserves consumed approval (20153.455996ms)
- T06 re-registration never creates a grant (8610.027952ms)
- T07 deletion-first refuses dispatch and dispatch-first remains consumed (4914.043784ms)
- T07b deleting owner cannot prepare or upload through direct server (7037.728175ms)
- T08 persisted Worker restart never reissues dispatch (12530.898401ms)
- T09 communication failure preserves UNKNOWN (4628.164643ms)
- T10 expired grant and expired URL are rejected (12943.5218ms)
- T10b 30-day review and 90-day purge do not restore permission (11934.215639ms)
- T11 foreign owner/account and Production grants are refused (5956.873751ms)
- T12 direct reservation without approval is refused (3988.611418ms)
- T13 legacy migration preserves every job and lease field and is repeatable (14907.445405ms)
- T14 API errors contain no request key or private context (6488.556419ms)
- T15 zero-row lease movement rolls back approval job and attempt (5704.83748ms)
- T16 another owner of same account cannot bypass unresolved attempt (3358.187717ms)
- T17 halted control freezes queued dispatch; API suite proves old-Version OFF (3783.10407ms)
- T18 missing migration or invalid key version fails closed (6570.413453ms)
- T19 new key and new grant cannot resend same unresolved media (11578.857697ms)
- T20 halt after admission blocks a queued worker (8482.083934ms)
- T15 zero-result persistence is rejected instead of claiming success (8083.417824ms)
- T10 dispatch claim after approval expiration remains blocked (2950.005935ms)
- T10b expired unused approval is finite and never replenished (8661.953424ms)


## レビュー・失敗修正
独立レビューでCritical 0、Important 4。削除と遅延uploadの競合、削除後Callbackのcredential再作成、未使用承認の無期限残存、dispatch取得直後停止時のINITIALIZING表示を指摘。再現失敗を確認し、最小限修正後に全試験PASS。
- upload：原子的な予約、10分stream上限、ready=0と非削除profile条件による最終保存、24h清掃tombstone。
- callback：OAuth開始時刻・削除時刻・profile・state期限を最終DB保存で照合。実OAuthは再実行なし。
- grant：期限切れ処理と最大90日削除候補、権限の自動補充なし。
- claim：CASとジョブUNKNOWN記録を同一batchで処理し、途中停止の再dispatchを拒否。
試験初期のDB meta比較・D1 mock RETURNING未対応・合成容量fixtureの不一致はharnessを修正。認証・同意・制限を緩和していない。修正後の全102件がPASS。

## 安全検査
合成canaryでエラー/診断への機密context非露出を試験。固定例外分類のみでraw例外、stack、本文、token、署名URLをログへ追加しない。公開frontendに台帳ID/HMAC/tokenを出さない。秘密鍵/長いGitHub credential/AWS keyのソース静的検査は0件。これは機密漏洩不存在の絶対保証ではなく、実Secretは読み取っていない。

## 判断・公開前条件
1. app_scopeにClient Keyのfingerprintと固定Sandboxアプリ識別を使用。秘密値は表示しない。将来の承認移行は同じscope算出条件で実行する必要がある。
2. HKDF用途別HMACは合成鍵で検証。key_version不一致停止。実鍵ローテーションなし。
3. 通常データ消去後のR2 cleanup locatorは最小化・UI非表示・24h。仮名記録も個人情報になり得るためPrivacy案に明記。30日review/最大90日purge/24h消去目標は暫定値で法定期限ではない。
4. 保持・清掃runnerは内部関数のみ。公開schedulerは未設定。公開適用前にスケジュール・監視・失敗時再開と期限を承認・検証する必要がある。
5. 旧Version14は新台帳停止を理解しない。隔離mockでhaltのみでは旧版が通信すること、TIKTOK_ENABLED=falseで止まることを実証。旧版へのrollbackを安易に行わず、別途停止・切戻し承認が必要。
6. D1/R2/TikTokの分散transactionや厳密exactly-onceを保証しない。承認済み試行の二重dispatch抑止とUNKNOWN安全停止を検証した。
7. 既存の無関係dirty作業は別worktreeで保護。専用ブランチへ対象ファイルのみ保存。cloud skillの補助scriptがlocalにないため同等の進行記録を使用（実装影響なし）。

## 公開Migration計画（未実行）
実行前に公開停止設定・旧Workerとの境界・バックアップ/整合性確認・保持方針/scheduler承認が必要。0001は加算DDLのみ。新controlはhalted=1。実UNKNOWNからの内部migrateUnknownは停止時のみ許可し、元job/key/leaseを変えない。旧16:51を復元しない。未使用grantを自動作成しない。許可台帳初期状態、旧job/lease全文不変、制約、key_version、scopeを確認してから新Workerへ反映する。実承認発行/実送信は今回対象外。
逆DDLは適用しない。台帳を残して停止・不変ソースへのroll-forwardを優先。旧版への戻しは送信停止を別途確認した場合に限定。不可逆な承認消費は復元しない。

## 残る承認・ブロッカー
公開D1適用、Sitesデプロイ、scheduler/保持方針・Privacy文面、実UNKNOWNの非破壊移行手順には別途承認が必要。ライブデータ保全は今回未操作であり実DBの現在状態を新規PASSとはしない。
OAuth認可録画、Inbox成功/受信証拠、Portal最終整合性と提出承認は未解消。採用済み第一部動画は固定・未編集。今回の試験PASSは実TikTok送信成功を意味しない。公開版はVersion14のまま。
