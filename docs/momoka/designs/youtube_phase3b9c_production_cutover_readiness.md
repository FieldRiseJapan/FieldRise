# YouTube Phase 3-B9C — Production Cutover Readiness

更新日: 2026-10-02 (JST)

**DRAFT / NOT READY — 実行承認ではない。** B9CはStaging検証と計画だけ。Production refは`nmkcjtrllzkwjxmjromw`、Staging refは`zjgmgwjeebphkbbqjbfi`。

## 現在の判断

Stagingでbootstrap/B8 database contract、state lifecycle、exactly-once consume、dummy cutover、token write failure rollback、anon HTTP拒否は確認済み。history repairとauthenticated HTTP実証が残る。

今回の候補sourceはshared coreとreal state RPC adapterを実装済み。server側`YOUTUBE_GATEWAY_REAL_UPLOAD_ENABLED=true`とexact Production URL一致だけがreal pathを選択する。Stagingではflagの有無に関係なくvalidation_only。defaultは既存validation_only。Phase 1 attempts/RPCは保持し、新upload_attemptsを分離する。Node 89 PASS、StagingのROLLBACK付きSQL runtime試験PASS。ただし永続Staging migration apply/deploy/real RPCの独立connection競合実証は未完了で、Production-readyとは判定しない。

Production cutover開始前に次を閉じる:

1. Staging historyを公式CLI repairでrepository versionへ対応させ、source/schema/ACL/fixture 0を再確認。
2. 安全なStaging Auth fixtureでauthenticated HTTP拒否を検証・cleanup。
3. Production既存tableのcatalog適合を保持し、strict bootstrapを無条件db pushしない明示migration manifestと履歴baselineを確定。広いservice_role ACL最小化自体は別hardeningであり単独blockerではない。
4. 今回実装済みshared core/state/tombstoneのStaging migration applyとdeployment検証を完了し、source SHA固定。

上記のコード・migration・rollback artifactを先にレビュー可能な状態へ仕上げ、その後に**1回の明示承認でProduction Cutover全体を連続実行**する。下表のgateは工程内の検査で、定例の追加承認フェーズではない。ownerのGoogleログイン/MFA/consentは本人操作として扱う。

## 1つのProduction Cutover実行順

| 順序 | 操作・gate | 成功条件 / 失敗時 |
|---|---|---|
| 1 | Billingとproject identityを直前確認 | Free、spend cap、paid compute/add-onなし。Production ref/name/region/healthが承認manifestと一致。不明な課金要求は即停止 |
| 2 | Production catalog・migration historyをREAD-ONLY取得 | table columns/default/PK/RLS/policies/owner/ACL、OAuth object absenceまたは正規履歴、deploy source版数を確認。token値は読まない |
| 3 | 既存token preservationとbootstrap compatibilityを判断 | token row/valueは読まない。catalogのみ。既存rowのcopy/reset/deleteは禁止。existing-table互換manifestを確認し、strict bootstrapを無条件実行しない |
| 4 | 正式migration manifestをdry-run確認しDB適用 | CLIのlink先をProductionへ明示し、意図したversionだけを適用。Stagingと同じschema/ACL/function監査を実施。再試行・権限拡大で突破しない |
| 5 | OAuth Start/Callbackをimmutable sourceからdeploy | Start `verify_jwt=true`、callback `verify_jwt=false` + hash capability検証。server-only credential wiring、Origin、redirect URIが正式Production値に一致 |
| 6 | 必要Secret/設定の名前・存在・対象を確認/承認分だけ設定 | 値をchat/Git/reportへ出さない。共有Function Secretの影響範囲を確認。不要なrotation/deletionはしない |
| 7 | Google OAuth設定の必要差分とscopeを確認し、ownerが再認可 | 承認済みredirect URIと最小scopeだけ。新stateをStart-time AAL2で発行。期限内の1回だけcode交換し、不明timeoutは自動再試行しない |
| 8 | Callbackがscope/channelを検証しtokenをatomic cutover | `channels.list(mine=true)`で唯一の許可channel一致、必要scope、非empty refresh tokenを検証してから保存。失敗なら旧token保持 |
| 9 | legacy upload入口を閉鎖し、安全なリクエストで閉鎖確認 | tombstone/承認済み停止artifactへ切替。旧共有secret経路から新規uploadが開始できない。旧callback bypassも復活させない |
| 10 | Gatewayのreal-upload implementationをupload-disabledでdeploy/検証 | AAL2/allowlist、入力・rate limit・payload fingerprint・DB idempotency・outcome_unknown・safe logsを保持。旧経路に依存しない |
| 11 | 承認済み小さいMP4をprivateで1回だけupload | 2 MiB以下の既存試験上限、owner最終確認、private固定、notifySubscribers=false。自動再送なし。公開投稿・大容量試験は含めない |
| 12 | videoId・intended channel・privacyを照合 | upload成功IDだけでなく許可channel/privateとDB terminal stateを確認。応答喪失はunknownとして照合までblockし新規再投稿しない |
| 13 | Posting buttonを承認された条件で解禁 | 下記解禁条件が全部成立。未成立ならUIを無効のままにし安全rollback |
| 14 | Free状態・logs・source match・結果を確認してSTOP | billing操作0、秘密漏洩なし、migration/deploy artifact一致、試験は1投稿だけ。以降の自動/公開投稿は別の運用判断 |

## Migration history / bootstrap compatibility

### Stagingで先に行う公式repair

対応はB9C報告書のsource全文一致で一意。認証済み専用Staging workdirのproject-refを検査し、local versionsを`applied`、MCP生成versionsを`reverted`へ公式CLIで変更する。schema SQLは再実行しない。repair中は他のmigration操作を止め、各操作後の履歴を検査する。

最終履歴versionは`20260927080000`と`20260927084829`、fixtureは0。失敗時はschema/data resetせず、元mappingを使った公式repairの逆操作をレビューして履歴だけを戻す。接続認証がない環境で手動history SQLへ置き換えない。

### Production既存table

B9A/B9B時点の記録ではProduction service_roleにDELETE/TRUNCATE/REFERENCES/TRIGGER等がある。現bootstrapの既存table branchはSELECT/INSERT/UPDATEだけを要求するため、その状態のままではfail closedになる。B9CはProductionの新しいcatalogを取得していない。

最新指示により広いservice_role ACLの最小化は別hardeningとし、それ自体をCutover blockerにしない。既存tableは3 columns/default/RLS/owner/policyなしをcatalog確認済み。browser ACL拒否を別途確認する。既存tableを再作成せずB8を適用できる。ただしrepository strict bootstrapを無条件db pushすると既存ACLで失敗するため、既存remote履歴を含めたexact migration manifest/baseline手順の確定が必要。contract不一致のbootstrapを満たしたと偽ってmark-appliedしない。CLI利用可能後にdata-preserving compatibility用forward artifactを正式version化・検証し、通常db pushが旧bootstrapを二重適用しない履歴計画を確定する。

`db push`はlink先・history・exact pending manifestの確認後だけ実行する。B8のschema名が既に存在する、source不一致、partial object、unexpected historyなら止める。適用済みmigrationを再実行しない。

## Secret / config inventory（値なし）

| 名前 | 用途 | 境界 |
|---|---|---|
| `SUPABASE_URL` | 対象project URL | Project identityとの一致を確認 |
| `SUPABASE_ANON_KEY` | Start/Gatewayの正式Auth確認 | 公開keyのみ。service keyに置き換えない |
| `SUPABASE_SERVICE_ROLE_KEY` | reserve/consume/finish/cutover、upload側token取得 | server-side限定、browser/log/report禁止 |
| `YOUTUBE_GATEWAY_ALLOWED_USER_ID` | owner single-user allowlist | server-side設定のみ、値を記録しない |
| `YOUTUBE_CLIENT_ID` | Google OAuth client | 正式project/clientとの一致 |
| `YOUTUBE_CLIENT_SECRET` | code exchange / refresh | server-sideのみ |
| `YOUTUBE_ALLOWED_CHANNEL_ID` | callback/投稿対象channel照合 | server-side。handleだけを根拠に設定しない |
| `YOUTUBE_GATEWAY_REAL_UPLOAD_ENABLED` | server-side real activation flag | Stagingではfalse、closureとDB確認後のみProductionでtrue |
| `YOUTUBE_UPLOAD_SECRET` | 旧upload経路の既存依存 | 新shared方式では使わない。legacy closure後の削除は他の依存確認と承認が必要 |

OAuth redirectは現在sourceの正式Production callback URI、Originは`https://fieldrisejapan.github.io`。誤ってStaging/Productionを混在させない。allowlistやchannel値は本人の安全な設定経路で扱う。

## Google scope / reconsent / channel

現OAuth sourceのscopeは`youtube.upload`と`youtube.readonly`。将来の承認範囲ではこれらとredirect URIの必要差分だけを確認する。既存grantが足りなければownerがconsent画面を確認して再認可し、余分なscopeを追加しない。課金やpaid featureが必要なら停止する。

Google refresh/access token・code・state・resumable URIはserver memory/安全なDB境界でのみ扱う。scope検証と唯一の許可channel一致を満たさない新tokenを保存しない。channel handleや画面名だけでowner/channel bindingを確定しない。

公式確認先: [channels.list](https://developers.google.com/youtube/v3/docs/channels/list)、[videos.insert](https://developers.google.com/youtube/v3/docs/videos/insert)、[server-side OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps)。B9Cではdocs確認だけで、Google OAuth/API実通信はしていない。

## Rollback / ambiguous result

- upload-disabled / Gateway validation_onlyとUI disabledを安全な戻し先として、追加provider通信を止める。
- OAuth failure中は旧tokenを保持。成功cutover後は検証済み新tokenを保持してdeploymentをrollbackする。旧tokenをGit/logへbackupしたり、復元できると仮定したりしない。credential復元が必要なら別の安全な承認済み保管方式が必要。
- `uploading` / `outcome_unknown` / successful videoId等のattempt記録を削除・resetしない。YouTubeと照合するまで同じattemptや新規投稿を再送しない。
- 成功したDB migrationは保持し、down/drop/history deleteで戻さない。forward fixまたはfeature disableを使う。
- 不安全な旧callback/共有secret upload入口を復活させない。安全な過去artifactがなければendpointを無効化する。
- 実private videoの削除、Google token revoke/rotation/再認可は自動rollbackに含めず、影響を確認してowner判断を得る。

## Creator Studio解禁条件

Staging全gate、履歴整合、Production catalog/ACL/migration、source match、Start-time AAL2とowner/channel allowlist、legacy閉鎖、real-upload/idempotency/unknown処理、秘密redaction、private試験1件のchannel/ID/DB state照合、Free operation継続、rollback artifactが全てPASSすること。

UIの確認操作・選択動画・タイトル・最終確認・重複submit防止は維持する。production approvalにbutton解禁が明記されていなければ無効のままにする。callback-time AAL2 VERIFIEDとは扱わない。

**B9C終了時点: Production CutoverはBLOCKED。計画は準備済みだが、実行には残blockerのclosureと明示承認が必要。**

## 2026-10-02 implementation manifest

- `_shared/youtube-upload/core.mjs`: token refresh、expected channel照合、private resumable insert/PUT。Locationはmemoryだけ。redirect/retryなし、2 MiB上限、MP4 ftyp/brand確認。category 10/madeForKids false維持。insert到達可能性以降の失敗は保守的にoutcome_unknown。
- `youtube-upload-gateway/real-upload.mjs`: metadata/video hash fingerprint、DB reserve/CAS begin/terminal保存。same-key same-payloadは既存結果、different-payloadは409。DB terminal保存失敗はuploadingを残す。
- `20261001224858_youtube_gateway_real_upload_state.sql`: official CLI 2.119.0で生成したforward migration。user/key PK、channel partial UNIQUE、user/channel advisory xact lock、3/15min rate limit、RLS/policyなし、service_roleのみ、INVOKER/empty search_path。accepted/uploading/unknownを時間で解放しない。unknown自動解除RPCなし。
- `youtube-upload/index.ts` + `tombstone.mjs`: 410 fixed response。Production旧version7は未変更。Cutoverでこのartifactを先にdeployし、閉鎖を確認後に新Gatewayをactivate。rollbackはtombstone維持＋Gateway flag false＋UI disabled。
- 認可・Origin・request size・metadata validationは既存handlerを共用。実upload用flagはbrowser入力にしない。
- one-shot実行順は上表を維持。本人OAuth/MFA/consent/YouTube Studio確認は本人操作を含むため、寝ている間に完遂できると約束しない。

### Remaining gate evidence

履歴repair認証、authenticated HTTP fixture経路、最新Spend cap/add-on/compute証拠、永続Staging migration apply/deploymentとDB競合検証が残る。必要Secretの名前一覧を読み取れる既存経路も未提供。既存token値を読まずに確認する。Denoなし/INFO/policyなし/Production service_role追加ACLだけではREDにしない。


## FINAL GREEN follow-up gate — 2026-10-02

**BLOCKED — BILLING RISK / PRODUCTION CUTOVER NOT READY**. Fresh main remains baseline 4cd76065473c40d15a3410e742e653b8a7453805 before documentation registration. Free/health verified; latest Spend cap/compute/add-on evidence unavailable. Staging history still unreconciled and existing CLI auth absent. Latest persistent apply gate requires reconciled expected history, so the new migration was not applied. Auth fixture/HTTP/independent-connection concurrency/deployment proofs remain pending; no test credential requested or generated.

Production migration manifest remains conditional: bootstrap source cannot be blindly run against previously observed broad service_role ACL, B8 is required after verified official baseline/compatibility, then new Gateway state is required after persistent Staging proof. Do not falsely mark bootstrap applied or mutate existing token table to force it through. The ACL minimization itself is separately deferred; strict migration execution compatibility is still unresolved. Production token catalog/history evidence is inherited from the prior read-only audit, not refreshed by token row queries.

Runtime prepared sequence: DB → OAuth Start/Callback → Gateway/shared core flag false → legacy tombstone/closure verification → real activation after OAuth/channel/token prerequisites. Rollback keeps tombstone and disabled/validation-only Gateway/UI, preserves token and unresolved attempts. No Production action is authorized by this document or its GitHub registration. Full 28-gate table and evidence limits are in the final report.


## Latest attachment (2): persistent Staging update

Supersedes earlier FINAL GREEN write-gate/status interpretation. Latest instruction only requires history state known before independent apply, not successful repair. Staging Gateway state applied once from unchanged 20261001224858 source, remote version 20261002014237 (MCP timestamp), stored SQL SOURCE MATCH. Table/RPC/RLS/ACL/owner/INVOKER/empty path and persistent state/rollback/block tests PASS; fixtures 0. Staging Gateway ACTIVE v1 verify_jwt=true, all five deployed files SOURCE MATCH; missing/invalid Bearer HTTP401. No provider or Secret operation.

True DB concurrency still unproven: separate backend requests yielded one accepted/one busy or existing, but lock contention false for both. Require independently connected overlapping sessions with positive contention evidence; do not count mere Promise.all as PASS. Authenticated HTTP/positive Edge path still blocked by safe Auth fixture/allowlist path availability.

Official cost-control docs clarify Spend Cap is Pro-only and Free users are not charged. Free metadata fresh; Spend Cap N/A, not enabled. Earlier Billing Risk conclusion from missing Free spend-cap evidence is corrected. Exact Compute/add-on/current invoice flags remain unverified; no billing setting is to be changed to satisfy this gate.

Official repair mapping now contains three pairs: 20260927080000→20261001115200, 20260927084829→20261001115628, 20261001224858→20261002014237. All stored SQL exact-source matched. Use official repair only when existing safe auth is available; no schema replay, manual history SQL, renamed source or false applied markers. Production bootstrap strict ACL mismatch remains source execution compatibility blocker, not blanket demand to minimize ACL. Production manifest cannot be called executable until the exact data-preserving official baseline is certified.

Runtime deploy sequence is DB → OAuth Start/Callback → Gateway flag false → legacy tombstone closure → owner reconsent/scope/channel/token cutover → Gateway activation → one private test upload → YouTube Studio/final regression → UI release. None executed on Production. Final status **PRODUCTION CUTOVER NOT READY**; current 28-gate evidence/limits are in final report.
