# Phase 3-B9 OAuth Trust Staging Verification

**Final status:** `DESIGN REVISION REQUIRED`
**担当:** GPT桃花
**対象:** FieldRise YouTube Creator Studio / Staging only
**作業日:** 2026-09-29
**NEW B9 baseline:** `160fe5b632c3b3e4b8d16d053b4172cdfbd258c1`

## 判定

Baseline再検証、Billing Gate、Project Identity、B8 migrationのstatic forbidden-pattern auditは通過した。Staging preflightで、B8 migrationのtoken cutover関数が依存する既存relation `public.youtube_oauth_tokens` が存在しないことを確認した。したがって、このStaging状態ではB8 migrationの実DB cutover/rollback試験を完遂できない。B8 migrationは適用せず、partial object、fixture、token値も作成していない。

この不足をB9中に場当たり的なDDLや権限変更で補わない。token tableの所有元・migration履歴・必要な本番互換性を明示する設計を次工程で決めるまで、実DB migrationは停止する。

## Baseline revalidation

- B8正式SHA `14f4c8c11ecb0f3778ba43b622709130c925ae3e` はcurrent `main`のancestor。比較結果は`ahead`、6 commits、merge baseがB8 SHA。
- B8後続6 commitsの変更はAI秘書の定時briefing、LINE送信記録、YouTube analytics、weather、AI newsのデータ／レポートのみ。OAuth/Auth/Gateway/migration/testの関連変更は差分ファイル一覧にない。
- B8の7ファイルはB8正式版とcurrent `main`のblob SHAが全件一致（7/7 SOURCE MATCH）。
- current `main`は作業開始時と確認終了時で`160fe5b632c3b3e4b8d16d053b4172cdfbd258c1`。検証中に移動しなかった。
- current `main`をNEW B9 baselineとして採用した。local source comparisonはB8 7ファイルの各blobで一致。

## Billing Gate

和彩花CTO・社長本人によるDashboardのREAD-ONLY確認結果を、今回の指示で追加証拠として受領した。Billing/Spend cap/Add-on/Compute設定変更はしていない。

- Subscription: Free Plan。MCPのorganization metadataも`free` / `tier_free`。
- Spend cap: enabled。Free included quota超過時は追加請求ではなく、projectがread-only/unresponsiveとなり得るというDashboard表示。
- Past invoices: `$0.00`, `PAID`。確認時点に追加請求表示なし。
- Staging compute: NANO / `t3.nano`。Compute scalingの変更なし。
- Dedicated IPv4、PITR、Custom domain: disabled。
- Migration/API作業のためのUpgrade、paid add-on、compute変更、Spend cap解除、支払方法変更は行っていない。
- B9中にSupabase側の請求設定を変更していない。終了確認は変更なし。

この項目はDashboardを確認した社長・CTOのread-only報告に基づく。GPT桃花はbilling設定画面を操作していない。

## Project identity and separation

- `FieldRise Staging`
- project ref `zjgmgwjeebphkbbqjbfi`
- region `ap-northeast-1`
- write直前確認時 status `ACTIVE_HEALTHY`
- Production ref `nmkcjtrllzkwjxmjromw`とは別project。Production projectを調査・変更していない。

## Staging preflight

READ-ONLY Supabase metadata確認結果：

- Migration history: empty。
- `youtube_oauth_private` schema: absent。
- public/`youtube_oauth_private`のOAuth関係table/relation: absent。
- `youtube_oauth*` RPC/function（public、private、auth）: absent。
- OAuth transaction table、legacy session helper、B7 partial object: 検出なし。
- Auth user count: 0。Auth session count: 0。
- Existing B9 fixture: なし。今回新規作成なし。
- `to_regclass('public.youtube_oauth_tokens')`: `NULL`。required token tableは存在しない。

Queryはcatalog metadataとaggregate countに限定し、email、UUID、session ID、token、credentialの値は読み取っていない。

## B8 migration static security audit

対象: `supabase/migrations/20260927084829_youtube_oauth_transactions.sql`

Static source scanでは、`auth.sessions` direct reference、`supabase_auth_admin`依存、`OWNER TO`、`SECURITY DEFINER`、BYPASSRLS依存、`ALTER ROLE`、`SET ROLE`、managed Auth ACL変更、auth schema object/GRANT、Production固有値、Secret、destructive `DELETE` / `TRUNCATE` / `DROP`を検出しなかった。migrationが明示するschema/table/function grantsの対象は専用OAuth schemaとserver-side `service_role`のみ。

**適用判断:** 適用なし。migration内のtoken cutover関数は`public.youtube_oauth_tokens`へupsertするが、preflightでそのrelationが存在しないことを確認した。B9のtoken cutover/rollback目標を実証できないため、適用を中止した。migrationのclean apply自体は未試行。

## Live DB verification matrix

| 確認項目 | 結果 |
|---|---|
| Migration apply / history追加 | 未実施。historyはpreflight時empty |
| OAuth schema/table/RPC | 未作成 |
| RLS / policies / ACL / function owner / function security / search_path | migration未適用のため実OAuth objectについてはN/A |
| `auth.sessions` / `supabase_auth_admin` / BYPASSRLS dependency | preflightのOAuth functionなし。B8 sourceにもdependencyなし |
| raw stateなし / DBにはstate hashのみ | B8 source/contract testで確認。実DB transaction未作成 |
| TTL <= 5分 | B8 source/constraint/contract testで確認。実DB transaction未作成 |
| expiry boundary / consume / replay / concurrency | mock/contract testのみ。実DBでは未試験 |
| logout/revoke after Start | 社長承認済みの期待動作。TTL <= 5分で完了可能。callback-time session/AAL2検証とは扱わない |
| ambiguous consume | B8 contract/mockではfail closed、no retry。実DB injectionは未実施 |
| Google denial / scopes / allowed channel | contract testsのみ。実Google通信なし |
| Dummy token cutover / rollback | 実DB fixtureなし。token table欠落により実DB検証不可 |
| `OLD_DUMMY_PRESERVED` / `NEW_DUMMY_COMMITTED` | 実DBでは未確認。値・fixtureは作成していない |
| fixture cleanup | cleanup対象なし |
| PostgREST boundary / Security Advisor | migration未適用のためOAuth objectに対する検証なし。advisor未実施 |

## Local regression and hygiene

- Command: `node --test tests/youtube/*.mjs tests/test_youtube_creator_studio.cjs`
- Result: **66 passed, 0 failed** (B8 baseline 66/66を維持)。Creator Studio testsは既存セット内でpass。
- Deno: `DENO VALIDATION NOT AVAILABLE`。global installなし。
- `git diff --check`: PASS。
- Credential-pattern scan on changed B9 report: PASS; report contains no token, JWT, raw state, user UUID, session ID, email, or secret.
- Changed file: this B9 blocker report only.

## No-write / no-external-action confirmation

- Staging: no migration, DDL/DML, fixture, grant, role/owner change, Auth change, or Secret change.
- Production: no DB read/write, migration, Auth, Secret, RPC, Function, or deployment change.
- Deploy: none.
- Google OAuth / token exchange / `channels.list` / YouTube API / upload / reauthorization: none.
- Billing plan, Spend cap, add-ons, compute, and payment settings: unchanged.

## Required next design decision

Resolve how the Staging baseline should supply the established token relation used by the cutover RPC. Confirm the authoritative schema/migration and owner without copying Production credentials/data. Then revise or revalidate a migration that can atomically finish the OAuth transaction and update the approved token store. Do not add a table, broaden grants, or change owners in this blocked phase. Repeat B9 baseline, billing, identity, preflight, and static gates before any future migration attempt.

**Remaining Staging blocker:** required `public.youtube_oauth_tokens` relation is absent; real database security/functional tests remain outstanding.
**Remaining Production blockers:** all Production migration, deploy, secrets, Google consent/OAuth and upload steps remain out of scope and unverified.
