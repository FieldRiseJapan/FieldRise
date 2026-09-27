# YouTube Phase 3-B7E 専用最小権限DB role Security Review

**実施日:** 2026-09-27
**最終判定:** **DESIGN REVISION REQUIRED**
**対象:** FieldRise Stagingの読み取り専用metadata、公式仕様調査、local source review。Staging/Productionへの書き込みなし。

## 判定要旨

B7CからB7Dまでの正式mainとB7D報告書を読み合わせ、Supabase/PostgreSQL公式資料、Staging role/table metadata、および既存64件のNode回帰テストを確認した。Dedicated `NOLOGIN` roleをSECURITY DEFINER helperのownerにしても、Stagingの`auth.sessions`を必要な行だけ読み取る方式は立証できなかった。実Stagingでは`auth.sessions`が`supabase_auth_admin`所有、RLS有効、`FORCE ROW LEVEL SECURITY`無効、policyなしである。PostgreSQLのdefault-denyにより、`NOBYPASSRLS`で非ownerの新roleには、仮にSELECTを付与しても行が見えない。`BYPASSRLS`付与、managed Auth ownership変更、Auth policy変更はいずれも最小権限またはmanaged Auth境界に適合しない。

さらに、PostgreSQLのfunction ownership transferは、実行者が新ownerへ`SET ROLE`でき、新ownerが対象schemaのCREATE権限を持つことを要求する。現在のmigration実行role `postgres`からcustom roleへ安全に移譲する手順は、membership/SET ROLEを含めずには確認できなかった。Supabase公式資料はAuth schema全体を`supabase_auth_admin`所有として保つ必要性を説明する一方、custom roleへの`auth.sessions` SELECT grantのサポート性・upgrade durabilityは明記していない。この境界は**UNVERIFIED MANAGED-AUTH PRIVILEGE**として残す。

安全な代替方式も今回の公式資料と現行設計からは選定できない。migration、contract test、OAuth runtime codeは変更せず、本報告書だけを追加する。B7F以降は、Auth session revocationとstate consumeを同一DB transactionで保護できる公式supported mechanism、またはlogout後callbackの信頼要件を含む再設計を先に決める必要がある。

## Baseline・環境・範囲

| 項目 | 確認結果 |
|---|---|
| B7C baseline | `df02f14a62e154aec232372239ac69a720359099` |
| B7D正式main / B7E開始baseline | `ff36a876d635c1bb8400fe88ce0207b27e277c71` |
| local HEAD / origin/main | B7E開始時点で双方`ff36a876d635c1bb8400fe88ce0207b27e277c71`、working tree clean |
| B7D report SOURCE MATCH | GitHub正式mainから取得した内容とlocal blobが一致 |
| B7D→B7C累積範囲 | B7D報告書を含むmain treeを正本として確認。直近commitだけから設計差分を推定していない |
| Staging | `FieldRise Staging` / `zjgmgwjeebphkbbqjbfi` / `ap-northeast-1` / `ACTIVE_HEALTHY` |
| Production | 今回アクセス・変更なし |
| Billing | Supabase組織metadataはFree plan (`tier_free`)、`opt_in_tags=[]`。有料機能・支払設定・Compute変更なし |
| Staging writes | なし。role、ACL、migration、fixture、Auth user/sessionの変更なし |

Free planでcustom PostgreSQL roles自体に別料金が必要という根拠は見つからなかった。PostgreSQL role/ownership/GRANT操作はDB機能だが、本方式はセキュリティ要件を満たさず採用していない。費用が発生した操作はなく、課金設定も変更していない。Free枠を超える設計を前提としていない。Free運用互換性は**課金面では確認、採用可能な安全設計としては未成立**。

## B7D `INVALID_ARGUMENT` 分析

B7Dのmigration要求は1回だけで`INVALID_ARGUMENT`を返し、再実行も別経路適用もしていない。B7Eではtool schema/input contract、migration fileを読み取り専用で確認した。

- tool contractは`name`（snake_case）、`project_id`、`query`の3引数。記録されたmigration名`youtube_oauth_transactions`とStaging project refは形式に合致する。
- migration SQLは7,870 bytes、transaction wrapperを含むSQL file。内容には通常のDDL、関数定義、GRANT/REVOKEがある。
- toolはエラー詳細を返さず、入力schema validation、transport/tool adapter、query内容のどの段階で拒否されたか判別できない。
- transaction wrapperが原因、SQL syntaxが原因、権限不足が原因とは断定できない。

**結論:** root cause **UNVERIFIED**。B7Eではapply toolの再呼び出し、SQL Editor、CLIなどの代替適用を行っていない。

## 実Staging metadataとRLS評価

以下は読み取り専用catalog/metadata結果。session rowやcredential値は読み出していない。

| 対象 | 実測 |
|---|---|
| `current_user` / migration executor | `postgres` |
| `postgres` attributes | `rolsuper=false`, `rolbypassrls=true`, `rolcreaterole=true`, `rolcreatedb=true`, `rolcanlogin=true` |
| `supabase_auth_admin` | `rolsuper=false`, `rolbypassrls=false`, `rolcreaterole=true`, `rolcanlogin=true` |
| `service_role` | `rolbypassrls=true`、NOLOGIN相当、CREATEROLE/CREATEDBなし |
| `auth.sessions` owner | `supabase_auth_admin` |
| `auth.sessions` RLS | 有効。`FORCE ROW LEVEL SECURITY`無効。policyなし |
| direct SELECT | `service_role`になし。現在の`postgres`とtable ownerにはあり |
| candidate role | `fieldrise_oauth_session_checker`は存在しない |
| migration history / B7D object | migration履歴なし。OAuth schema/table/RPC/helperなし。B7Dで確認したAuth users/sessions件数はいずれも0 |
| PostgREST exposed schemas | SQL session/catalog設定から確定できず、**UNVERIFIED** |

PostgreSQL RLS仕様では、RLS有効時に該当policyがなければdefault-denyとなり、`BYPASSRLS` roleと通常のtable ownerはRLSを迂回する。したがってcandidate roleに`NOBYPASSRLS`、`NOSUPERUSER`、非-ownerを維持したままでは、SELECT grant単独でsession rowを読むことはできない。table owner化や`BYPASSRLS`付与で回避する設計は要求されたleast privilegeを満たさない。Supabase docsはAuth schema entitiesを`supabase_auth_admin`所有とする前提を示し、所有権違反は後続upgradeで問題化し得ると説明している。

## 公式仕様とDedicated role feasibility

| 問い | 評価 |
|---|---|
| Supabase/PostgreSQLでcustom NOLOGIN roleを定義可能か | PostgreSQL公式`CREATE ROLE`に`NOLOGIN`、`NOSUPERUSER`、`NOCREATEDB`、`NOCREATEROLE`、`NOBYPASSRLS`等がある。Supabase docsもrole hierarchyと権限管理を説明。一般的なDB role機能としては可能。ただし本用途のmanaged Auth accessがsupportedという意味ではない。 |
| SECURITY DEFINER ownerにできるか | PostgreSQLではfunction ownerの権限で実行される。roleがfunctionを所有する一般機能は可能。Supabase managed Auth tableを読む専用ownerとしてsupportedとは確認できない。 |
| owner transfer要件 | `ALTER FUNCTION ... OWNER TO`の実行者は新ownerへ`SET ROLE`でき、新ownerはfunction schemaのCREATEを持つ必要がある。role membershipなしでこの条件を満たす手段は今回の資料から確認できない。 |
| auth.sessions最小権限 | 必要なのは該当user/sessionの`id`照合。列SELECTに狭めてもRLS default-denyを解決しない。auth.sessionsへのcustom role SELECT grantが公式supported/upgrade-safe/migration-safeかは**UNVERIFIED MANAGED-AUTH PRIVILEGE**。 |
| API/JWT境界 | `NOLOGIN`はDB login不可を意味するが、PostgREST exposed schema/API設定とは別境界。API roleとして使わない設計にはできる一方、実Stagingのexposed schema設定を確認できていない。現状private helper schemaを非公開と断定しない。 |
| Lifecycle/upgrade/restore | role/grantの作成者、migration時のmembership、function replace、backup/restore、Supabase upgrade時のmanaged Auth grant保持について本用途向けの公式保証を確認できない。**UNVERIFIED**。 |

### 候補比較

| 候補 | 評価 | 主な未達/リスク |
|---|---|---|
| **A. Dedicated NOLOGIN + SECURITY DEFINER + auth.sessions SELECT** | **不採用** | NOBYPASSRLS非owner roleでは実Staging RLSのdefault-deny。BYPASSRLS/owner/policy変更は不可。Auth SELECT grantのmanaged support/upgrade safetyは未検証。ownership transferにもSET ROLE/membership経路が要る。 |
| **B. SECURITY INVOKER** | **不採用** | service_roleには現状auth.sessions SELECTがなく、BYPASSRLS=trueのservice_roleに付与すればhelperより広い実行主体にAuth row accessを与える。外部session checkとconsumeを分離するとTOCTOUが戻る。 |
| **C. Auth session参照を除去** | **未採用候補** | Start-time AAL2、短TTL、user/session binding、one-time consumeはreplayや競合を抑えるが、Start後logout/revokeからcallbackまでの失効を保証しない。明示されたrevoke race要件を満たす根拠がない。 |
| **D. Supabase supported Auth verification API** | **未確定** | callbackにuser JWTがない現行設計で使えるserver-side session validation mechanismと、Auth検証からDB consumeまでのatomicityを公式資料で確認できない。別API確認なら検証直後のrevoke raceが残る。 |
| **E. その他の公式方式** | **選定なし** | 今回確認した公式資料の範囲で、managed Auth objectを変更せずsession validityとstate consumeを原子的に守る方式は確認できなかった。普遍的に存在しないとは主張しない。 |

**採用方式:** なし。現在のB7C migration / callback architectureをStagingやProductionに適用しない。必要な最小権限設計が確定するまで**DESIGN REVISION REQUIRED**。

## Threat modelとrole lifecycle

| 脅威 | 現状候補の評価 |
|---|---|
| stolen/expired state、replay、parallel callback | B7C transaction row lock、expiry predicate、conditional consumeはsource上の意図。実DBでは未試験でありPASS扱いしない。 |
| logout/revoke/delete before callback | session row lockはhelper ownerのAuth row accessが成立する場合に限り同一transactionの保護を意図。現行RLS/owner権限で専用roleが成立せず、実DB lock/race証明なし。 |
| DB timeout/ambiguous result | callbackはconsume失敗/曖昧結果でfail closed・再試行なしの契約を維持。DB側実証は未実施。 |
| privilege escalation / helper abuse | function owner権限、schema exposure、EXECUTE ACLを実DBで未監査。B7Eで新規grant/owner設定はしていない。 |
| search_path injection | candidate SQLは空search_pathと完全修飾参照を使う。実DB functionは未作成なので実効設定未検証。 |
| custom role/API/JWT misuse | role未作成。NOLOGINだけでPostgREST exposure全体を証明できない。exposed schema設定も未検証。 |
| future Supabase upgrade | Auth ownership前提は公式資料に説明あり。custom Auth SELECT grantの耐久性とrole lifecycleは未確認。 |

候補roleは未作成なので、owner、membership、password、API/JWT利用、削除者、restore時の扱いは設定していない。後工程で候補を再検討する場合も、membership/SET ROLEの手順、Auth grantの公式根拠、upgrade/restore後の再検証方法が先に必要。B7Eではrole metadataを観測しただけで、role作成・membership変更はゼロ。

## Validation・変更範囲

- Node回帰: `node --test tests/youtube/*.mjs tests/test_youtube_creator_studio.cjs` — **64/64 PASS**（OAuth、Auth、Gateway、DB contract、Creator Studioを含む）。
- contract test: 既存テストを実行。新規テスト追加なし。migration sourceとその前提の候補を変更していない。
- Creator Studio: 既存8件を含むtest suite内でPASS。投稿機能は有効化していない。
- Deno: **DENO VALIDATION NOT AVAILABLE**（実行環境に`deno`なし。global installなし）。
- `git diff --check`: staged対象追加後に実施しPASS。
- Secret scan / 変更ファイル確認: credential-shaped pattern scanで報告書に該当値なし。変更対象は本報告書1ファイルのみ。
- migration変更: なし。
- callback/shared変更: なし。
- Staging/Productionへのrole、GRANT、migration、fixture、Auth、Secret、Function変更/deploy: なし。
- Google/OAuth/YouTube実通信、再認可、channels.list、実upload: なし。

## 次回Staging検証の前提と残blocker

次回に進む前に、彩花CTOのレビューで以下を決める必要がある。

1. Auth logout/revokeとOAuth callback consumeをどう同一の安全境界に置くか。別APIによる事前確認をatomicと扱わない。
2. `auth.sessions`のSELECT grantがSupabaseにより明示的にsupportedでupgrade-safeと確認できるか。確認できなければAuth管理objectへのgrant/policy/owner変更はしない。
3. custom ownerへのfunction作成・再作成を、migration role membership/SET ROLEの安全な手順なしに実現できるか。立証できなければ専用owner案を不採用とする。
4. PostgREST exposed schemaとfunction discovery/execution境界をDashboard/API設定と実DB ACLの両方で監査できること。
5. それらが成立した後に別フェーズでStaging-only role/ownership試験を明示承認する。B7Eでは実行しない。

残るStaging blockerは上記のsupported access path、ownership transfer、公開境界の未確定。Production blockerは、設計承認、Staging適用・実DBのACL/owner/RLS/競合/rollback検証、別途のProduction承認がすべて未了であること。B7Eの結果からProduction準備完了とは扱わない。

## 参考仕様

- [PostgreSQL 17: `ALTER FUNCTION`](https://www.postgresql.org/docs/17/sql-alterfunction.html) — owner変更権限、新ownerへの`SET ROLE`、schema CREATE要件。
- [PostgreSQL 17: `CREATE FUNCTION`](https://www.postgresql.org/docs/17/sql-createfunction.html) — SECURITY DEFINERのowner権限と安全なsearch_path。
- [PostgreSQL 17: Row Security Policies](https://www.postgresql.org/docs/17/ddl-rowsecurity.html) — default-deny、BYPASSRLSとtable ownerの挙動。
- [PostgreSQL 17: `CREATE ROLE`](https://www.postgresql.org/docs/17/sql-createrole.html) と [Role Membership](https://www.postgresql.org/docs/17/role-membership.html) — NOLOGINとSET membership。
- [Supabase: Postgres Roles](https://supabase.com/docs/guides/database/postgres/roles) — 標準role、service_role、supabase_auth_adminの役割。
- [Supabase: Permissions](https://supabase.com/docs/guides/platform/permissions) — Auth schema entitiesのsupabase_auth_admin ownership前提。
- [Supabase: Securing your API](https://supabase.com/docs/guides/api/securing-your-api) と [Using Custom Schemas](https://supabase.com/docs/guides/api/using-custom-schemas) — grants/RLS/API schema exposure境界。
- [Supabase: Cost Control](https://supabase.com/docs/guides/platform/cost-control) — Free planのcost control。課金操作は実施していない。

## 停止地点

公式仕様調査、実Staging read-only metadata review、local report、回帰検証までで停止する。role作成、ACL/owner変更、migration適用、fixture、Production変更、deploy、Google/OAuth/YouTube通信へ進まない。
