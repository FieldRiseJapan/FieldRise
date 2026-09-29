# Phase 3-B9A: YouTube Token Store Dependency Design

**判定:** `TOKEN STORE DESIGN READY WITH BLOCKERS`
**調査日:** 2026-09-29
**対象:** FieldRise YouTube Creator Studio / repository history、Production catalog metadata、B8 migration/runtime source
**制限:** 設計調査のみ。DB write、DDL/DML、fixture、migration作成、ACL/role変更、Deploy、Google/OAuth/YouTube通信は実施していない。

## 要約とB9 blocker

B9ではStagingに`public.youtube_oauth_tokens`がなく、B8 token cutover RPCの実DB試験に進めなかった。B9 migrationは適用されておらず、この不足を補う正式なCREATE TABLE migrationもrepository履歴から見つからない。

推奨は、共有YouTube token storeを供給する**独立bootstrap migration**を新設し、B8 transaction migrationより前に適用すること。新規Stagingでは空のtableを作る。既存環境ではcatalog contractを厳密に検証し、合わなければfail closedとする。既存token行を読む、置き換える、NULL化する、再発行する処理は含めない。

設計はB9BでStaging-only migrationを実装するところまで具体化できた。一方、B8とtable accessが依存する標準`service_role`のRLS bypass、およびProduction現行ACLの過剰権限は安全設計上のblockerとして残す。今回これらを変更・回避していない。

## Baselineと調査範囲

- B9正式baseline / 開始時GitHub `main`: `ec231028831a289d202100c8c62acf7cd5e93681`。
- 開始時点で`main`は指定B9 SHAと一致し、その後のOAuth/Auth/Gateway/migration関連変更もなかった。
- 作業treeは上記baselineから開始し、cleanだった。
- `git rev-list --all`でローカルに到達可能な692 commitを確認し、全履歴のstring-change/path search、現在のtracked SQL、migration、docs、reports、runtimeを対象に調査した。
- Token/row値、JWT、Secret、email、user UUID、session IDはProduction・Stagingのどちらからも取得していない。

## Repository作成元の分類

**分類: C — Repository上に作成元なし。**

| 根拠 | 調査結果 |
|---|---|
| 全履歴の`youtube_oauth_tokens`検索 | B8 migration/runtimeの参照、既存バックエンド監査、B9 blocker report等は存在。`CREATE TABLE youtube_oauth_tokens`を含む正式migrationやSQLは見つからない。 |
| 初期既存バックエンド監査 `9f1c4e7923a3b0bd7e357109c5a8d129a3ffc4ca`, `docs/momoka/reports/youtube_existing_backend_audit.md` | Productionに既存tableがあるとの2026-09-25/26のcatalog記録。tableの作成sourceやmigration名は記録されていない。 |
| 監査再確認 `b2d1f7558d5df4339f377737e9fa184c2ec2c8d4`, 同report | 稼働版Functionとcatalogの再確認。作成元を示すDDL/作業記録はない。 |
| B8初期依存 `75bf913a2d4982fe284b20c995cf21b62de4c575`, `supabase/migrations/20260927084829_youtube_oauth_transactions.sql` | `public.youtube_oauth_tokens`を作らず、cutover時に`id=1`へupsertする。 |
| B8正式設計 `14f4c8c11ecb0f3778ba43b622709130c925ae3e`, 同migration | 現行B8版もtoken storeを作らず、既存tableへ依存する。 |
| B9正式report `ec231028831a289d202100c8c62acf7cd5e93681`, `docs/momoka/reports/youtube_phase3b9_oauth_trust_staging_verification.md` | Stagingにtableがなかった事実を記録。B8 applyなし。 |

過去の手動SQL・作業記録で作成を示す根拠もrepositoryには見つからなかった。現時点でauthoritative creation sourceは存在しない。

## Productionの既知metadata

Production project identityをread-onlyで照合後、catalogだけを読み取った。Productionのtable row、`refresh_token`値、行数は読んでいない。**2026-09-29時点のmetadata**:

| 属性 | 観測値 |
|---|---|
| relation | `public.youtube_oauth_tokens` |
| owner | `postgres` |
| columns | `id bigint NOT NULL`; `refresh_token text NOT NULL`; `updated_at timestamptz NOT NULL DEFAULT now()` |
| constraint/index | `PRIMARY KEY (id)`、unique btree index on `id` |
| RLS | enabled; `FORCE ROW LEVEL SECURITY` disabled |
| policies | 0 |
| ACL grantees | `postgres`, `service_role`。`PUBLIC`, `anon`, `authenticated`へのtable grantはcatalog結果にない。 |
| `service_role` table ACL | `SELECT`, `INSERT`, `UPDATE`に加え、不要な`DELETE`, `TRUNCATE`, `REFERENCES`, `TRIGGER`も付与済み。grant optionなし。 |

このmetadataは既存Production schemaの観測であり、repository内のcreation sourceではない。Production ACLは必要最小限ではない。B9A中にACLを変更せず、Staging最小ACLの設計とProductionの現行状態を混同しない。

## B8とruntimeの依存

### B8 migration

正式対象は`supabase/migrations/20260927084829_youtube_oauth_transactions.sql`。

- `public.youtube_oauth_cutover_token(uuid, text)`は`SECURITY INVOKER`、空の`search_path`、完全修飾object参照。
- tokenがNULL、空白のみ、8192文字超、control characterを含む場合は拒否。
- 未完了・未失効のconsumed transactionをfinishし、その後`public.youtube_oauth_tokens(id, refresh_token, updated_at)`へ`id=1`でinsert/upsertする。
- `ON CONFLICT (id)`が有効であるため`id`はPKまたはuniqueでなければならない。`updated_at`は呼び出し側が値を明示するためdefaultなしでもB8単体は動く。
- token writeとtransaction finishは同じPostgreSQL function transaction内にある。upsert失敗時にfinishもrollbackされる。
- functionはinvoker権限なので、呼び出しroleにtransaction tableおよびtoken tableの必要なDML権限が要る。migrationはtoken table ACLを設定していない。
- RPC executeはbrowser roleからrevokeし`service_role`だけに許可する。

### Runtime

- `supabase/functions/youtube-oauth-callback/index.ts`はserver-side `service_role` clientでconsume/cutover/finish RPCを呼ぶ。
- `supabase/functions/_shared/youtube-oauth.mjs`のrepositoryはrefresh tokenをcallback cutover RPCへ渡し、値自体を応答として返さない。
- 既存`supabase/functions/youtube-upload/index.ts`はserver-side `service_role` clientで`youtube_oauth_tokens`の`id=1`から`refresh_token`だけを読み、Google token endpointへ送る。ブラウザには返さない。
- 新設tableはPhase 3 OAuth architectureだけでなく既存YouTube upload runtimeと共有される。legacy upload codeは今回変更しない。

## Minimum schema/security contract

| 要件 | 判定と設計 |
|---|---|
| table / schema | `public.youtube_oauth_tokens`。B8とlegacy runtimeの固定参照先。 |
| `id` | `bigint NOT NULL`, PK/unique。既存runtimeは固定値`1`を使う。 |
| `refresh_token` | `text NOT NULL`。tokenはSecretとして取り扱う。DB constraintだけでなくB8 validationも維持。 |
| `updated_at` | `timestamptz NOT NULL`; `DEFAULT now()`を新規tableに設定し、既存Production contractと一致させる。B8は`clock_timestamp()`を明示する。 |
| row model | application-level singleton slot `id=1`。PKにより`id=1`は高々1行。DBは他のidを禁止していない。row数は今回確認していない。 |
| RLS | 新規tableは有効。policyなし。browser rolesはtable ACLで拒否。 |
| table owner | Supabase migration executorが`postgres`の環境では`postgres`をownerとする。所有権移譲なし。post-apply catalogで確認し、不一致は停止。 |
| table ACL | `PUBLIC`/`anon`/`authenticated`に付与なし。`service_role`へtable単位で`SELECT`, `INSERT`, `UPDATE`のみ。新設時に不要なDELETE/TRUNCATE等は与えない。 |
| PostgREST | relationは`public` schema内なのでAPI schema discoveryに現れる可能性がある。browser rolesにtable privilegeを与えず、direct SELECT/INSERT/UPDATEは拒否。private helper/RPCとして公開しない。 |
| service-side | callbackの許可済みRPCと既存server-side upload functionのみ。service keyをbrowserへ渡さない。token値をAPI response/log/Git/reportへ出さない。 |

**RLS bypass blocker:** Productionのservice-role client経路は、現行のRLS有効・policyなしtableにアクセスしている。B8 transaction tableもRLS有効でservice_role grantsのみの定義である。既知のSupabase `service_role`はRLS bypass属性を持つmanaged roleであり、この既存方式は標準service_roleの挙動に依存する。B9Aはcustom BYPASSRLS roleを新設しないが、B8/runtimeを含む全体について「BYPASSRLS依存なし」とは立証できない。これを禁止条件として厳密に解釈する場合、B9B前に安全な実行境界の再設計が必要。

## Ownership classification

**C — Shared YouTube infrastructure**を推奨する。

証拠: legacy upload functionとPhase 3 callbackが同じ`public.youtube_oauth_tokens`、`id=1`を利用する。tableはB8より前からProductionに存在する一方、repositoryに作成元migrationはない。legacy-onlyまたはPhase 3-only migration所有にすると一方のruntimeがclean environmentで欠落する。独立bootstrap migrationを共有基盤の契約として管理する。

## Migration strategy比較

| Option | Security / owner / ACL | Production compatibility / rollback | Staging・ordering / runtime | 評価 |
|---|---|---|---|---|
| **A. 既存authoritative migrationを再利用** | Repository上に該当migrationなし。sourceを指せない。 | 既存schemaのauthoritative contract不明のまま。 | clean Stagingを再現できない。 | 採用不可。 |
| **B. 独立token-store bootstrap migration** | migration executorがtableを所有。browser grantsなし、service_roleに必要なDMLのみ。Auth owner/ACLに触れない。 | 既存relationは厳格に検査。不一致なら失敗し、既存rowを変更しない。ACLを最小化する変更は別の明示レビューを要する。rollbackはdata-preserving。 | bootstrapをB8より前に並べ、legacyとPhase 3の共有契約にする。 | **推奨。** |
| **C. B8 migrationへtable作成を統合** | B8がtransaction trustと長期token store/legacy contractを同時所有する。差分と権限が混在。 | B8既適用環境でmigration rewriteは不可。Production schemaと再適用の危険が増える。 | clean Stagingには動くが、migration orderingとrollbackが一体化。legacy runtimeの基盤所有者として不明瞭。 | 非推奨。 |
| **D. token store architectureを置換** | private schema/vault等の再設計でpublic API面を縮小できる可能性。ただし新role/owner/RPCと運用境界の再レビューが必要。 | Production token移行、rollback、legacy互換性が増大。 | legacy uploadとB8を同時に変更・試験する必要。 | 別設計フェーズ。 |

## RECOMMENDED DESIGN

**Option B: 独立したshared YouTube token-store bootstrap migration**をB9B候補とする。

1. MigrationはB8 `20260927084829_youtube_oauth_transactions.sql`より先に適用されるversion順に置く。clean Stagingのmigration historyが空であることをB9B開始時に確認する。既にB8 versionが記録済み、またはmigration順が判断できない環境ではmigration historyを修正せず停止する。
2. 新規tableでは上記minimum contractを作成し、RLSを有効化する。既存tableにはblindな`IF NOT EXISTS`を成功根拠にしない。columns/types/nullability/default、PK、owner、RLS、ACLをcatalogで検査し、違えばfail closedする。
3. `id=1`のtoken rowへINSERT/UPDATEする処理はbootstrapに含めない。既存tableのrowは選択・copy・resetしない。新規Staging tableはemptyのままB8 migrationへ進む。
4. browser rolesへの権限を与えず、tableの`service_role` ACLは必要な`SELECT`, `INSERT`, `UPDATE`に限定する。service_roleのtable accessは既存の承認済みserver-side key保管経路に限定し、custom role、role membership、BYPASSRLS付与、`ALTER ROLE`は行わない。
5. `youtube_oauth_private` schemaはAPI公開対象にせず、token tableはlegacy/B8互換性のため`public`に保つ。PostgRESTではbrowser roleからrelationのread/writeを実行できないことを別フェーズで実DB検証する。
6. migration成功後にB8 transaction migration、その後に必要なruntime releaseという順序を維持する。B9Bではfixtureとdummy tokenに限定し、Production・実Google通信へ進まない。

### Production compatibility / token preservation

Productionは既にcontractに合うcolumns/PK/RLS/ownerを持つことを今回catalogで確認した。将来別途承認されたProduction migrationでは、その時点でcatalogを再確認する。対象schema不一致時はfail closed。`IF NOT EXISTS`だけで不一致を隠さない。schema migrationはtoken rowをSELECT/INSERT/UPDATE/DELETE/TRUNCATEしない。既存tokenの保持、再認可なし、Secret不読を必須条件とする。

現行Productionの`service_role` ACLにはtoken pathに不要なDELETE/TRUNCATE等が残る。B9Aでは変更していない。将来これを絞る場合、legacy/runtime依存確認と明示された別承認を要し、migrationの暗黙の副作用にしない。

### Rollback

- Migration transaction失敗時はDBがatomic rollbackする。
- 適用後、OAuth runtimeを使わずtoken rowが空のStagingでは、B8 apply前に停止してempty tableを残す。通常rollbackではtoken tableをDROPしない。
- token cutover済みならtable dropやrow resetでrollbackしない。旧row保持を前提に、別のレビュー済み手順なしでtoken値に触れない。
- Production table/rowには本フェーズから変更を加えない。

## Billing / free operation / Auth boundary

- B9の記録とCTO提示によるFree Plan、Spend cap、invoice `$0.00`、NANO、paid add-on/IPv4/PITR/custom domain無効の確認を引き継ぐ。B9Aでbilling設定変更なし。追加費用を要する機能やcomputeを設計に含めない。
- Catalog調査は既存Productionを対象とするread-only metadata queryのみ。Staging/Production DB write、migration、fixture、ACL/owner/role変更なし。
- token tableとB8 runtime sourceに`auth.sessions`参照なし。`supabase_auth_admin` ownership、membership、Auth ACL/schema/object変更なし。
- custom BYPASSRLS roleを設けない。標準service_roleの既存RLS-bypass挙動を利用する点は上記blockerとして残る。
- Google OAuth、token exchange、`channels.list`、YouTube API、再認可、実upload、Deployなし。

## B9再開条件と残blocker

1. 彩花CTOがOption B、shared ownership、public-table API boundary、Production token保持方針を確認する。
2. 「BYPASSRLS依存なし」が標準Supabase `service_role`にも適用される要件か確認し、該当する場合はB8を含めた安全な実行role設計を再設計する。Auth managed object変更やowner escalationで迂回しない。
3. B9B開始時にGit baseline、Billing、Staging identity、migration history/object absenceを再確認する。
4. Bootstrap migrationをmigration順序に従って実装し、CREATE IF NOT EXISTSだけに依存しないcatalog contract guardを含める。今回そのmigrationは作成していない。
5. Staging実DBでPostgREST/API ACL、table owner/RLS、B8 RPC、legacy server-side SELECT、atomic cutover/rollbackを別フェーズで検証する。
6. Production migration/applyは今回も後続の別承認対象。Production metadataの再確認はその段階でread-onlyに行う。

**残るblocker:** (a) 標準service_role RLS-bypass dependencyを許容するか未確定、(b) Productionにはservice_roleの不要なDELETE/TRUNCATE等の現行grantがあるが変更承認なし、(c) bootstrap migrationは未実装・Staging未検証、(d) PostgREST実境界とcutover実DB試験は未実証。

## 変更・検証

- 本B9Aで許可された変更: design document 1 fileのみ。
- Staging DB write: なし。Production DB write: なし。
- Production read: project identity + catalog metadataのみ。table row/value/row countは未取得。
- Billing変更: なし。Deploy/外部通信: なし。
- Deno/runtime/Node testsは文書のみの変更のため実行対象外。登録前に`git diff --check`、Secret/credential/UUID/email scan、変更file一覧を確認する。
