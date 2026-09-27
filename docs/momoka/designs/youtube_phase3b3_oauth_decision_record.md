# YouTube OAuth Hardening — Phase 3-B3 Decision Record

**対象:** FieldRise YouTube Creator Studio
**用途:** Phase 3-B2の未解決事項に対する実装前判断記録
**状態:** 読み取り専用調査・設計判断。OAuth、DB、Function、Secret、Google Cloud、YouTube APIは変更していない。
**Git基準:** 作業開始時・登録直前の正式main `bb99277ab2f5de0c58c2152c6eb34e66b0038644`。
**既存source:** Phase 3-B1で保存したlive baseline。source captureは安全化を意味しない。

## 判断の要約

- **ローカルのmock実装:** 開始可能。外部OAuth/APIとlive DBを使わず、未解決箇所を明示的なinterfaceとfail-closed mockで隔離する。
- **staging実装・DB適用:** `auth.sessions`確認経路と権限の実証後に進める。
- **production OAuth / Deploy:** **BLOCKED**。hosted callback URLのquery logging/redactionと実redirect設定の一致が未確認。Google scope追加・再同意も別途承認が必要。
- この記録はPhase 3-B4の実装承認、DB migration、Deploy、Google consent、実OAuthを許可しない。

## D1 — Callback時点のAAL2

**QUESTION**  Google callback時にSupabase JWTを要求せず、OAuth Start時に確認したAAL2を短命transactionの信頼根拠としてよいか。

**EVIDENCE**  Phase 3-B2の正式設計は、Startで署名検証済みJWTの`authenticated`、非anonymous、`aal2`、single-user allowlistを確認し、`sub`と`session_id`をserver-side transactionへ結び付ける。Google redirect callbackにSupabase Authorization header/JWTが来るとは仮定しない。Supabaseのsession資料はJWTの`session_id`と`auth.sessions`行の対応を説明するが、同sessionがあることだけではcallback時点のAAL claimを再証明しない。既発行JWTはsession終了後も期限まで利用できる場合がある。

**DECISION**  初期案は **START-TIME AAL2 TRUST** とする。OAuth StartでAAL2を確認し、短い固定TTL、user/session binding、callback前のsession有効性確認、stateのone-time consumeを必須にする。これはcallback時AAL2の再確認ではない。callbackへbrowser JWTを追加POSTする案は採らない。

**STATUS** `RESOLVED`（設計方針）。

**IMPLEMENTATION IMPACT**  Start handlerは検証済みAAL2とbindingをtransactionへ保存する。callbackは未期限・未消費のtransactionとsession有効性を確認して処理する。実装PRとstaging試験で、このtrust境界を彩花CTOが再確認する。AAL2が継続していると記録・表示しない。

## D2 — Session失効確認と`auth.sessions`参照境界

**QUESTION**  transactionのsessionがまだ存在し、同じuserに属することをserver-sideでどう確認するか。

**EVIDENCE**  Supabase資料では署名検証済みJWTの`session_id`が`auth.sessions.id`に対応する。DB schema上、`auth.sessions`には`id`、`user_id`、`not_after`等がある。今回の権限metadata確認では、`anon`、`authenticated`、`service_role`はいずれもこのtableを直接SELECTできず、`service_role`はRLS bypass属性を持つがtable SELECT権限は別途ない。session rowの値は参照していない。Supabaseの一般利用者向けAPIで、指定sessionの存続確認をcallbackから行う確立済みの代替手段は確認できていない。

**DECISION**  Startで検証した`session_id`と`sub`を保存し、callbackでは`session_id`一致・`user_id`一致・`not_after`未到来・row存在を必ず検査する。直接table accessは公開しない。優先候補は、入力を固定型に制限した読み取り専用session-check helperを作り、`youtube_oauth_private`内に配置、完全修飾名・空`search_path`・動的SQLなし・boolean等の最小結果のみ返し、EXECUTEを`service_role`のみに限定する方法。helper所有者には必要最小の列読取権だけを与える。managed Auth schema上でこれが成立しない場合の代替はstagingで再設計し、未確認のまま省略しない。

**STATUS** `STAGING VERIFICATION REQUIRED`。

**IMPLEMENTATION IMPACT**  Edge Functionから`auth.sessions`を直接読むコードや、広い`SECURITY DEFINER`関数は作らない。stagingで所有者・RLS・列権限・function EXECUTE境界を実証するまでsession revocation checkは未完了扱いとする。

## D3 — OAuth DB / RPC privileges

**QUESTION**  OAuth transactionとsession helperをどのDB権限で実装するか。`SECURITY DEFINER`は必要か。

**EVIDENCE**  読み取り確認では`youtube_oauth_private` schemaとOAuth transaction RPCは未作成。既存`public.youtube_oauth_tokens`はRLS有効で、browser roleからSELECT不可、service roleには既存upsertに必要な権限がある。既存Gateway RPCは`SECURITY INVOKER`で、EXECUTEはservice roleのみ。Supabase/PostgreSQL資料はfunction EXECUTE権限を明示的に制御するよう勧め、`SECURITY DEFINER`では空`search_path`、完全修飾名、PUBLIC executeのrevokeが必要としている。

**DECISION**  forward migrationで専用private schemaと最小transaction tableを追加し、table/schema/RPCとも`PUBLIC`、`anon`、`authenticated`を拒否する。RPCは可能な限り`SECURITY INVOKER`とし、server-side `service_role`だけに必要権限を付与する。session helperに限りInvokerでAuth tableを安全に参照できないことがstagingで確認された場合、狭いread-only処理の`SECURITY DEFINER`を検討する。その場合は同一migration内でPUBLIC executeをrevoke、service_roleのみgrant、`SET search_path=''`、全object完全修飾、動的SQL禁止、必要最小の戻り値とする。token切替とtransaction完了は1つのDB transaction/RPCで確定する。

**STATUS** `STAGING VERIFICATION REQUIRED`。

**IMPLEMENTATION IMPACT**  migration前にschema、既存object、RLS、GRANT/REVOKEを確認し、stagingで全roleの権限、atomic consume競合、session helper、token更新原子性を検証する。production適用は別承認。

## D4 — 複数YouTube channel

**QUESTION**  `channels.list(mine=true)`が0件または複数channelを返したとき、どのchannelのOAuthを承認するか。

**EVIDENCE**  YouTube公式仕様では`mine=true`は認証済みGoogle userが所有するchannelを返す。仕様は1件だけの返却を保証しない。

**DECISION**  初期実装では、返却結果がちょうど1件で、IDがserver-side allowed channel IDと完全一致するときだけ先へ進む。0件、複数件、ID欠落、不一致、曖昧な結果、API errorはすべて拒否し、refresh tokenを保存しない。browserから渡されたchannel IDは使わない。

**STATUS** `RESOLVED`。

**IMPLEMENTATION IMPACT**  response件数とIDをサーバー側で検証する。複数channel選択UIや別channelの切替は初期実装に含めない。

## D5 — API scopeとconsent

**QUESTION**  uploadとchannel identity確認に必要な最小scope集合は何か。

**EVIDENCE**  Google YouTube Data APIの`videos.insert`は`youtube.upload`を受け付ける。`channels.list`の公式method scope一覧に`youtube.upload`は含まれず、`youtube.readonly`が含まれる。従って既存`youtube.upload`だけでchannel確認できるとは扱えない。

**DECISION**  将来のOAuth要求scope候補は`https://www.googleapis.com/auth/youtube.upload`と`https://www.googleapis.com/auth/youtube.readonly`の組合せとする。広い`youtube` scopeは選ばない。Google consent変更・再認可はこの作業で行わず、別途明示承認を要する。

**STATUS** `SEPARATE APPROVAL REQUIRED`。

**IMPLEMENTATION IMPACT**  scopeはserver-side固定値とし、browser入力を受け付けない。mock/local実装では必要scope集合をテストできるが、Google実認可・channel API呼出しは別承認後に限る。

## D6 — 実際にgrantedされたscopeの検証

**QUESTION**  code exchangeで要求scopeが実際に付与されたことをどう証明するか。

**EVIDENCE**  Google OAuth web-server flowのtoken responseには実際の認可scopeを示す`scope`フィールドがあり、要求したscopeと返却されたscopeが異なる場合がある。incremental authorizationは既存grantの扱いに関係するが、要求したという事実だけでは今回の認可範囲を証明しない。

**DECISION**  code exchangeのtoken responseにある`scope`を空白区切りscope setとして正規化し、必須scopeの全てが含まれるかserver-sideで比較する。field欠落、空、parse不能、必要scope不足はfail closedとし、refresh tokenを保存しない。要求scope、既存grant、incremental auth指定、refresh tokenの存在から付与scopeを推測しない。introspection APIは追加しない。

**STATUS** `RESOLVED`（検証規則）。

**IMPLEMENTATION IMPACT**  response parserはscopeの欠落・不足を明確なsafe error codeへ分類する。scope文字列、token response全体、credentialをlog/responseへ出さない。実scope追加consentはD5の個別承認を要する。

## D7 — 既存refresh tokenの切替

**QUESTION**  新しいOAuth接続を検証する途中で失敗しても、既存refresh tokenを保持するにはどうするか。

**EVIDENCE**  既存token tableのschemaは`id`、`refresh_token`、`updated_at`で、RLS有効。既存callback sourceはcode exchange後にservice-role clientでupsertする。今回token値は読み取っていない。現行schemaにはOAuth transactionとtoken置換を結び付ける状態列がない。

**DECISION**  state、expiry、one-time consume、session binding、scope、allowed channel、非空の新refresh tokenを全て確認した後だけ、DB内の単一transaction/RPCでtoken rowを置換し、OAuth transactionを成功確定する。いずれかの検証または保存前処理が失敗した場合は既存rowを変更しない。responseにrefresh tokenがない場合も既存値を空/nullで上書きしない。DB結果が不明なときにcode exchangeやtoken更新を自動再試行しない。

**STATUS** `STAGING VERIFICATION REQUIRED`。

**IMPLEMENTATION IMPACT**  transaction状態更新とtoken置換の原子性をstagingでテストする。token値のbackup/export/logを作らない。token切替を伴うproduction OAuthは別途承認が必要。

## D8 — Callback query logging / redaction

**QUESTION**  callback URLの`code`と`state` query値がSupabase hosted logsに記録されるか。

**EVIDENCE**  Supabase公式ログ資料はEdge Function/API request情報を記録対象として説明し、API log例では`request.url`にquery stringが含まれる。今回確認できた公開資料と設定metadataから、hosted callback request URLの`code`/`state` redactionが有効であるとは確認できなかった。実OAuth code/stateの発行、実logの値読出しは行っていない。

**DECISION**  redactionが実証されるまで **UNRESOLVED** とする。本番callback Deploy/OAuth開始を止める。実装側ではquery、request URL、例外、provider bodyをアプリケーションlogへ出さないが、それだけでplatform/access logの露出が解決したとは扱わない。

**STATUS** `UNRESOLVED`。

**IMPLEMENTATION IMPACT**  mock/local実装は進められる。本番前にはSupabase側で安全な設定・公式のredaction機能によってquery値が記録されないことを確認するか、query secretをplatform logへ残さない別callback transportを設計し、彩花CTOの再レビューを受ける。実OAuthを用いたログ確認は禁止のまま。

## D9 — Redirect URIの現状

**QUESTION**  live source、Google OAuth client、Supabase設定でredirect URIが一致しているか。

**EVIDENCE**  tracked callback sourceはtoken exchangeの`redirect_uri`として `https://nmkcjtrllzkwjxmjromw.supabase.co/functions/v1/youtube-oauth-callback` を固定値で使用する。今回利用可能な読み取り手段ではGoogle Cloud OAuth clientのredirect URI一覧とSupabase側の該当Auth設定を確認できなかった。ソース内の値は外部設定の現状一致を証明しない。

**DECISION**  source上のredirect URIは確認済み、Google Cloud/Supabase設定との一致は未確認とする。値を変更せず、Google consoleでの個別read-only確認をproduction OAuth/Deploy前のgateとする。

**STATUS** `UNRESOLVED`。

**IMPLEMENTATION IMPACT**  code exchangeとauthorization requestで同じ固定redirect URIを使う。実際の設定一致を確認するまでproduction OAuthは開始しない。Google CloudやSupabase設定変更は別承認が必要。

## D10 — State consumeとcode exchangeの順序

**QUESTION**  stateをGoogle code exchangeの前にconsumeしてよいか。

**EVIDENCE**  state validation後にconsumeしてから外部交換を行うと、並行/replay callbackはone-time条件付き更新で1件しか通らない。逆順では同一callbackの並行処理が複数回code exchangeへ進む余地がある。Google側一時障害のときconsume済みstateは戻せないが、新しいOAuth Startを行えば再試行できる。

**DECISION**  `state hash / transaction / expiry / binding`を検証し、DB transaction内で条件付きatomic consumeを成功させた後に限りGoogle code exchangeを行う。欠落、不一致、期限切れ、再利用ではexchangeを呼ばない。consume後のGoogle一時障害では同state/codeを再使用せず、固定safe errorを返して新しいStartから再実行する。

**STATUS** `RESOLVED`。

**IMPLEMENTATION IMPACT**  同時callback、replay、期限境界をDB/handler testで確認する。callbackは有効stateの内部詳細やGoogle error bodyを返さない。

## DB記録・秘密値方針

OAuth transactionにはraw state、authorization code、JWT、access/refresh token、email、TOTP、provider bodyを保存しない。stateのhashと必要なuser/session binding、作成/期限/consume/完了状態、固定safe result codeのみを候補とする。`auth.sessions`のhelperはsession識別子を外部応答・ログへ出さず、必要な比較だけを行う。RLS有効化だけを権限境界と見なさず、schema/table/RPCについてPUBLIC、anon、authenticatedを明示的にdenyする。

## 最終判断

**READY FOR LOCAL IMPLEMENTATION / PRODUCTION BLOCKED**

Local mock/unit実装は、Google/Supabase live接続なしで開始できる。未解決機能はinterfaceで隔離し、検査に失敗したら拒否する。staging DB/RPC実証、実Google consent、hosted callback logのredaction確認、redirect URIの外部設定照合が終わるまで、staging/productionへのOAuth実行・DB適用・Deployは行わない。この判断は別工程の実装GOや作業承認を代替しない。

## 調査時の読み取り確認

- Git branchは`main`。local HEADと`origin/main`は`bb99277ab2f5de0c58c2152c6eb34e66b0038644`で一致し、working treeはcleanだった。B2 draftは正式tracked版と一致した上でfast-forward同期した。
- Supabase catalog/privilege metadataのみ読み取った。Auth session row、OAuth token値、ユーザー識別値は読み取っていない。
- Google Cloud/Supabase OAuth設定の値変更、OAuth実行、YouTube API requestは行っていない。

## 公式資料

1. Supabase, [User sessions](https://supabase.com/docs/guides/auth/sessions) — `session_id` claimと`auth.sessions`の対応。
2. Supabase, [Sign out](https://supabase.com/docs/reference/javascript/auth-signout) — session signout/revocationとJWT expiryの扱い。
3. Supabase, [Database Functions](https://supabase.com/docs/guides/database/functions) — function privilege、`SECURITY DEFINER`とsearch pathの注意点。
4. Supabase, [API and Edge Function logs](https://supabase.com/docs/guides/platform/logs) — request/API log fieldsとEdge Function logs。
5. Google, [YouTube `videos.insert`](https://developers.google.com/youtube/v3/docs/videos/insert) — upload scope。
6. Google, [YouTube `channels.list`](https://developers.google.com/youtube/v3/docs/channels/list) — `mine=true`と返却channel。
7. Google, [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server) — token response scopeとincremental authorization。
8. Google, [YouTube OAuth scopes](https://developers.google.com/identity/protocols/oauth2/scopes#youtube) — `youtube.readonly`等。

---

**変更・実行していないもの:** Function、DB/migration/RPC、Secrets、Auth、Google Cloud/OAuth、scope/consent、YouTube API、実upload、投稿UI、TikTok、Instagram。
