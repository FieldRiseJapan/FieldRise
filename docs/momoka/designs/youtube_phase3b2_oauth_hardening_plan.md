# YouTube OAuth Hardening Plan — Phase 3-B2

**対象:** FieldRise YouTube Creator Studio
**状態:** 実装前計画。Function、DB、Secret、Auth、OAuth設定、Google Cloud、YouTube API、Deployは変更していない。
**基準:** GitHub `main` のPhase 3-B1 Source-of-Truth Commit `88bfe7b66f94ea242ac85933f6771c81cd2582d6` とPhase 3-B0正式設計書。

## 1. 目的と適用範囲

現在のGoogle OAuth callbackを、開始時のSupabase認証・認可、one-time transaction state、Google scope検証、YouTube channel identity検証を備える構成へ移行する実装計画を定める。この段階では計画のみで、OAuthを実行しない。

Phase 3-B2はOAuth認証情報の安全な取得・保存境界を作る作業であり、YouTube upload処理の有効化ではない。Upload Gateway、upload attempt state machine、旧upload endpointの停止、Google再認可、live DB適用、Function Deployはそれぞれ別の明示承認が必要。

## 2. Source-of-Truthと現状

| 項目 | 基準 |
|---|---|
| 正式GitHub main | `88bfe7b66f94ea242ac85933f6771c81cd2582d6` |
| 正式source | `supabase/functions/youtube-upload/index.ts`、`supabase/functions/youtube-oauth-callback/index.ts` |
| baseline | `youtube-upload` v7、`youtube-oauth-callback` v8。いずれもACTIVE、`verify_jwt=false`として直近のlive監査で確認された情報 |
| local検証source | 2ファイルのGit blob SHAは正式main上の各blobと一致。旧local検証Commitは`9ed89542cb4f31b83305bc28a70ecae478b296fa` |
| Phase 3-B0 | `docs/momoka/designs/youtube_phase3b0_implementation_baseline.md`。GitHub main版とlocal版のblob SHA一致を確認 |

local mainは正式GitHub mainの`88bfe7b66f94ea242ac85933f6771c81cd2582d6`へ同期済みであり、同期時に両者のtree SHAが一致することを確認した。Phase 3-B0設計書と2つのsource fileは正式main上のtracked内容である。

### 既存callbackの問題点

正式保存されたv8 sourceでは、callbackはqueryからauthorization `code`を取り、Google token endpointへ交換し、返されたrefresh tokenをservice-role clientで`youtube_oauth_tokens`へupsertする。state照合、expiry、one-time consume、Supabase user/session/AAL2/allowlist binding、scope確認、allowed channel ID照合がない。Google error statusや固定メッセージは一部sanitizedだが、例外messageをログする経路がある。Source-of-Truthへの保存は安全化を意味しない。

## 3. OAuth trust boundaryと責務

### OAuth Start

新規`youtube-oauth-start` Edge Functionがブラウザー向け開始入口となる。

1. POSTとGitHub Pages Originを確認する。CORS/Originは補助防御であり、認証・認可を置き換えない。
2. Supabase Authの正式JWT検証後、`role=authenticated`、`is_anonymous != true`、`aal=aal2`、`sub`がserver-side単一allowlistと一致することを確認する。
3. 検証済みJWTから`session_id`を読み、`sub`と組み合わせてこのOAuth transactionへbindingする。JWT本体・refresh tokenは保持しない。
4. scope、Google client ID、redirect URI、許可channel IDはserver-side固定値から決定する。browser入力のscope、redirect URI、channel IDは受け付けない。
5. transactionをDBへ作成できたときだけ認可URLを返す。ブラウザーはそのURLへ遷移する。

### Google callback

既存`youtube-oauth-callback`はGoogleからのcallback入口として残し、`verify_jwt=false`を維持する。Google redirectにSupabase Authorization headerやJWTが付くとは仮定しない。callbackのtrustは、Startで検証済みのuser/sessionを一意に結びつけた、期限付きかつ未使用のserver-side transactionから得る。

callbackはstateとtransactionを検証し、session継続を安全に確かめられる場合はそれも確認し、stateをDB側で原子的にconsumeしてからcode exchangeする。検証不成立、期限切れ、再利用、binding不一致、Google側errorの場合、code exchangeもtoken保存も行わない。

## 4. State、expiry、replay防止

- CSPRNGで最低256-bitのrandom stateを毎回生成する。stateをGoogleへのredirectで一度だけ渡す。
- DBには`SHA-256(state)`のみ保存する。平文state、JWT、authorization code、Google tokenは保存しない。
- 初期expiry候補は発行時刻から10分。調整値は実装前に彩花CTOが承認する。
- callback受信後、token endpointへの接続より前にstate hashを検証する。
- 有効・未期限・未消費の条件確認とconsumeは、一つのPostgres transaction内の条件付きUPDATE/RPCで行う。SELECT後の別UPDATEに分けない。
- 競合callbackは一方だけがconsumeできる。再利用、期限切れ、state欠落、hash不一致は固定の一般エラーとし、Google code交換をしない。
- 正しいstateでGoogleがdenied/errorを返した場合もtransactionを終端化し、同じstateで再実行できないようにする。所有者は新しいStartからやり直す。
- OAuth transaction stateはYouTube uploadの`accepted/uploading/succeeded/failed/outcome_unknown`と別schema・別責務にする。

## 5. User binding、session binding、AAL2

### User binding — 採用案

Startで署名検証済みのJWT `sub`をserver-side allowlist UUIDと完全一致比較し、そのuser IDをtransactionに保存する。実UUIDはsource、GitHub、チャット、報告へ書かない。

### Session binding — 公式claimを用いる候補

Supabase公式資料は、各access tokenに一意の`session_id` claimがあり、`auth.sessions`の主キーと対応すると説明する。また、sign-out後には対応するsession rowがなくなるため、rowの有無をsession失効確認に使えるとしている。従って候補は、検証済みJWTの`session_id`と`sub`をStart時に保存し、callback前のserver-side確認で両者のsession rowが存在することを照合する方法である。JWTそのものは保存しない。[Supabase: User sessions](https://supabase.com/docs/guides/auth/sessions) [Supabase: JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields)

`jti`はtoken単位のclaim候補であり、refresh後も安定するsession identifierとしては採用しない。`session_id` claimの署名検証、`auth.sessions`参照権限、Edge Functionからの安全な問い合わせ手段、削除済みsessionの判定はstagingで実証する。DB側のsession checkを安全に構成できない場合、session revocation確認は`UNRESOLVED`のままにし、推測実装や黙示的省略をしない。

### AAL2 — Start時必須、callback時は未解決

Startは正式検証済みJWTの`aal=aal2`を必須とする。これは開始時点での確認である。Google callbackにJWTを期待しないため、callback時点の現在AAL2を再確認する具体策は未確定であり、Phase 3-B0の`UNRESOLVED`判断を維持する。

同じ`session_id`が存在することはsession bindingを示すが、callback時点のAAL claimがaal2のままだと証明するものではない。短いtransaction TTL内のStart時AAL2とsession bindingをcallbackのtrustとして採用するか、別の安全な再証明を要求するかは実装GO前に彩花CTOが決定する。browser callbackでJWTをcallback FunctionにPOSTする構成へ独自変更しない。

## 6. ScopeとGoogle再認可

Google公式YouTube Data API discovery documentでは、`channels.list`が受け付けるscopeは`youtube`、`youtube.readonly`、`youtubepartner`、`youtubepartner-channel-audit`であり、現在の`youtube.upload`は一覧にない。一方、`videos.insert`は`youtube.upload`を受け付ける。`channels.list(mine=true)`は認証済みuserが所有するchannelを返す。[Google API discovery document: YouTube Data API v3](https://code.googlesource.com/google-api-go-client/+/cd5935c8eb7842ca0138a57c4794bd280e455611/youtube/v3/youtube-api.json) [Channels: list](https://developers.google.com/youtube/v3/docs/channels/list) [OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes)

**最小権限候補:** Upload用の`https://www.googleapis.com/auth/youtube.upload`に、ID確認用の読み取りscope`https://www.googleapis.com/auth/youtube.readonly`を追加する。`youtube` scopeはより広い管理権限を持つため第一候補にしない。Google API discoveryが示すmethod scope集合を基準とし、`youtube.upload`のみで`channels.list`が動くとは扱わない。

現在の既存grant/refresh tokenが新scopeを持つと仮定しない。将来のStartは固定のrequested scope集合を提示し、Google token responseのgranted scopeを確認する。必要ならincremental authorizationで追加同意を得る。追加scope同意が成立しない場合はtokenを保存せず失敗とする。scope値がtoken responseに欠け、公式にサポートされた別の確認方法を実装前に確定できない場合も保存しない。[Google: OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)

追加scope、Google Cloud OAuth consent変更、再認可は今回の作業では禁止。Google consent/verification状況と追加同意のUXは別承認事項。

## 7. Allowed channel identity検証

callbackはcode exchange後、Google access tokenをserver-sideだけで使って`channels.list(part=id,mine=true)`を呼ぶ。responseのchannel IDをserver-side設定`YOUTUBE_ALLOWED_CHANNEL_ID`と完全一致比較する。表示名、handle、email、browser入力のchannel IDでは判定しない。許可channel IDは認証credentialではないが、認可の完全性に関わるserver-side configurationとして扱い、ブラウザー/sourceへ置かない。

fail-closed条件：channelが0件、ID欠落、不一致、API error、scope不足、channel選択が曖昧、または複数channelが返る場合はrefresh tokenを保存しない。複数channelのときにupload tokenがどのchannelへ投稿するかを確実に結びつける手段は事前に決める必要がある。初期案は「返却channelが1件だけで、そのIDが許可値と一致」の場合だけ接続を承認する。

## 8. Refresh token保存条件と既存token保護

新しいrefresh tokenを保存できるのは、state valid/unexpired/unused、user/session binding valid、開始時AAL2/allowlist valid、code exchange success、required scopes granted、allowed channel ID exact match、refresh token取得の全てを満たす場合だけ。

- 失敗したflowは既存`youtube_oauth_tokens`の行を更新・削除しない。
- token responseにrefresh tokenがない場合、既存値を空/nullで上書きしない。接続更新は未完了として返す。
- tokenはserver-side memory内で必要最小時間だけ扱い、ブラウザー応答・log・migration・test fixtureには出さない。
- すべての確認後に限り、既存token行をDB transactionで原子的に置換する。DB書込結果が不明なら別tokenの取得や重複更新を自動再試行せず、safe failureとして調査対象にする。
- live schema、現行token行の保存方式/RLS、token保管・暗号化前提、Google refresh grantが付与されたscopeを実装前に再確認する。token値を表示・exportしない。

Refresh tokenのローテーション・切戻しで旧値をどう保護するかは未決定。旧tokenをログやmigration backupへ複製せず、失敗時に旧tokenを保持できる原子的保存方式と復旧手順を実装前に確定する。

## 9. DB forward migrationとRPC案

### Table

新しいprivate schema `youtube_oauth_private`と`transactions` tableをforward migrationで追加する。既存`youtube_gateway_private.attempts`、upload RPC、`youtube_oauth_tokens`のschema/行は変更しない。

候補列は必要最小限：

- `transaction_id uuid primary key`
- `state_hash bytea unique not null`（SHA-256長をCHECK）
- `user_id uuid not null`
- `session_id uuid not null`
- `created_at timestamptz not null`
- `expires_at timestamptz not null`
- `consumed_at timestamptz null`
- `finished_at timestamptz null`
- `result_code text null`（許可enumのみ。provider raw body/message禁止）

Scopeは固定server-side設定のため、初期tableには保存しない。Google code/state raw値、JWT、refresh/access token、email、TOTP、channel ID、provider responseをtableへ追加しない。`result_code`は`google_denied`, `exchange_failed`, `scope_rejected`, `channel_mismatch`, `token_stored`等の固定値に限定する。

### Access control

RLSを有効化し、PUBLIC/anon/authenticatedのschema/table権限およびRPC EXECUTEをREVOKEする。service_roleだけに必要最小限の権限をGRANTする。公開APIからtableを直接参照させず、RPCを通す。SECURITY DEFINERを使うsession-check helperは必要性が証明された場合だけ追加し、`search_path=''`、完全修飾名、service_role限定EXECUTEを適用する。GRANT/REVOKE/RLS/SECURITY INVOKERまたはDEFINERをstagingで実証する。[Supabase: Database Functions](https://supabase.com/docs/guides/database/functions)

### RPC候補

| RPC | 入力・作用 | Atomic rule | 権限 |
|---|---|---|---|
| `youtube_oauth_reserve` | server-side生成state hash、検証済みuser/session bindingを受け取りpending row作成。TTLはDB/server固定上限 | UNIQUE hash、時刻、同時Start/rate limitをtransaction内で検査。失敗ならredirect URLを返さない | service_roleのみ |
| `youtube_oauth_consume_state` | state hashを受け取り、許可されたtransaction bindingをcallbackへ返す | `pending AND expires_at > now() AND consumed_at IS NULL`の条件付きUPDATEでconsumeを一回だけ実行。必要ならsession row存在も同transactionで確認 | service_roleのみ |
| `youtube_oauth_finish` | transaction IDと固定safe result code | `consumed -> completed/failed`のみ。raw errorは拒否 | service_roleのみ |

無効stateの詳細を外部へ漏らさず、callback応答は固定codeにする。service_role以外での実行拒否はmetadata/role testで確認する。Migration前に対象schema/table/RPCとmigration historyを読み取り確認し、既存objectとの競合があれば停止する。migrationはforward-onlyとし、既存行を削除・変換しない。

## 10. Error handlingとlogging

log禁止：JWT、Authorization header、user UUID、session UUID、email、raw state、OAuth code、client secret、service_role、Google access/refresh token、token response、raw Google error body、channel ID、TOTP、refresh token保存値。

記録してよい情報は`request_id`、段階名、固定safe error code、HTTP status、成功/失敗、必要なduration等に限定する。例外message/stackやprovider bodyをloggerへ渡さない。callback URLのqueryに`code`と`state`が含まれるため、Supabase/edge access log、proxy、analytics、error trackerがqueryを保存するか調査し、redactionを実証する。redactionが確認できない場合はproduction deploy gateを通さない。

HTTP responseは固定メッセージまたは`request_id`のみ。provider response、例外詳細、DB row、内部IDを返さない。Google error/timeout、token JSON不正、scope不足、channel mismatch、DB errorは固定のstage/error codeに分類する。

## 11. Test plan

### Unit/contract tests (mock Google/Supabase)

- JWTなし、invalid JWT、role不一致、anonymous、AAL1、allowlist不一致でStart拒否。DB reservationとGoogle redirectが起きない。
- valid AAL2+allowlistでStart成功。state entropy確認、DBへhashだけ保存、TTL境界確認。
- raw state不足/改ざん/hash不一致/期限切れ/再利用/並行callback race。code exchange回数は0または一回のみ。
- user binding不一致、session_id欠落、不明session、失効sessionでcode exchangeなし。
- Google denial/errorでconsume後にcode exchangeなし。
- token exchange HTTP error、invalid JSON、scope不足、required refresh tokenなしでtoken保存なし、既存token変更なし。
- channels.list 0件、複数件、channel mismatch、API failureでtoken保存なし。
- success pathでscope確認とchannel一致完了後にのみserver-side保存が一度行われる。
- log/response canary testでJWT、state、code、provider body、session/user ID、token、Secretの文字列が一切出ない。
- callback URL/query redaction integration testを実環境相当のlog pipelineで実施する。
- DB test: table RLS、column一覧、PUBLIC/anon/authenticated deny、service_role RPC実行、atomic consume race、expired/replay status、migration before/after counts。
- 回帰: upload Gatewayはvalidation_onlyのまま。YouTube実API呼出しなし。TikTok/Instagram、投稿UIに変更なし。

### Stage gates

1. local Deno/unit/static tests; Googleは全てmock。
2. disposable staging DBへのmigrationとrole/RLS/RPC検証。production DBには適用しない。
3. staged Auth session testとStart/callback mock integration。
4. Google scope追加・再認可・channel API試験は別承認後にのみ実施する。
5. private実uploadはこのPhaseの対象外。別途OAuth、upload state machine、legacy upload閉鎖、size/timeout検証などのgateを通し、社長/CTOから個別承認を得る。

## 12. 実装予定ファイル

以下はPhase 3-B2実装時の候補。現時点では作成・変更していない。

- `supabase/functions/youtube-oauth-start/index.ts` — 新規OAuth Start、JWT/AAL2/allowlist検証。
- `supabase/functions/youtube-oauth-callback/index.ts` — 既存callbackをstate/session/scope/channel検証後に交換・保存する実装へ変更。
- `supabase/functions/_shared/youtube-oauth.ts` — state/hash、固定scope、Google OAuth/response sanitization等のserver-side共通module候補。
- `supabase/migrations/<timestamp>_youtube_oauth_transactions.sql` — private schema/table/RPC forward migration候補。
- `supabase/config.toml` — Startは`verify_jwt=true`。Google callbackはJWTを受け取らないため`verify_jwt=false`を明示維持。
- `tests/youtube/test_youtube_oauth_start.mjs` — Start authorization、state生成、JWT/AAL2境界。
- `tests/youtube/test_youtube_oauth_callback_security.mjs` — replay、session、scope、channel、token-save条件。
- `tests/youtube/test_youtube_oauth_transactions.sql` — DB grant/RLS/atomic consume tests。

旧`youtube-upload` v7、Gateway本体、upload attempts schema/RPC、Creator Studio投稿UIは本計画の変更対象ではない。

## 13. Rollback方針

- Start Functionを無効化し、OAuth flow開始を停止する。callbackは未検証code交換・token upsertへ戻さない。
- migration適用前はGitの計画・実装差分を戻すだけでDB操作なし。
- staging migration後はtable/RPCを自動DROPしない。transaction行・参照有無を読み取り確認し、後続の明示承認がない限り残す。
- productionへ進む将来工程でもmigrationはforward-only。refresh tokenは失敗した認可で更新・削除しない。
- callback変更に障害があればStartを止め、token保存を無効化する。旧v8のinsecure callbackへ無条件rollbackする方法は採らず、Git/Deploy rollbackには個別のリスクレビューと承認を要求する。
- OAuth認証情報の復旧方針は、現行tokenを安全に保持した上で所有者がGoogle consentを再実行する手順を定める。token値をバックアップ・チャット・Gitへ出さない。

## 14. Deploy/適用順序案

1. 実装前の未解決判断を確定し、彩花CTOの別途実装GOを得る。
2. live Function version/source/config、DB schema/grants、redirect URI、log redactionを読み取り再確認。
3. migration SQLとFunction実装をGit mainでreview・testし、必要なSecret名と運用手順のみ確定。
4. 明示承認後、まずstaging相当DBへforward migrationを適用し、object/RLS/GRANT/RPC/atomicityを検証。
5. staging相当へStart (`verify_jwt=true`) とcallback (`verify_jwt=false`) をDeployし、mock testおよびsession bindingを確認。
6. Google追加scope・再認可・実Google `channels.list`検証は別途承認後、1回ずつ行う。成功したときだけtoken storage cutoverを検討。
7. production DB適用、Function Deploy、Google scope/consent変更は各操作前に対象差分を提示し、個別の明示承認を受ける。
8. OAuth hardening完了だけでYouTube投稿は有効化しない。Phase 3-C以降のupload実装・legacy path closure・実upload試験が別途必要。

## 15. 未解決事項 / DECISION REQUIRED

1. **callback-time AAL2:** Start時AAL2+短TTL+session bindingだけをtrustとして認めるか、別のcallback再証明を必須にするか。
2. **session revocation check:** `auth.sessions`を安全にservice-only参照する方法、権限、transaction/RPC配置をstagingで実証できるか。
3. **multiple YouTube channels:** channel listが複数件の場合のupload identityをどう一意化するか。初期実装案は複数ならfail closed。
4. **scope and consent:** `youtube.upload`+`youtube.readonly`追加とGoogle OAuth consent/verification、incremental authorization、再認可時期の承認。
5. **grant verification:** token response scopeが省略/異常の場合の、実装前に許容可能な公式検証方法。
6. **existing refresh token:** 既存tokenのscope/channel provenanceを値を表示せずどう確認し、新tokenへ安全に切替え・障害時復旧するか。
7. **access log redaction:** callback queryの`code`/`state`がSupabase platform/proxy logsへ記録されないことをどの方法で確認するか。
8. **redirect URI:** Google OAuth clientの完全一致redirect URI、allowed redirect、response destinationの現状再確認。
9. **DB/RPC privileges:** managed `auth.sessions`参照権とservice_roleだけのRPC実行権をstagingで実証する。

## 16. 次工程開始条件

- local mainは正式main SHAに同期済み。計画書登録後のremote SHAを記録する。
- 本計画を彩花CTOがreview。
- 上記DECISION REQUIRED 1–9の採否/未解決を明記し、scope追加・re-consent・session verification・refresh token切替に個別承認を得る。
- Supabase live source/configとmigration targetを読み取り再確認。
- Phase 3-B2実装、staging migration、Deploy、Google OAuth実行は、それぞれの範囲について明示承認を受けてから進む。

## References

1. Google, [YouTube Data API v3 Discovery Document](https://code.googlesource.com/google-api-go-client/+/cd5935c8eb7842ca0138a57c4794bd280e455611/youtube/v3/youtube-api.json) — methodごとのOAuth scope集合。
2. Google, [Channels: list](https://developers.google.com/youtube/v3/docs/channels/list) — `mine=true`とchannel list応答。
3. Google, [OAuth 2.0 Scopes for Google APIs](https://developers.google.com/identity/protocols/oauth2/scopes) — `youtube.readonly`等のscope説明。
4. Google, [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server) — server flow、offline access、incremental authorization。
5. Supabase, [User Sessions](https://supabase.com/docs/guides/auth/sessions) — `session_id` claimと`auth.sessions`の対応、session失効の扱い。
6. Supabase, [JWT Claims Reference](https://supabase.com/docs/guides/auth/jwt-fields) — `sub`, `role`, `aal`, `session_id`, `is_anonymous`。
7. Supabase, [Database Functions](https://supabase.com/docs/guides/database/functions) — function execute privilege、SECURITY DEFINERのsearch_path安全性。

---

**停止状態:** 本書はOAuth hardeningの設計計画であり、実装・migration・OAuth/Google設定変更・Secret変更・Deploy・実uploadを許可するものではない。
