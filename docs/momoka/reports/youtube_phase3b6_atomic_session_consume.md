# YouTube Phase 3-B6 Atomic Session + State Consume

**対象:** FieldRise YouTube Creator Studio
**作業:** callback session validation と OAuth state consume の local統合、mock/contract test
**判定:** `IMPLEMENTED WITH STAGING REQUIRED`
**実環境:** DB migration未適用、Function未Deploy、OAuth/Google/YouTube通信なし

## 1. B5で見つかったTOCTOU

B5時点のcallbackは、state lookup、session verifier、state consumeを別RPCとして順番に呼んでいた。したがってsession確認後にsessionが削除・失効し、consumeが後から成功する競合窓があった。B5 migrationにはsession verifierがなく、実DB実行も未検証だった。

## 2. 修正前後のflow

修正前:

```text
lookup state → verify session → consume state → Google code exchange
```

修正後:

```text
hash callback state → one server-only consume RPC
  → lock pending transaction
  → lock and verify bound Auth session row
  → conditionally consume state
→ RPC success only → Google code exchange
```

callback handlerは`lookupState()`と`verifySession()`を成功条件として使わず、`youtube_oauth_consume_state`を一度だけ呼ぶ。成功時に返す情報は後続処理に必要なtransaction IDだけ。user/session ID、email、Auth metadata、AAL情報、state、code、tokenはRPC応答へ含めない。

## 3. DB transaction / session trust境界

`youtube_oauth_consume_state(bytea)`は`SECURITY INVOKER`、空`search_path`、完全修飾object名で定義する。同じPostgreSQL function call/transaction内で:

1. state hash一致、期限内、未consume、未finishのtransactionを`FOR UPDATE`でロックする。
2. transactionに保存したuser/session pairだけをsession helperへ渡す。
3. helperが対応する`auth.sessions`行をuser IDとsession IDで照合して`FOR SHARE`ロックする。
4. helper成功時にだけtransaction期限・未consume・未finish条件を再確認して`consumed_at`を更新する。
5. transaction IDだけを返す。

一条件でも不成立ならconsumeしない。session helperはFieldRise独自の`youtube_oauth_private` schemaに置く。`auth` schemaへFieldRise objectは作らない。`service_role`に`auth.sessions`直接権限は付与しない。

Supabaseの公式session説明ではJWTの`session_id`は`auth.sessions`のprimary keyと対応し、sign outされたsession rowは削除される。一方、timebox/inactivity timeoutは次のrefresh時に評価され、期限切れsession rowは即時に削除されない。そこでStart側は正式検証済みJWTの`exp`を読み、transaction TTLを`min(configured TTL, expまでの秒数 - 30秒)`に制限する。残り60秒未満、または`exp`が欠ける場合はstateを発行しない。session row照合はsign out/revokeとの競合を保護し、JWT expiry clampはStart時の認証済みtoken有効期間を境界にする。callback-time AAL2確認とは扱わない。
参照: [Supabase User Sessions](https://supabase.com/docs/guides/auth/sessions)

### SECURITY DEFINER helper

`youtube_oauth_private.youtube_oauth_lock_active_session(uuid, uuid)`のみ`SECURITY DEFINER`とする候補を実装した。service_roleには`auth.sessions`直接SELECTを付けず、helperはrow存在/user bindingをbooleanでだけ返し、同一transaction終端まで`FOR SHARE` lockを保持する。`SET search_path = ''`、完全修飾`auth.sessions`参照、PUBLIC/anon/authenticated EXECUTE revoke、service_role EXECUTE grantを設定する。

候補ownerはB5 metadataで`auth.sessions`のtable ownerとして確認した`supabase_auth_admin`。migrationはprivate schemaのUSAGE/CREATEを一時grantし、owner移譲後CREATEをrevokeする。managed roleへのowner移譲可否、実効権限、実際のRLS挙動は未検証であり、stagingで必ず確認する。owner roleは広いAuth権限を持つため、固定SQL、boolean限定返却、service_role限定EXECUTEを含めてsecurity review対象とする。より狭いowner/privilege境界をstagingで安全に作れない場合はmigrationを適用しない。

## 4. AAL2の扱い

OAuth Startで正式JWT検証後、authenticated/non-anonymous/AAL2/allowlistを確認する。callbackはSupabase JWTを要求しないため、callback時AAL2を再確認しない。信頼根拠はStart時AAL2 + 短TTL transaction + user/session binding + JWT expiry境界 + atomicなsession-row照合とone-time consume。callback-time AAL2 verifiedとは記録しない。

## 5. Race / failure analysis

| Case | 挙動 |
|---|---|
| 同じstateへの同時callback | transaction row `FOR UPDATE` と未consume条件により成功は最大1件。 |
| session sign out/revokeとconsumeの競合 | session `FOR SHARE` lockがrow delete/updateと直列化する。revokeが先に成立すれば照合失敗。consumeが先にlockしてcommitすれば、その時点でsessionが有効だった順序になる。 |
| transaction/JWT期限境界 | transaction期限をStart JWT `exp`より30秒早く設定し、consume開始時と更新時の両方でDB clockを使い再確認する。 |
| callback replay | consumed/finished stateは再利用できない。 |
| Google denial/error | valid stateは先にconsumeし、`provider_denied`終端化を試みる。authorization code exchangeはしない。finishが失敗してもconsumed stateは再利用不可。 |
| consume RPC error/timeout | repositoryは`unavailable`を返し、callbackは安全な503を返す。Google exchange、RPC自動retry、同じstate/codeの再送はしない。結果不明なら新しいOAuth Startからやり直す。 |
| post-commit revoke | Google通信はDB commit後の別system処理であり、commit後のrevokeを遡って取り消すことはできない。atomic checkはconsume時点で線形化する。 |

## 6. Token cutover boundary

session + state consume transactionとrefresh token cutoverは統合しない。Google code exchange、scope確認、許可channel確認後に既存`youtube_oauth_cutover_token`を呼ぶ。既存設計どおり、transaction finishとtoken UPSERTは別の一つのDB transaction内で行い、失敗時は旧tokenを保持する。Google通信をDB transactionへ入れない。

## 7. Migration変更

`supabase/migrations/20260927084829_youtube_oauth_transactions.sql`をlocalで更新した。B6指示のとおり、このB4 migrationはproduction/stagingへ未適用の前提である。新たに適用済みobjectを変更するDDL、DROP、DELETE、TRUNCATE、既存token row書換えは加えていない。別state lookup RPCを削除し、session helperとatomic consumeを同migrationにまとめた。適用は今回行っていない。

## 8. Test coverage / validation

追加・更新テストは以下を確認する。

- consume stateは単一RPC、成功時にtransaction ID以外を返さない。
- expired/consumed/finished/missing/mismatched state/sessionはconsume失敗。
- DB helperのsession/user bindingとrow lock契約、SECURITY DEFINER、empty search_path、ACL。
- auth schemaへの独自objectなし、分離したlookup/session RPCなし。
- callback replayは最大1回のcode exchange。RPC failure/ambiguous timeoutはexchange・retryなし。
- provider denialはconsume/terminalizeし、code exchangeなし。
- callback-time AAL2を検証済みと扱わない。
- token cutoverは成功条件を満たした場合だけ行い、既存tokenをnull/deleteで消さない。
- JWT/state/code/token/provider error等がresponse/logへ出ない既存契約を維持。

実行結果:

- `node --test tests/youtube/*.mjs tests/test_youtube_creator_studio.cjs`: **64 PASS, 0 FAIL**
- Node JS/TS syntax checks: PASS
- `git diff --check`: PASS
- Supabase CLI/PostgreSQL/psql/Deno: unavailable; global installなし
- **DB EXECUTION NOT VERIFIED**
- **DENO VALIDATION NOT AVAILABLE**

テストはmock/static/contractのみで、Supabase、Google、YouTubeへの通信は行っていない。

## 9. 必須staging gates

1. clean staging DBへmigrationを適用し、function owner・ACL・RLS・security definerの実効権限を確認する。
2. `supabase_auth_admin`へのownership移譲が成立し、helperの実行経路がservice_role限定であることを確認する。
3. session rowが欠落、user不一致、signout/revoke、transaction expiryの場合にconsumeされないことを実DBで確認する。
4. concurrent callbackとsession revokeのraceを実DBで確認する。
5. consume応答timeout後にGoogle exchange/retryが起きないことを統合境界で確認する。
6. token cutover失敗時に旧token rowが保持され、transaction finishもrollbackされることを確認する。
7. Auth timebox/inactivity settingsとJWT expiry clampの関係をstagingで検証する。Auth実装・DB schemaはmanaged internalsなので、将来の変更耐性も評価する。
8. Deno format/lint/type checkを実行する。

## 10. Production blockers

- staging DBでのmigration/RPC/owner/ACL/RLS/race/rollback実証
- callback queryの`code`/`state`をplatform/access/error logsへ残さないredaction確認
- Google Cloud redirect URI一致、`youtube.readonly` scope承認、Google再認可
- 許可channel identityの実確認
- production migration適用、Function Deploy、OAuth実行は各々別承認が必要

## 11. 作業境界

production/staging DB、RPC、Auth、Secret、Function Deploy、Google Cloud、OAuth、YouTube API、実upload、Gateway、Creator Studio UI、TikTok、Instagramは変更・実行していない。
