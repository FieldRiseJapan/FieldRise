# YouTube Phase 3-B5 DB / RPC / Session Security Verification

**対象:** FieldRise YouTube Creator Studio

**作業:** 読み取り専用DB metadata確認、B4 migration静的監査、ローカル契約テスト

**判定:** `DB SECURITY VERIFIED WITH STAGING REQUIRED`

**注意:** Production DBのmigration適用・RPC実行・token行読取は行っていない。DB実行検証は未実施。

## 1. Git基準と変更範囲

- B4正式main: `75bf913a2d4982fe284b20c995cf21b62de4c575`
- B4 local検証Commitと正式mainの7対象ファイルを読み戻し比較し、完全一致を確認した。
- local mainを正式B4 mainへ同期した。作業開始時local検証Commitは別branchで保持した。
- B5で変更するファイルは、本報告書とDB契約テストのみ。

## 2. B4 migration静的監査

対象: `supabase/migrations/20260927084829_youtube_oauth_transactions.sql`

作成対象は`youtube_oauth_private` schema、`transactions` table、OAuth用5 RPC。既存tableへのDDLはなく、DROP、DELETE、TRUNCATE、既存rowのmigration時UPDATEはない。token tableへのINSERT/UPSERTはRPC本体内だけにあり、migration適用時には実行されない。

`transactions`はstate hash、user/session binding、作成・期限・consume・finish時刻、固定result codeのみを持つ。RLS有効、policyなし、PUBLIC/anon/authenticatedへのschema/table権限なし。service_roleには必要なtable権限が付与される。OAuth RPCは`SECURITY INVOKER`、空`search_path`、完全修飾table名を使い、PUBLIC/anon/authenticated EXECUTEをrevokeし、service_roleだけにEXECUTEをgrantする。

state hashは32 bytes、transaction TTLは60～600秒に制約される。期限は作成時刻より後かつ10分以内で、result codeは固定集合に制限される。

### Atomic state consume

`youtube_oauth_consume_state`はstate hash、未期限、未consume、未finishを1つの条件付き`UPDATE ... RETURNING`で判定する。SELECTしてから別UPDATEする構造ではないため、同じrowへの同時consumeはPostgreSQLのrow update競合で最大1件が成功する。raw stateは保存しない。

### Atomic token cutover

`youtube_oauth_cutover_token`は、非空・長さ上限内のrefresh tokenを受け取り、未完了transactionを`token_stored`として更新した後、既存token tableの固定idをUPSERTする。両方が1つのPostgreSQL RPC statement/transaction内にあるため、UPSERT例外は先行transaction更新もrollbackする。null/空文字の受け入れ、旧token削除、null化、失敗時の自動再試行はない。

これはSQL構造からの静的評価であり、実PostgreSQLでのrollback、同時実行、constraint挙動はstagingで未検証。

## 3. Production metadata（読み取り専用）

SQLはsystem catalog / information_schemaのSELECTのみ。rowデータは参照していない。

- `public.youtube_oauth_tokens`は存在。列は`id bigint`、`refresh_token text`、`updated_at timestamptz`。primary keyあり。値は一切取得していない。
- token tableはRLS有効、policyなし、FORCE RLSなし。anon/authenticated/PUBLICのtable grantは確認されなかった。既存service_roleにはSELECT/INSERT/UPDATEに加えDELETE/TRUNCATE等の広い既存権限がある。今回変更していない。
- `youtube_oauth_private` schema/tableおよび`youtube_oauth_*` RPCは未作成。`youtube_gateway_private.attempts`と既存gateway RPCは存在し、OAuth名との衝突は確認されなかった。
- gatewayの既存RPCは`SECURITY INVOKER`、空`search_path`、metadata ACL上service_roleのみEXECUTE。
- Supabase migration一覧に返された記録はTikTok系のみで、YouTube OAuth migrationの適用記録はなかった。

## 4. `auth.sessions`とsession helper設計

Supabase公式資料ではJWTの`session_id`が`auth.sessions`の主キーに対応し、sign out後はsession rowが削除されると説明されている。一方、timebox/inactivityで期限切れになったsessionは即時削除されず、段階的に削除されるため、単純なrow存在確認だけでは期限判定を保証できない。[Supabase User Sessions](https://supabase.com/docs/guides/auth/sessions)

Production metadataだけで確認した範囲では、`auth.sessions`に`id`、`user_id`、`not_after`、`refreshed_at`等の列がある。rowは読んでいない。RLS有効、FORCE RLSなし。table ownerはSupabase管理roleであり、service_roleに直接SELECT権限はない。service_roleから直接読む設計にはしない。

### 候補helper

- RPC: `public.youtube_oauth_verify_session(p_user_id uuid, p_session_id uuid, p_transaction_expires_at timestamptz) returns boolean`
- fixed queryで`auth.sessions.id = p_session_id`、`user_id = p_user_id`、transaction期限を確認。`not_after`の有効期限条件はstagingで列の意味を確認できた場合に限り使用。
- 成功/失敗のbooleanのみ返す。email、session metadata、JWT、MFA details、IP、provider情報は返さない。
- Browser rolesからEXECUTE不可。PUBLIC/anon/authenticatedをrevokeし、service_roleのみgrant。
- `auth.sessions`にservice_role grantがなくRLSも有効なので、SECURITY INVOKERでは必要なrowを検査できない。狭い固定処理のSECURITY DEFINERが候補となり、`SET search_path = ''`と完全修飾名を必須とする。
- ownerは未確定。managed table ownerは必要列以外にも強い権限を持つため、そのまま採用しない。stagingで、専用NOLOGIN reader role/列権限/RLS条件が安全に成立するかを先に検証する。成立しない場合は、managed ownerを使う例外のリスクレビューを別途行う。function owner、EXECUTE ACL、実効権限をstagingで確認する。
- B4 callbackの境界は`youtube_oauth_verify_session`呼出しに失敗したら拒否するfail-closed動作。RPCが未作成のため、現状はcallbackが成功しない。

**Callback時点のAAL2を確認したとは扱わない。** 正式方針はStart時AAL2 + 短TTL + user/session binding + callback時session validityである。`not_after`とinactivity/timeoutの実効判定は`STAGING VERIFICATION REQUIRED`。

### Atomicity上の注意

B4 callbackはsession確認RPCの後に、別のstate consume RPCを呼ぶ。state consume自体は原子的だが、session確認とconsumeは同一DB transactionではない。確認後consume前にsign out/revokeが競合するTOCTOU窓が残る。staging実装前に、consume RPC内でsession bindingを再確認する設計、または同一DB transactionで両方を保護する設計を確定し、競合テストを追加する。

## 5. DB契約テスト

追加した`tests/youtube/test_oauth_db_contract.mjs`は、B4 migration本文の静的契約を7項目確認する。対象はforward-only形状、保存列/RLS/grant、hash/TTL制約、RPC security attributes/ACL、原子的state consume条件、token cutover順序と失敗時保護、session RPC未実装のfail-closed状態。

`test_oauth_repository.mjs`には、session helper境界でuser/session不一致をfalse扱いし、metadataを返さないmock testを追加。既存mock suiteはreplay、期限、session拒否、empty token拒否、provider失敗時cutover不実施を確認する。

最終ローカル検証: OAuth/Auth/Gateway/DB contract **53件 PASS**、Creator Studio regression **8件 PASS**、JS/TS構文検査・TOML/JWT設定確認・`git diff --check` PASS、秘密値パターン検査 PASS。テストはGoogle/YouTube/Supabase productionへの通信を行わない。

これらはSQL構造・repository contractの検査であり、PostgreSQL実行テストではない。PostgreSQL/SQL parserは利用可能環境に見つからず、global installは行っていない。**DB EXECUTION NOT VERIFIED**。

## 6. ツール・仕様確認

- Supabase CLI、Deno CLI、PostgreSQL、`psql`、SQL parserは利用可能環境にない。**DENO VALIDATION NOT AVAILABLE**。新規global installなし。
- `supabase migration new`が利用できないため、B5 helper用migrationファイルは生成していない。B4 migrationも変更していない。
- Supabase changelog確認で、Auth schemaを含むmanaged schemaへの独自DDLやmigration table書込みを避ける必要を再確認した。session helperは`auth` schema内へ作らず、B4と同じpublic RPC境界を候補とする。[Supabase Changelog](https://supabase.com/changelog?types=breaking-change)

## 7. Blocker分類

### A — Local implementation blocker

- `youtube_oauth_verify_session`が未実装。B4 callbackはfail-closedで成功不可。
- session確認とstate consumeが別RPCで、競合時のsession binding原子性が未確定。
- B5ではこれらを変えるfunction/migrationを作成していない。

### B — Staging blocker

- migrationのclean apply、RLS/GRANT/REVOKE、RPCだけservice_role成功を実DBで検証する。
- helper owner/SECURITY DEFINER、`auth.sessions` RLS/期限列の意味を検証する。
- expired/replay/concurrent consume、session revocation race、token cutover rollbackと旧token保持をfixture付きDBで確認する。
- Deno format/lint/type checkを実行する。

### C — Production blocker

- callback URL queryのcode/stateをplatform/access/error logsへ記録しないredaction確認。
- Google Cloud redirect URIと実callback URL一致。
- `youtube.readonly`追加とGoogle再同意、実際のgranted scope確認。
- 実`channels.list`で許可channelが一件だけであることの確認。
- session helperとmigration、atomic consume/cutoverのstaging実証後、productionへの個別承認。

## 8. 作業境界

Production DBはmetadata SELECTのみ。migration、RPC、Auth、Secret、Edge Function、Google Cloud、OAuth、YouTube API、実upload、TikTok、Instagramは変更・実行していない。token値、user/session実値、JWT、OAuth code/state、その他credentialは取得・保存していない。
