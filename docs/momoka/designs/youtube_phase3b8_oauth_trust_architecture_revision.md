# YouTube OAuth Trust Architecture Revision — Phase 3-B8

**対象:** FieldRise YouTube Creator Studio
**判定:** `OAUTH TRUST ARCHITECTURE READY WITH STAGING REQUIRED`
**基準:** Phase 3-B7E GitHub `main` — `c0aaa235346c22de72cc7eff2ba6198fa453c897`
**状態:** local source、Node mock/contract tests、設計記録のみ。Staging/Production DB、Function、Auth、Secret、Google Cloud、OAuth、YouTube APIを操作していない。

## 結論

採用案は **A: Start-time strong-auth + short-lived one-time callback capability**。OAuth Start時に署名・期限確認済みJWTのAAL2と対象ユーザーを確認し、さらにAuthサーバーの`getUser(jwt)`で現在のユーザーが有効で、JWT subjectと一致することを確認する。続いて最大5分のOAuth transactionを作り、32 bytesの暗号学的乱数から作ったstateのSHA-256だけをDBに保存する。CallbackはAuth JWTを持たない前提で、期限内stateをDB上で一回だけconsumeした後にGoogle code exchangeを行う。

transactionには`user_id`、`session_id`、JWT、email、raw state、authorization code、access/refresh tokenを保存しない。現在のsingle-user allowlistモデルでは、Start時にsubjectを完全一致で許可し、Authサーバーに現在のuserを確認する。CallbackにAuth JWTが存在しないのでDBにuser/session IDを残してもcallbackで再検証できず、実効的なbindingを作らない。代わりに、短命・高entropy・DB one-time consumeのstate capabilityを発行する。

**重要な信頼上の制約:** OAuth Start後にSupabase sessionがlogout/revokeされても、発行済みGoogle認可は残り5分以内に完了できる。これは意図したstart-authorized ceremonyであり、callback-time AAL2やcallback-time session有効性の確認とは扱わない。Supabase資料も`getClaims()`だけではlogout済みsessionを識別できず、`getUser()`によるAuthサーバー確認が必要と説明している。一方、既発行access JWTはsession revoke後も`exp`まで有効になり得る。従ってStartで`getUser()`を実行しても後続logoutによる取消しは保証しない ([Supabase session guidance](https://supabase.com/docs/guides/auth/sessions), [Supabase `getUser`](https://supabase.com/docs/reference/javascript/auth-getuser), [Supabase sign out](https://supabase.com/docs/reference/javascript/auth-signout))。

彩花CTOが「Start後のlogout/revokeでGoogle認可を必ず取り消せる」ことを求める場合、この判断は不適合であり、Candidate Cを再設計・再審査する。現在の案では5分間の残存権限を明示的に受容する必要がある。Staging実DBでatomicity、実ACL、実owner、競合、期限境界を検証するまでは実DB適用・Deploy可能とは判定しない。

## Candidate比較

| Candidate | 信頼の仕組み | 判断 | 主な理由 |
|---|---|---|---|
| A. Start-time AAL2 + short one-time state capability | StartでJWT claimsと現在のAuth userを検証し、state hashを5分保存。Callbackはatomic consume後に処理 | **採用案** | CallbackのSupabase JWT依存なし。Auth管理schemaへの依存なし。state一回性はDB条件付き更新で実装可能。logout後の最大5分窓を明示的に受容する。 |
| B. Signed server capability | DB stateに加え、別署名capability、鍵保管・rotationを導入 | 不採用 | DBのone-time consumeが依然必要であり、もう一つの署名secretがreplayやcallback logoutの性質を改善しない。鍵の管理・漏えい・rotation面を増やす。 |
| C. Callback後に明示的再認証してFinalize | Google callback後にユーザーを再度認証し、保留credentialをFinalize | 条件付き代替 | logout後の切替を減らせるが、callbackと再認証をつなぐ保留credential、追加endpoint/UX、期限・並行処理が必要。Google credentialを一時保存する案は本Phaseで採らず、完全なAuth/DB同時原子性も自動的には得られない。logoutによる取消しが必須なら次設計で具体化する。 |
| D. CallbackでSupabase `getUser()` | CallbackでJWTを持たずにAuthへsession照会 | 不採用 | Google redirect callbackにはSupabase bearer JWTが届かない前提。別API呼出しをDB consumeと原子的に結合できず、session確認後の競合窓が残る。 |
| E. Auth session table/helperを再導入 | DBからmanaged `auth.sessions`を参照しcallbackで確認 | 不採用 | managed Auth object/ACL/ownerに依存し、最小権限の成立がB7で未実証。Auth状態とapplication transactionのatomic commitも保証しない。`supabase_auth_admin` membership/owner変更または広域権限を前提にしない。 |

## Trust boundaryと脅威モデル

### OAuth Start gate

1. Exact allowed OriginとPOSTを要求する。
2. Bearer JWTを`getClaims(jwt)`で署名・`exp`確認する。
3. `getUser(jwt)`をAuth serverへ送り、現在のuserが存在し、`user.id === claims.sub`であることを確認する。失敗・不明・timeoutはfail closed。
4. `role=authenticated`、`is_anonymous !== true`、`aal=aal2`、`sub`がserver-side single-user allowlistと完全一致、`session_id`がUUID、JWT `exp`が有効であることを確認する。
5. stateは`crypto.getRandomValues`の32 bytesからbase64url 43文字で生成し、SHA-256 hashのみをreserveする。raw stateはauthorization URLへ一度だけ渡す。
6. OAuth transaction TTLは固定最大300秒。JWTの`exp`残時間から30秒のclock-skew余裕を差し引いた値との小さい方を使う。残り60秒未満なら開始を拒否する。JWT expiry設定自体は変更しない。

`getUser()`はStart時の現在性確認であり、後から起きたlogoutをcallbackに伝えるものではない。Supabase資料は一般的なJWT expiryの既定が1時間であることを説明しているが、この設計はJWT設定を短縮せず、別個のOAuth transactionを最大5分に制限する ([Supabase sessions](https://supabase.com/docs/guides/auth/sessions))。

### Callback capability、CSRF、replay

OAuth `state`はCSRF correlation valueであり、OAuth Security BCPはuser agentに結び付いたone-time random値を推奨する ([RFC 6749 §10.12](https://www.rfc-editor.org/rfc/rfc6749#section-10.12), [RFC 9700 §4.7](https://www.rfc-editor.org/rfc/rfc9700#section-4.7))。この実装は256-bit entropy、server-side hash、5分expiry、一回consumeを採用するが、stateをSupabase browser session cookieやcallback時userへ結び付けない。CallbackはSupabase JWTを受信しない設計のため、stateそのものが短命capabilityとして機能する。DBにraw stateを保存しないことだけで漏えいリスクが消えるとは扱わない。

Callbackはquery重複/欠落/形式異常を拒否し、state hashを作り、Postgresで`expires_at > clock_timestamp()`かつ`consumed_at IS NULL`かつ`finished_at IS NULL`の条件付きUPDATEを1回行う。成功行のtransaction IDだけを受け取り、その後に初めてGoogle code exchangeへ進む。同じstateへの並行callbackはDB更新の勝者一件だけが先へ進む。期限切れ、replay、finished、unknown stateは拒否する。

Consume RPCのtimeout/結果不明時は、更新がcommit済みかもしれないため再試行しない。Google code exchangeもtoken cutoverも行わず、safe errorを返し、新しいStartを要求する。Google authorization code自体も短命・一回性の値として扱い、保存や再使用をしない ([RFC 6749 §4.1.2](https://www.rfc-editor.org/rfc/rfc6749#section-4.1.2))。

Stateとcodeを含むcallback URLがplatform/access logやbrowser historyに残る可能性は、アプリケーションのlog抑止だけでは解決したと見なせない。今回のlocal試験は実Google callbackを発生させず、hosted log redactionを検証していない。callback URL queryのplatform logging/redaction確認はDeploy前blockerとして残す。state盗難だけでは対応するGoogle codeなしにtoken exchangeはできないが、stateとcodeの組が漏れれば許可channelの切替を先取りし、処理妨害や意図しない切替を起こし得る。responseにcredentialを返さず、固定client/redirect/scope/channelを維持する。

### Google response validationとtoken cutover

- Client ID、redirect URI、scopeはserver-side固定。browser指定値を採用しない。
- 必須scopeは`youtube.upload`と`youtube.readonly`。返却scopeをparseし、両方が明示されない場合は拒否する。追加scopeは採用しない設計を維持し、想定外scopeの許容を別途レビューする。
- Token responseにnon-empty refresh tokenが必要。null、empty、whitespace-onlyは既存tokenを上書きしない。
- `channels.list(mine=true)`相当の結果は正確に一件で、IDがserver-configured allowed channelと一致した場合だけ合格。0件、複数件、ID欠落、不一致、API errorは拒否。browserからchannel IDを受け取らない。
- CredentialはFunction内memoryに限り保持し、DB一時保管、log、HTTP response、Git/report/chatへ出さない。authorization codeもmemory内で一度交換し、結果不明は再試行しない。
- state consume後、scope/channel/refresh token validation後にだけtoken cutover RPCを呼ぶ。token row upsertとtransaction `finished/token_stored`更新は一つのDB function transactionに含める。どちらかが失敗すればstatement transaction rollbackにより両方rollbackし、旧tokenを維持する。`OLD_DUMMY_PRESERVED`/`NEW_DUMMY_COMMITTED`は後続Staging test labelsであり、実credential値を報告しない。
- Google denialは有効stateをterminal consumeし、token exchangeなしで終了。provider/exchange/validation failureもstateを戻さずterminal扱いとする。

Google OAuthは要求scopeと実際に付与されたscopeが異なる場合があるため、要求したscopeから付与を推測しない ([Google Web Server OAuth](https://developers.google.com/identity/protocols/oauth2/web-server))。YouTube `channels.list`の`mine=true`は認証userが所有するchannelを返し、単一channelとは限らない ([YouTube `channels.list`](https://developers.google.com/youtube/v3/docs/channels/list))。

### Database privilege model — proposed, not live verified

- Dedicated `youtube_oauth_private.transactions` table。RLS enabled。最小metadataはtransaction UUID、state SHA-256、created/expiry/consumed/finished timestamp、fixed safe result code。
- No `auth.sessions` reference, auth schema object, Auth owner/ACL change, `supabase_auth_admin` role membership, `ALTER ROLE`, or `SECURITY DEFINER` helper.
- Table and schema access for browser roles is revoked. RPC functions are `SECURITY INVOKER`, `SET search_path = ''`, and use fully-qualified object references. RPC EXECUTE is restricted to backend `service_role`; browser receives no service key.
- Existing `youtube_oauth_tokens` permissions and owner are not widened or changed by this local design. Actual Staging grants, function owners, owner capabilities, RLS/policies, PostgREST schema exposure, and RPC discovery/execution still require read-only catalog verification after a separately approved migration.
- Static SQL tests do not prove deployed PostgreSQL behavior, actual ACL, PostgREST exposure, concurrency, database clock boundaries, or transaction rollback. This document makes no live DB verification claim.

## TTL選択

OAuth transactionは人間がGoogle consentを完了しcallbackする時間を要するため、極端に短いTTLは通常操作を失敗させる。RFC 6749 authorization code guidanceはcode expiryを短くし10分以下を推奨するが、これはOAuth transaction TTLの直接規定ではない。今回の5分は次の運用上限として選び、Stagingで操作性を確認する。

| TTL | 評価 |
|---|---|
| 2分 | logout/replay窓を小さくするが、MFA済み管理者がGoogle consentを終える時間として余裕が小さい。 |
| 3分 | 窓と操作余裕の中間案。ただし時間切れ後の再開率を実測していない。 |
| **5分** | 本案。一般的な短い管理操作に余裕を持たせながら10分案より露出を制限。さらにJWT残時間からclock-skew分を除いて短縮する。 |

5分は測定済みの最適値ではなく、Staging運用試験で再評価する仮定である。OAuth transactionの最大TTLを5分に固定し、旧10分設定を削除する。JWT expiryの設定やSupabase Auth policyは変更しない。

## Local validation evidence

- Git baselineはB7E正式`main` SHA `c0aaa235346c22de72cc7eff2ba6198fa453c897`。local HEADと`origin/main`が一致して作業開始し、対象差分だけを作成。
- Targeted OAuth contract/hardening/repository tests: **36 passed, 0 failed**.
- Full YouTube + Creator Studio command `node --test tests/youtube/*.mjs tests/test_youtube_creator_studio.cjs`: **66 passed, 0 failed** (B7E baseline: 64 passed).
- Tests use mocks/injected providers and synthetic identities/credentials only. They do not call Supabase, Google OAuth, YouTube API, or live DB.
- DB contract checks inspect SQL source. No PostgreSQL/Staging test was performed; atomic consume and token-cutover semantics remain **source-level design plus mock evidence**, not production-grade runtime verification.
- `DENO VALIDATION NOT AVAILABLE` — Deno CLI is unavailable; no global install was attempted.
- Billing settings were not opened or changed in B8; no paid resources or live calls were initiated. Free-plan status is **not re-certified in this local-only phase**. The design adds no paid product/resource by itself, but live free-tier quota/cost state requires read-only confirmation before Staging work.

## Required Staging gates before any execution

This design does not authorize Staging migration or test execution. A separately authorized Stage must, before writes:

1. Verify current Free plan, zero add-ons/compute/billing exposure and project identity; stop if pricing is unclear.
2. Confirm Staging only, baseline/migration source hash, empty B7B rollback state, no fixture, no OAuth/Auth user/session assumptions, and no partial object.
3. Review SQL on the exact source and inspect actual owners, role memberships, RLS, policies, ACL, function attributes, search paths, PostgREST exposure and PUBLIC/anon/authenticated denials.
4. Apply once only after explicit Stage authorization; if failure occurs, stop and inspect partial state, with no ad-hoc grants/owner/role edits.
5. Use synthetic Staging-only fixture. Exercise valid/rejected Start, wrong/missing/revoked session at Start, state expiry/replay, parallel consume, session-revoke race policy, clock boundaries, callback denial, wrong scopes/channel, and atomic token cutover/rollback using dummy credentials only.
6. Prove whether five-minute start-authorized completion after logout is accepted by trust policy. If not, stop with `ALTERNATIVE ARCHITECTURE REQUIRED`; do not silently call callback-time session validation verified.
7. Confirm actual billing state remains free and no charge was incurred. Do not use real Google authorization or YouTube API traffic in this phase.

## Open blockers and next decision

| Area | Status |
|---|---|
| Start verifies AAL2, allowlisted subject and currently resolvable Auth user | Implemented locally; mock tested; runtime Staging verification required |
| Logout after OAuth Start cancels existing authorization | **Not supported.** Up to five-minute capability remains valid. CTO trust-policy acceptance required. |
| Callback-time AAL2/session check | Not performed or claimed. Callback has no Supabase JWT. |
| PostgreSQL atomic consume and parallel callback | Source/handler mock only; real DB race test outstanding |
| Session revoke versus callback race | No DB/Auth atomic boundary exists in this model. The short start-authorized window is the chosen trade-off; if unacceptable, Candidate C/redesign required. |
| Actual function owner/ACL/RLS/PostgREST boundary | Not live verified |
| OAuth callback URL query redaction in hosted logs | Unverified; blocks Deploy/real OAuth |
| Scope grants, Google client redirect URI, Google channel configuration | Not live checked or changed; block real OAuth |
| Free plan and current bill | Not re-certified in B8; read-only billing gate required before any Staging execution |
| Production | No writes/deploy/OAuth. Separate future approval and all B8 gates remain. |

**No production readiness claim.** No Production migration, Function deploy, Secret setting, scope/consent change, reauthorization, real OAuth, real `channels.list`, upload, or posting control activation is approved by this design.

## Change inventory

Local changes intended for one B8 commit:

- `supabase/migrations/20260927084829_youtube_oauth_transactions.sql`
- `supabase/functions/_shared/youtube-oauth.mjs`
- `supabase/functions/youtube-oauth-start/index.ts`
- `tests/youtube/test_oauth_db_contract.mjs`
- `tests/youtube/test_oauth_hardening.mjs`
- `tests/youtube/test_oauth_repository.mjs`
- `docs/momoka/designs/youtube_phase3b8_oauth_trust_architecture_revision.md`

The migration is a local candidate only. Do not apply it without a later explicit Staging execution instruction and all cost, identity and source gates.
