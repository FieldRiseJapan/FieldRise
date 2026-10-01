# YouTube Phase 3-B9C — Staging最終検証

実施日: 2026-10-01 (JST)

## 判定

**STAGING VERIFIED WITH BLOCKERS**

B9Bで未実証だったtoken-table write自体のfailure rollbackと、anonのPostgREST table/RPC HTTP拒否を実証した。migration history repairは公式方式を確認したが接続認証経路がなく未実施。authenticated HTTP試験も安全なfixture認証・cleanup経路がないため未実施。したがって完全成功、および「historyだけが残る」判定にはしない。

Production readiness書は**DRAFT / NOT READY**として作成した。Productionの変更承認・実行可能判定ではない。

## Preflight / source / billing

| 項目 | 結果 |
|---|---|
| B9B正式commit / B9C baseline | `b722dad4b0195ad9425c7d2451ab87edd0ad9dbc` |
| 開始時GitHub main | baselineと同一。B9Bはancestor。OAuth関連競合なし |
| B9B正式3ファイル | GitHub mainから読み、localと全内容一致 |
| B9C checkout | 正式GitHub commitから独立worktreeを作成。既存worktreeの変更を上書きしていない |
| Staging | `FieldRise Staging` / `zjgmgwjeebphkbbqjbfi` / `ap-northeast-1` / `ACTIVE_HEALTHY` |
| Billing | Organization `free` / `tier_free` を再確認。既知のFree、spend cap、過去invoice $0.00、NANO、paid add-onなしと矛盾する情報なし |
| Billing操作 | 0。compute変更・課金設定変更・paid機能利用なし |
| 初期fixture | token 0 / transaction 0 / Auth user 0 |
| Production | DB、Auth、Secret、RPC、ACL、Function、tokenへ操作していない |

spend cap・compute・請求額の新しい画面はB9Cでは再取得していない。MCPによるFree tier確認と既知のbilling証拠を区別し、今回の請求額を独立に再監査したとは記録しない。

## 1. Migration history原因と一意な対応

| Remote version | Remote name | Repository version | 保存statementとlocal source |
|---|---|---|---|
| `20261001115200` | `20260927080000_youtube_oauth_token_store_bootstrap` | `20260927080000` | 1 statement、全文一致 |
| `20261001115628` | `20260927084829_youtube_oauth_transactions` | `20260927084829` | 1 statement、全文一致 |

原因は**A: MCP/Management APIによるserver-side timestamp生成**と、**C: repository filename versionをAPIのversionとして渡せないこと**。名称にtimestampを含めてもversion指定にはならない。適用SQLの入れ替わりや予期しないschema破損は認めていない。

確認根拠:

- 利用中`apply_migration` tool metadataは`project_id`, `name`, `query`だけで、version引数がない。
- [公式MCP implementation](https://github.com/supabase/mcp/blob/main/packages/mcp-server-supabase/src/platform/api-platform.ts) (`77df0794b4264988f7cec80bbb163c3eead8f268`) の`applyMigration`はManagement APIへ`name`と`query`だけを送る。
- [公式repository issue #241](https://github.com/supabase/mcp/issues/241) とSupabase MEMBERのコメントが、このserver生成timestampとlocal code-first管理の不一致を扱っている。
- Staging履歴2件のstatement本文をlocal sourceと比較し、両方の完全一致を確認した。対応は一意。

### 正式reconciliation方式と未実施理由

[公式CLI reference](https://supabase.com/docs/reference/cli/supabase-migration-repair) に`supabase migration repair --status applied|reverted`がある。schema SQLを再実行せず、履歴entryだけを扱う方式として利用する。

安全なStaging接続・一意なsource mapping・事前snapshot・schema/ACL確認を完了したうえで、専用Staging workdirで以下を行う計画とする:

```bash
supabase migration list --linked
supabase migration repair 20260927080000 20260927084829 --status applied --linked
supabase migration repair 20261001115200 20261001115628 --status reverted --linked
supabase migration list --linked
```

実行前にlink先がStaging refそのものであることを再確認し、処理中は`db push`/並行migrationを禁止する。各repair失敗時は続行せず履歴を再取得する。逆方向の公式repairで前のversion集合へ戻せるが、元name/statementを復元するには元のsource mappingも保持する。schemaやtokenをrollbackする操作ではない。

**B9Cでは未実施。**CLI用access token、DB password/URL、保存CLI認証が見つからず、`npx --no-install supabase`も利用不可だった。接続credentialを作成・転用せず、MCPにはrepair toolがないため、手動のhistory DELETE/UPDATE/INSERTへ置き換えていない。正式方式がunsupportedという判定ではなく、この環境から実行する認証経路が不足している。

**MIGRATION HISTORY BLOCKER REMAINS。**履歴は開始時の2件のまま。既存migrationのrename/rewrite、再適用、履歴修正は0。修復前の`db push`は禁止。

## 2. Token write failure / atomic rollback

実行source: `tests/youtube/staging/test_token_write_failure.sql`。

Staging identity/healthを直前に再確認したうえで、明示transaction内に生成dummyとOAuth transactionを作成した。token tableへ「短い旧dummyは通し、長い新dummyを拒否するCHECK constraint」を一時追加し、正常consume済みtransactionでB8 cutover RPCを呼んだ。dummy値をDDL literalへ埋め込んでいない。

cutoverのtoken writeで期待したconstraintの`check_violation`を捕捉した。functionは先にtransaction finishを更新するため、この試験はfinish更新後にtoken writeが失敗する実経路を検証する。

| Assertion | 結果 |
|---|---|
| token write自体のCHECK failure | PASS |
| 旧dummy保持 | `OLD_DUMMY_PRESERVED` |
| consumed状態を保持 | PASS |
| finished_at / result_codeの更新rollback | PASS |
| half commit | 0 |
| outer transaction ROLLBACK後token fixture | 0 |
| transaction fixture | 0 |
| 一時constraint | 0 |

Auth、owner、role、ACLを変えていない。constraintはboundaryを強化する試験条件で、永続化していない。fixture testなのでmigration toolを使わず、明示ROLLBACKを含むSQLを実行した。migration history entryは増えていない。dummy値・token値をclient出力、ファイル、report、application logへ出していない。

## 3. PostgREST HTTP boundary

実行source: `tests/youtube/staging/test_postgrest_browser_denial.py`。Staging固定URLにpublishable keyのみをstdinで渡し、credentialを表示・保存しなかった。service-role keyをHTTP browser-role試験へ使っていない。

| anon request | HTTP | Error code | 結果 |
|---|---|---|---|
| token SELECT | 401 | `42501` | DENIED |
| token INSERT | 401 | `42501` | DENIED |
| token UPDATE | 401 | `42501` | DENIED |
| token DELETE | 401 | `42501` | DENIED |
| RPC reserve | 401 | `42501` | DENIED |
| RPC consume | 401 | `42501` | DENIED |
| RPC finish | 401 | `42501` | DENIED |
| RPC cutover | 401 | `42501` | DENIED |

全8応答で試験token/keyの反映なし。raw応答本文を出力していない。HTTP拒否後のtable aggregateも0を確認した。

**authenticated HTTP: NOT RUN / BLOCKER。**Staging Auth userは0。安全にuser作成・token取得・cleanupまでできる既存のtest認証経路はない。signupメール送信、Production user/JWT転用、合成JWT、Auth managed table直接編集、service keyのbrowser流用をしていない。authenticatedのtable権限/4 RPC EXECUTEは実DB effective privilegeで全てfalse。これをauthenticated HTTP PASSとは扱わない。

## 4. 最終DB security / cleanup / Advisor

| 対象 | 最終metadata |
|---|---|
| token table | owner `postgres`、RLS on、FORCE off、policy 0、PK constraint 1 |
| private transactions | owner `postgres`、RLS on、FORCE off、policy 0、constraints 8 |
| token ACL | PUBLIC/anon/authenticated: table privilegesなし。service_role: SELECT/INSERT/UPDATEのみ |
| 不要service_role ACL | DELETE/TRUNCATE/REFERENCES/TRIGGER全てfalse |
| 4 OAuth RPC | owner `postgres`、SECURITY INVOKER、search_path空 |
| RPC EXECUTE | PUBLIC/anon/authenticated false、service_role true |
| RPC bodyのAuth dependency | `auth.` / `supabase_auth_admin`参照なし |
| token / transaction / Auth fixture | 0 / 0 / 0 |
| temporary test constraint | 0 |
| migration history | 開始時の2件を維持 |

[Security Advisor INFO](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy) はRLS enabled/no policyの既知2件のみ。deny-by-defaultと承認済み標準service_role経路の設計どおり。新規重大warningなし。

## 5. RegressionとTrust Model

- Node / YouTube / Auth / Gateway / Creator Studio / DB / bootstrap contract: **70/70 PASS**。既存test削除なし。
- B9C Python probe: syntax validation PASS、実anon HTTP 8項目PASS。offline安全性checks 4件PASS（Production拒否、service-key拒否、拒否結果処理、予期しない成功/credential fieldを検出して停止）。
- B9C SQL failure test: 実DB assertions PASS。
- Deno: **DENO VALIDATION NOT AVAILABLE**。installなし。
- `git diff --cached --check`: 対象4ファイルでPASS。secret/credential/user-identifier pattern scanも4ファイルPASS。JWT、API key、private key、実user UUIDのliteralを検出するpattern検査であり、専用secret scannerの完全検査とは区別する。
- B9B concurrency結果は2要求中成功1、replay/expiry拒否を継承。B9Cで再consume試験を重複実施していない。
- Start-time AAL2 + 最大5分capabilityモデルを維持。callback-time AAL2 VERIFIEDとは扱わない。Start後のlogout/revokeだけで発行済capabilityを無効化する設計ではない。

## 6. 残blockerとProduction準備

1. Stagingの公式history repairを実行できる安全なCLI認証経路が必要。
2. authenticated HTTP table/RPC拒否を実証する、作成からcleanupまで可能なStaging-only fixture mechanismが必要。
3. Production既存token tableの広いservice_role ACLは、今回のstrict bootstrap existing-table contractと不一致になり得る。B9CでProductionを再監査/変更していない。別承認のcompatibility/ACL判断なしにbootstrap適用・履歴mark-appliedしてはいけない。
4. mainのGatewayはまだ`validation_only`で、shared real-upload integrationと本投稿用idempotency/outcome_unknown、legacy入口閉鎖が未完成。OAuth stack検証だけでは投稿可能にならない。

Production readiness設計: `docs/momoka/designs/youtube_phase3b9c_production_cutover_readiness.md`。blockerを解決した後の1つのProduction Cutover実行フェーズとしてまとめた。B9CでProduction、Google、YouTube、Deploy、Secret、投稿buttonへ進んでいない。

## 7. B9C変更ファイル

- `tests/youtube/staging/test_token_write_failure.sql`
- `tests/youtube/staging/test_postgrest_browser_denial.py`
- `docs/momoka/reports/youtube_phase3b9c_staging_final_verification.md`
- `docs/momoka/designs/youtube_phase3b9c_production_cutover_readiness.md`

正式commitと登録後SOURCE MATCH結果は、GitHub登録後の完了報告で通知する。
