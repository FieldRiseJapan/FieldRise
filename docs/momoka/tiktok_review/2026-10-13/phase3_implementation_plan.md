# Sandbox送信承認・UNKNOWN保護 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
> ただし今回は実装禁止。次回社長承認後に実行方法を決める。本行は実装開始・委任の承認ではない。

**Goal:** 登録削除・再登録・競合・障害でSandbox送信承認が復活しないようにする。
**Architecture:** 案Aの独立した1回承認台帳を主とし、案Bの原子的受付を組み合わせる。D1の承認・試行記録を通常jobsから独立させ、外部fetch直前に一度だけdispatch資格を消費する。削除は送信との順序をDBで確定し、外部通信との原子性を仮定しない。
**Tech Stack:** 現行TypeScript / Workers / D1 SQLite / R2 / Node tests / Miniflare。新有料サービス・依存不要。
**Spec:** phase3_current_flow.md、phase3_db_migration.md、phase3_test_matrix.md、社長2026-10-13 Phase3指示。

## Global Constraints
- 今回はdocsのみ。コード、DB、デプロイ、実送信、状態確認、認証・Secret変更なし。
- main/社内版/SoundOn/YouTube/Supabaseに触れない。Version14/既存UNKNOWN/冪等性/予約と採用動画を維持。
- Sandboxはuser.info.basic/video.upload、VIDEO Inboxの承認素材のみ。Production/PHOTO/Direct Postは新台帳へ暗黙流用しない。
- 送信承認はサーバーの管理経路で発行。利用者同意/登録/prepare/API要求は承認発行ではない。管理公開APIを新設しない。
- 不明・破損・失効・移行未完了・DB障害・HMAC検証不可は拒否。再送/許可自動補充なし。

## Review Focus
- 同じrequestKey・違う素材→冪等性衝突拒否（Task2/T03b）。
- 登録中に別ownerが同TikTokへ接続→account単位拒否（Task2/T16）。
- dispatch資格消費直後にWorker停止→APIが実行されなくても再送しない（Task2/T08）。
- 削除と準備/素材アップロード競合→送信不可・孤立素材再開処理（Task3/T07b）。
- 旧版へ戻したとき新台帳無視→送信停止条件を解除せず切り戻す（Task4/T17）。

## 案比較
|観点|案A：明示承認grant＋attempt独立台帳|案B：account制限行＋原子的CAS（grant履歴なし）|
|---|---|---|
|二重防止|approval1回＋request/素材/account境界を記録|CAS残数は守れるが承認の対象/根拠を別途補う必要|
|登録削除|通常profile/jobsと分離|同様に別表を保持すれば可能|
|影響|4表＋既存jobs/leaseと連携、受付/削除を限定変更|2～3表で小さいが承認監査を付けるとAに近づく|
|移行|既存試行をlegacy記録にし未使用grantゼロ|残数0を設定、過去消費との対応を別記録|
|Privacy|仮名key+承認ID、保持方針が必要|accountkey+残数のみは小さいが理由説明が弱い|
|テスト|1grant/1attemptの不変条件が明確|quota期間/リセットの組合せが増える|
|費用|既存D1内、送信経路に数SQL追加|既存D1内、SQLは少なめ|
|切り戻し|台帳残して送信停止|同様。旧版は安全でない|
推奨：A＋Bの原子的受付。表数だけならBが小さいが、本件の「素材・宛先・1回のみ・承認根拠」に合うAを最小構成に限定する。一般公開版全ユーザーの料金/日次quota基盤は今回作らない。

## 識別・不変条件
- app_scopeは公開SandboxのIDを管理時に固定（7695356222514235410、登録確認が必要）。Production app7664531024089532432とは別。client_keyはSecretから照合し値をログに出さない。
- account_key=HMAC(用途分離鍵, environment+app_scope+open_id)、owner_key=HMAC(用途分離鍵, owner)。表示名は本人識別に使わない。
- 新Secretは増やさず既存TOKEN_ENCRYPTION_KEYからHKDF用途分離鍵を導出する候補。raw既存鍵を他用途で直接使わない。key_version固定、鍵更新時は送信停止/移行の別承認。仮名情報であり匿名ではない。
- 同一grantは1attemptだけ。UNKNOWN/RESERVED/DISPATCH_STARTED/PENDING/legacy UNKNOWNは自動解放しない。
- 同requestkey・同payloadなら既存attemptを安全に返すのみ。違payloadは409 IDEMPOTENCY_CONFLICT。二度目fetchは0。
- 新key・同素材もaccount上の未確定試行で拒否。成功後の意図的再投稿は別承認として扱い、内容SHAだけを永久banにしない。
- expiresは未使用grantの失効期限。期限経過でusedがAVAILABLEへ戻らない。approvalが不存在なら常にdeny。

## インターフェース（実装候補）
新lib/send-safety.ts：
- deriveSafetyKeys(env, owner, openId): Promise<{ownerKey,accountKey,keyVersion}> （戻り値は内部のみ）
- getSendGate(db, context): Promise<{allowed:boolean,code:string}> （UIにID/hash/残存tokenを返さない）
- reserveSandboxAttempt(db, input: {owner,ownerKey,accountKey,environment:'sandbox',appScope,grantId,requestKeyHash,payloadHash,mediaHash,jobId,draftId,revision,leaseHash,now}): Promise<{attemptId,jobId,replay:boolean}>
- claimDispatch(db, attemptId, now): Promise<boolean> （CAS returning、勝者だけfetch1回）
- recordAttemptOutcome(db, attemptId, outcome: 'UNKNOWN'|'PENDING'|'DEFINITIVE_REJECT', category, now): Promise<void>
- beginAccountDeletion(db, owner,ownerKey, now): Promise<{requestId,state:'QUEUED'|'READY'}> （送信/削除の線形化点）
- continueAccountDeletion(db,bucket,requestId): Promise<'QUEUED'|'COMPLETE'> （token/素材消去、再開可）
input中にtoken/URLを含めない。トークン更新は既存connectionを再利用するが承認台帳への格納なし。

## Task 1：スキーマ・承認台帳
Files：Create drizzle/0001_send_safety.sql（番号は実装時再確認）、lib/send-safety.ts。Modify db/schema.ts。Test tests/send-safety-workers.test.cjs。
Produces：send_control/send_grants/send_attempts/delete_requestsの制約とkey導出。
- [ ] T01/T10/T11/T14の失敗テストを書く（used grant再利用0、expired reject、invalidscope reject、raw値非ログ）。
- [ ] 隔離workerd/D1で失敗を確認。TikTokoutboundは例外拒否固定。
- [ ] DB文書の制約・HKDF用途分離を実装。制御rowの初期halted=1、許可自動生成なし。
- [ ] 同テストPASS、schema差分レビュー、限定Commit。公開DB適用なし。

## Task 2：受付・1回dispatch
Files：Modify lib/server.ts、lib/send-safety.ts。Test tests/send-safety-workers.test.cjs / tests/public-api.test.cjs。
Consumes：Task1台帳。Produces：reserveSandboxAttempt/claimDispatchと固定gate。
- [ ] T02/T03/T03b/T04/T08/T09/T12/T16の失敗テストを書く。
- [ ] 現行コードに対して新不変条件の不足を確認。既存関連9+5の全面再実行は変更後のみ。
- [ ] prepareはgrant有効性を確認するだけで消費しない。jobs受付時に同意/素材/宛先/scope/lease再確認→D1 batchでgrant消費・attempt作成・job作成・lease移動をまとめる。
- [ ] 各条件付きSQLの0rowsを成功扱いしない。batch内で固定CHECK assertionを失敗させ全rollback。読取と更新の間の外部await禁止。
- [ ] claimDispatchはRESERVEDからDISPATCH_STARTEDへの1回CAS。dispatch後はどの結果でもgrant消費維持。Worker停止やD1保存障害でも禁止を維持。UNKNOWN表記を成功へ変えない。
- [ ] 同payloadreplayはhistory表示のみ、prepareやURLの再発行/通信なし。直接APIでPHOTO/Productionは拒否。
- [ ] PASS/型チェック/build・固定ログ漏洩検査→限定Commit。実ネットワークは0。

## Task 3：削除・UI・Privacy
Files：Modify lib/server.ts、app/studio/studio.tsx、app/privacy/page.tsx、app/terms/page.tsx、app/support/page.tsx。Test tests/send-safety-workers.test.cjs。
Consumes：Task2の同じDB境界。Produces：begin/continueAccountDeletion、me.sendGate/deletionState。
- [ ] T05/T06/T07/T07b/T10b/T14の失敗テスト（削除してもAVAILABLEなし、個人データ有限保持、UI直呼びでdeny）。
- [ ] delete要求とgrant/attempt admissionを同DB原子境界へ入れる。先に削除なら新send不可。先にdispatchなら撤回済み送信を取り消せるとは約束しない。
- [ ] 現UNKNOWN移行中はlegacy job/leaseを変更しない。削除受付はQUEUEとして記録し、この既存jobの実削除は別承認/保持方針に従う。退会要求を永久拒否しない。
- [ ] R2削除はD1外なので再開可能。短期deletion request/asset manifestを残し、送信を閉じた状態で個人データ削除を完了、再登録でgrantは発行しない。
- [ ] UIはsendGate不可/取得失敗/未移行でdisable、UNKNOWNのstatus確認操作を勝手に実装しない。履歴取得errorを0件にしない。
- [ ] 保持期間/目的/既に到達し得る素材の扱いをPrivacyへ正確に反映→テスト/レビュー/Commit。

## Task 4：移行・切り戻し
Files：Create docs側移行runbook、隔離fixture。Test tests/send-safety-migration.test.cjs。
Consumes：DB移行文書。Produces：non-destructive移行/安全停止の証跡。
- [ ] T13/T15/T17/T18の失敗テスト（legacy原本全フィールド一致、halted default、partialmigration停止、旧版send停止）。
- [ ] 既存UNKNOWNを更新せず新台帳へlegacy不確定記録を追加。失われた16:51jobをDBへ捏造/復元しない。
- [ ] 境界scope/account/owner/HMAC一致とgrant AVAILABLE0を検査。
- [ ] migrationは隔離fixtureでのみ実行しPASS→レビュー。ライブ適用は別承認。

## Task 5：承認パッケージ
Files：docs/momoka/reports/latest_report.md、Phase3設計/検証報告。
- [ ] 変更対象・schema・保持方針・rollback・T01–T18実結果を提示。今回の設計だけでPASSを埋めない。
- [ ] コード実装承認、schema適用承認、公開反映承認を分ける。実送信は含めない。
- [ ] 実送信を検討するには既存UNKNOWN扱い/重複リスク/対象素材・宛先/有効期限/社長新承認が必要。
- [ ] 審査には認可/Inbox全経路実証とPortal現行値/最終資料/社長提出承認が必要。不足一覧を付けるだけでREADYへ進めない。

## 保持方針（承認候補、法的確定ではない）
- 通常token/表示名/draft/素材：削除受付後、安全な送信順序確定を経て速やかに削除。delete manifest処理後24h以内に除去を候補とする。
- 不確定jobのraw個人識別情報：現ジョブは今回維持。将来ユーザー削除要求時、必要性レビュー後に最小台帳へ移し、raw識別子を削除する別承認を取る。
- 仮名承認/attempt：未解決又は最終処理から30日を候補、30日で手動レビュー、最大90日で削除する候補。延長は個別根拠/通知/承認なしに行わない。30/90日は法令/公式指定ではなく社長判断待ち。
- 台帳の削除・期限到達は許可補充ではない。全ユーザーdefault deny、grant再発行の管理判断で過去UNKNOWNを確認する。有限保持後は自動的に「過去0件」とみなさず、既往不明として新承認に明示。
- 既存暗号鍵変更/安全台帳HMACローテーションは今回対象外。方針未承認なら台帳導入/削除ルーチンの公開を停止。
