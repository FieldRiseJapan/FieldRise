# YouTube既存バックエンド読み取り専用監査

監査日: 2026-09-25（JST）、2026-09-26（JST）再確認  
対象: FieldRise YouTube Creator Studio / Supabase本番プロジェクト  
監査方法: GitHubの[安全認証ゲートウェイ設計 v1](../designs/youtube_secure_upload_gateway_v1.md)を先に確認し、Supabaseのデプロイ済みEdge Function一覧・ソース・テーブルメタデータ・権限・RLSポリシーを読み取り専用で確認。関数の実行、DB行内容やSecret値の照会、ログ値の取得、実アップロードは行っていない。

## 1. 監査対象と役割

| 対象 | 稼働状態・設定 | 現行の役割 |
|---|---|---|
| `youtube-upload` | ACTIVE、version 6、`verify_jwt=false` | 共有Secretを照合し、保存済みrefresh tokenからGoogle access tokenを発行してYouTubeへresumable upload。 |
| `youtube-oauth-callback` | ACTIVE、version 7、`verify_jwt=false` | Googleのauthorization codeを交換し、取得したrefresh tokenをDBへupsert。 |
| YouTube token関連の追加Function | デプロイ済み一覧に該当なし | tokenの更新専用Functionは存在しない。upload自身が毎回access tokenを取得する。 |
| `public.youtube_oauth_tokens` | RLS有効、行数は今回未照会、列は`id bigint`（PK）、`refresh_token text`、`updated_at timestamptz` | refresh tokenのサーバー側保管。access token列なし。値は一切閲覧していない。 |

2026-09-26の再確認でも、2関数は同じversion、`verify_jwt`設定、ソースSHAであり、YouTube token関連の追加Functionは一覧にない。行データ・Secret値・実ログは確認していない。今回の列挙対象以外のSNS Functionは監査・変更していない。確認したデプロイ済みソースは各Functionの`index.ts` 1ファイル。リポジトリ内の推定実装ではなく、Supabaseから取得した稼働版に基づく。

## 2. 現行の認証境界・CORS・外部直接呼出し

- **upload**: プラットフォームの`verify_jwt=false`。`POST`のみを受理し、`Deno.env.get("YOUTUBE_UPLOAD_SECRET")`とリクエストヘッダー`x-fieldrise-upload-secret`を文字列の厳密一致（`!==`）で比較。欠落・不一致は401、サーバー側設定欠落は500。暗号学的な定数時間比較はなく、Secret所持以外にユーザー認証・JWT署名検証・単一ユーザーallowlist・匿名拒否・AAL2検証はない。
- **callback**: プラットフォームの`verify_jwt=false`。受信`code`をGoogleへ交換するが、受信`state`の照合、開始側セッションとの紐付け、本人・許可チャンネル確認はソース内にない。HTTP methodも限定していない。OAuth開始側の実装・Google Consoleの登録設定は今回の2関数には含まれず、検証できていない。
- **CORS**: いずれのデプロイ済みソースにも`Access-Control-Allow-*`ヘッダー、Origin allowlist、OPTIONS処理はない。`youtube-upload`のOPTIONSは405。ブラウザからのカスタムヘッダー付きcross-origin呼出しは通常preflightで止まるが、CORSはサーバーへの直接HTTP呼出しの認可ではない。
- **直接呼べる条件**: 公開Function URLへ外部クライアントがPOSTし、現在の共有Secretの値を正しくヘッダーに指定すれば、現行コードではJWT、ユーザーID、AAL、Originの確認なしにupload処理へ進める。Secret値は取得・表示していない。ブラウザへこのSecretを配る構成は禁止。Secret値が未知でも関数URLへのリクエスト自体は到達し、認証失敗を返す。実際のリクエスト試験はしていない。

## 3. 秘密情報・token・service roleの流れ

| 名称（値は非取得） | 参照・利用箇所 |
|---|---|
| `YOUTUBE_UPLOAD_SECRET` | uploadが環境変数から取得し、`x-fieldrise-upload-secret`と比較。 |
| `YOUTUBE_CLIENT_ID` / `YOUTUBE_CLIENT_SECRET` | callbackのauthorization-code交換とuploadのrefresh-token交換でGoogle token endpointへ送付。 |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | 両Functionでserver-side Supabase clientを作成。callbackはtokenのupsert、uploadはtokenのselectに使用。ブラウザへの返却はなし。 |
| Google refresh token | callbackがGoogle応答から取り出し、`public.youtube_oauth_tokens`の`id=1`にupsert。uploadがservice-role clientで同じ行の`refresh_token`だけを読み出す。列の型は`text`。アプリケーション層の暗号化・鍵管理はソースから確認できず、DB側の暗号化状態も今回未検証。 |
| Google access token | uploadが保存済みrefresh tokenをGoogleへ送ってその都度取得し、YouTube upload開始リクエストのBearerとして利用。DBへの保存はなし。refresh応答に新しいrefresh tokenが含まれた場合の保存処理はない。 |

テーブルのACLは`postgres`と`service_role`のみで、`anon`/`authenticated`へのテーブル権限は確認されなかった。RLSは有効、専用ポリシーは0件、`FORCE ROW LEVEL SECURITY`は無効。service roleはRLSを迂回できるため、DB権限とサーバー側key管理が重要。Secret設定の**値・存在の実効性**、Google側の実チャンネル紐付けは照会していない（ソースから分かるのは環境変数名と失敗時の分岐まで）。

## 4. uploadの入力検証・公開範囲・応答

- `video`について`File`型だけを確認。空ファイル、拡張子、MP4 container signature、MIME、サイズ、multipart全体の上限、余分なpartや同名partの重複、Content-Lengthの正当性は検証しない。`req.formData()`で受信後にパースするため、本文サイズを読み込み前・読み込み中に制限しない。
- `title`は文字列かつtrim後に非空なら先頭100文字、さもなくばテスト用の固定タイトル。`description`は文字列なら先頭5000文字、さもなくば固定文。超過はエラーにせず切り捨てる。descriptionのUTF-8バイト数や`<`/`>`、未知のpartは検証しない。空titleも投稿可能。
- YouTubeへ送るmetadataの`status.privacyStatus`は**サーバー側リテラル`"private"`固定**。入力からprivacyを読まず、`notifySubscribers=false`でresumable uploadを開始する。upload成功応答は`success`、固定`message`、`videoId`（結果IDまたはnull）、固定`privacyStatus: "private"`のみで、Google tokenやraw provider応答は返さない。
- rate limit、同時投稿制限、idempotency key、永続化した投稿状態、結果不明時の照合はない。timeout・再送・成功直後の応答喪失で重複投稿の恐れがある。

## 5. エラー・ログと漏えいリスク

- 通常の認証失敗・設定不足・DB token取得失敗・Google token交換失敗では、コード上は汎用文言を返す。token/Secret値そのものを直接ログ出力・成功応答に埋め込む処理は見当たらない。
- upload開始・本体転送に失敗すると、**Googleのraw error responseの先頭500文字をログ出力**する。providerのerror本文がcredential、アップロードURL、個人情報等を含む場合の漏えい可能性がある。ブラウザ応答は汎用エラーとGoogle HTTP status（数値）。
- 両Functionのcatchは例外の`err.message`を加工せずログ出力するため、内部ライブラリや外部通信由来の文字列に機微情報が含まれた場合の漏えい可能性がある。Googleへのredirect URIはcallbackソース内で固定。成功応答とエラー応答には`Cache-Control: no-store`の明示がない。
- 実ログの値は取得しておらず、過去に漏えいがあったとは判断できない。ログ閲覧権限・保持期間・監視設定は今回未検証。

## 6. 共有module化とgatewayへ再利用できる処理

現行uploadは1ファイルで認証、token取得、Google refresh、入力パース、YouTube upload、HTTP応答を順に処理する。**抽出可能**な核は「service-roleによるrefresh token取得 → Google access token更新 → metadata生成（private固定） → resumable upload開始と動画転送 → video ID取得」。ただし抽出時はtoken読み出し権限を必要最小限にし、HTTP Request/Responseや既存共有Secret照合をモジュール内部へ持ち込まない。

そのまま再利用できるのは、private固定とresumable uploadの基本的な通信手順という設計要素に限る。入力検証、AAL2認可、ログのredaction、rate limit、idempotency、outcome_unknown管理、timeouts、response契約をgatewayで設計・テストする必要がある。callback側のOAuth `state`照合と許可チャンネル結び付けも別の安全性課題。**今回コード抽出・修正・デプロイは行っていない**。

## 7. 修正が必要な箇所・セキュリティ上のブロッカー

1. **旧uploadの直接経路**: `verify_jwt=false`で共有Secret単独認可。ブラウザにSecretを渡してはならず、新gatewayが安全でも旧Functionが存続すればSecret流出時の直接投稿経路が残る。旧関数の廃止/閉鎖/移行を含む計画が必要。
2. **callbackの認可結合**: `state`検証・OAuth開始時の本人との結び付け・チャンネル同一性の確認がコードにない。第三者のauthorization codeによるtoken差し替え可能性を安全試験で評価し、対策するまで再認可の運用を慎重に扱う。
3. **投稿制御と入力制限**: JWT検証、単一user-id allowlist、匿名拒否、AAL2、厳格な入力検証、streamのsize上限、冪等化、rate limitが未実装。50 MiBは未確定で、実測していない。
4. **ログ**: Google raw error本文と例外messageの記録をredact/限定されたerror codeへ変更し、ログ保持・権限を確認する。
5. **保存**: refresh tokenはDBの`text`列に保存され、アプリケーション層の暗号化は見当たらない。鍵管理・バックアップ・service-role権限・トークン更新失敗時の運用を確認する。公開スキーマ上のRLSとACLは現状を維持したうえで、将来のprivate schemaへの移行を検討する。
6. **CORS**: 新gatewayはGitHub Pagesの許可Originだけを応答し、preflightを適切に処理。ただしCORS単独を認証境界にせず、D2の「当面GitHub Pages」を前提にJWTとserver-side認可を必須にする。GitHub Pagesの同一Origin内の別pathをCORSだけで区別できない。
7. **その他**: MIME/content検証、streamingによるメモリ使用量、実行時間、timeout、YouTube quota、Google応答status/欠落ID処理、投稿結果の永続化は未検証。

## 8. 彩花CTOが次に判断すべき事項

- D1–D3の確定方針（ブラウザのSupabase Auth user JWT許可、GitHub Pages継続、Email OTP + TOTP/AAL2・単一恒久ユーザーallowlist）をgatewayの受入条件へ落とし込む。許可UUIDをGitHubへ記載せず、server-sideのみで保持する。
- 共有module化の際、旧`youtube-upload`の直接経路を**いつ・どう閉じるか**、既存private uploadの運用をどう移行するかを決める。
- callbackの`state`/本人・チャンネル検証の修正要否と、保存済みtokenの取り扱いをレビューする。
- 暫定サイズ50 MiBを確定せず、許可済みの将来の安全な試験で動画サイズ、メモリ、実行時間、timeoutを測る計画を承認する。
- 新gateway設計にはauth/認可、厳格な入力、冪等性、rate limit、ログredaction、結果不明時の照合を含める。投稿ボタン有効化と実アップロードは別の判断とする。

## 作業範囲の確認

Supabase・OAuth・Auth・Secret・DB・RLS・Edge Function・SNS連携・既存GitHub実装コードは一切変更していない。実投稿なし。**本報告書1ファイルのみをmainへ反映する監査**であり、gateway実装は行わない。
