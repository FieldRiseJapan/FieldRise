# TikTok Production最終準備 Phase 2 — 2026-10-12
対象：FieldRise Creator Studio / feature/tiktok-public-inbox-20261011
判定：BLOCKED（第一部最終編集は完了。API成功実証・削除安全対策・Portal最終確認は未完了）。
確認日：2026年10月12日 JST。今回の調査・編集のみ。送信・再送・状態確認API・削除・認証変更・環境変更・デプロイ・審査提出なし。

## 1. 第一部最終版・品質
既存編集版を再利用し、接続プロフィール（46–50秒）、履歴を含む101–111秒、最終履歴111–123秒だけ拡大。その他のカット、順序、日英字幕、結果は維持。旧編集版・新旧録画原本は保管。
- fieldrise_v14_review_part1_final.mp4：123秒、2542×1440、30fps、H.264/yuv420p、2,987,288 bytes。無音・焼き込み日英字幕。
- MP4 SHA-256：2a9dad5e2903d5622965dba9610d6d81fa30b83a3f00bfd7e77efb292fedbc38
- fieldrise_v14_review_part1_final.srt SHA-256：fce0ab04b0f95b64b17cddfb863729640ac3172f64a6a2913879158dfa0018bf
- 全編デコードPASS。拡大プロフィール、履歴、最終静止画の可読性・字幕領域・マスクを目視確認。前工程の未変更場面の検査を再利用。全フレームの人手監査とは区別する。
- プロフィールの非公開名・内部ID、ファイルダイアログ個人フォルダー、タスクバーをマスク/除去。拡大処理はマスク済み映像に対して実施し、隠した領域を再露出しない。
- SANDBOX_SEND_LIMIT、UNKNOWN、無効な送信ボタンは元の状態。最後の実画面10秒静止も維持。送信成功を演出しない。
- user.info.basic字幕は4秒表示のため短め。字幕ファイルと一時停止で補助できるが、今後OAuth録画追加時にはプロフィールを8秒以上確保すると読みやすい（編集上の推奨、公式秒数要件ではない）。

## 2. 公式要件チェックリスト
以下公式URLを2026-10-12に取得確認。
|事項|公式根拠|現状|
|---|---|---|
|各製品・scopeの最新end-to-end実操作動画|App Review Guidelines|第一部のみ。認可・送信/受信が不足|
|未承認アプリはSandboxで実演|App Review Guidelines|接続済みSandbox映像あり、全経路は不足|
|最大5動画・各50MB以下|App Review Guidelines|最終版約2.99MB、容量適合|
|明瞭なUIとユーザー操作・申請サイトと同じドメイン|App Review Guidelines|重要場面拡大。PortalのサイトURLは現行未確認|
|私的/個人専用・開発/試験中のアプリを承認しない|App Review Guidelines|素材準備は公開、Inboxは検証中。文章変更のみで解消しない|
|外向けの完成したWebサイト、見えるTerms/Privacyリンク|App Review Guidelines|第一部に公開ページあり。アクセス条件/実ユーザー利用の最終確認が必要|
|HTTPSの静的redirect URI・state照合・安全なtoken管理|Login Kit Web|コード/既存成功記録あり。Production PortalのURI未確認|
|表示名・avatar等はuser.info.basicで取得可|Get User Info|プロフィール実映像あり|
|video.uploadでInbox初期化、利用者は通知から最終編集/公開|Upload reference|成功応答/publish_id/Inbox通知の証拠なし|
|PULL_FROM_URLのドメイン/URL prefix所有権|Upload reference / Register Your App|URL所有権PASSは既存確定証跡。送信成功と区別|
MP4推奨・2–3分・1080p・日英字幕は今回の制作方針。取得したApp Review Guidelinesには拡張子・長さ・解像度の固定指定が見当たらない。Portal実アップロード欄の受理形式は未確認。
「OAuth認可画面単独の動画」「Inboxスクリーンショット単独」を名指しした必須要件とは区別する。全scopeのend-to-end実証を満たすため、当該場面を追加するのが妥当という評価。
user.info.basic取得にDisplay API製品の追加申請が必要かはPortalの製品構成で確認する。今回はscope/製品変更なし。

公式URL：
- https://developers.tiktok.com/docs/en/app-review-guidelines
- https://developers.tiktok.com/docs/en/login-kit-web
- https://developers.tiktok.com/docs/en/tiktok-api-v2-get-user-info
- https://developers.tiktok.com/docs/en/content-posting-api-reference-upload-video
- https://developers.tiktok.com/docs/en/getting-started-create-an-app
- https://developers.tiktok.com/docs/en/content-sharing-guidelines
Direct Post固有基準をInboxへ一律転用しない。一方、App Reviewのアプリ全体の私的利用・未完成制限はInboxにも残る。

## 3. 取得済み／不足証拠
|証拠|区分|限界|
|---|---|---|
|Sandbox OAuth成功・F5接続維持|社長実機報告＋正式記録|認可開始～復帰の連続動画は未取得|
|Runa-Girl8215プロフィール|新録画・第一部で確認|OAuth認可実演と同義ではない|
|URL所有権・全体取得SHA一致|既存正式記録/社長確認PASS|API受理/Inbox到着の証明ではない|
|21:42:47 UNKNOWN履歴|新録画・正式記録で確認|成功/失敗を確定できない|
|16:51 UNKNOWN|過去正式記録|20:52削除で旧ジョブ消失。復旧なし|
|TikTok成功応答/publish_id|既存正式記録に成功証拠なし|21:42記録はpublish_idなし。今回ライブD1再照会はしていない|
|Inbox通知/受信|未取得|過去社長報告は通知なし。受理失敗とは断定しない|
|写真Inboxの実成功|未取得|写真準備とTikTok公式Studioの写真実演をAPI証拠へ流用しない|
既存正式報告を読み取り確認。今回は新規API・ログの秘密値取得・状態APIなし。旧ログの保存範囲限界とUNKNOWNを維持。

## 4. OAuth追加撮影
必要性：第一部に認可画面・Callback操作がないため、追加の短い実操作録画が推奨。
現在は再認証禁止。今すぐ操作を依頼しない。別途再認証・撮影承認後の最短手順：
1. Windows録画開始。公開版の接続画面を表示。
2. 正規の「TikTokに接続」→Sandboxアプリ名/対象アカウント/2scopeの同意画面を記録。Secretや認証入力、アドレスバー全体は収録しない。
3. 許可→Creator Studioのプロフィールへ復帰し8秒表示。録画停止・MP4保存。
接続解除・登録削除は不要。ただし現接続が置き換わる可能性とstate/保存の外部変更を伴うため、承認なしで開始しない。社長のパスワード・code・tokenは共有不要。送信ボタンは操作しない。

## 5. UNKNOWN/削除/重複防止の安全性評価（設計のみ）
確認コード：apps/tiktok-public/lib/server.ts（GitHub blob 425dfc803f95b5866fc2a8876573b9ecfa18e196）。
- removeAccountはprofiles.deleting=1、R2削除、leases/states/connections/jobs/drafts/assets/profiles削除。jobs/leases削除に未解決状態の保護条件がなく、登録後jobs件数0でSandbox1回ゲートが復活する。単なる可能性ではなくコード上の条件。
- 同一owner/request_keyの冪等性と送信受付INSERTの未解決job条件は保護として存在。しかし削除で消失する。ownerだけで判定するため別ユーザー・同じTikTokアカウントに跨る送信制限も要設計。
- profiles.deletingと送信INSERTを同じ原子的条件に含めておらず、削除と送信、削除とR2保存の競合が残る。新規送信をして確認していない。
- URL期限切れだけで結果UNKNOWNや許可消費を解消しない。publish_idなしの状態APIは適切な照会ができず、無理に補完しない。

修正案（未実装、DB適用なし）：
1. 一度使う承認はjobs件数から独立したサーバー台帳で管理。対象Sandbox/アカウント/素材digest/回数/期限/承認者を限定し、送信予約と同一原子操作で消費。再登録・別request_keyで再発行しない。
2. 所有者削除状態、アカウント単位の未確定試行、承認残数、冪等性を原子的に照合して予約。DBの複数逐次SELECTだけでは不十分。
3. UNKNOWN試行の最小仮名台帳と通常個人データを分離。token/素材/表示名を削除する権利を守り、残す記録の目的・保存期間・消去条件をPrivacyへ明示。仮名情報も個人情報になり得る。
4. 未確定状態で無期限の削除拒否を行わず、代替の削除受付と運用解決手順を用意。保存期間は根拠なしに固定しない。保持方針決定と承認が先。
5. レース試験：同時送信、送信/削除、再登録、別ユーザー同TikTok、UNKNOWN、期限切れ、台帳消費後の通信不明。すべて隔離DB/模擬通信、公開データ変更なし。
現21:42ジョブ・冪等性・予約を変更する提案ではない。旧16:51を復元・再作成しない。新規送信の安全性未確定。

## 6. Production差分・修正案
今回Portalはログイン画面へ遷移し、現行設定は未確認。10/11の正式報告上はDraft、Login Kit/Content Posting API、user.info.basic/video.upload/video.publish、Direct Post有効、旧GitHub/Supabase URLs。過去情報を現在値と扱わない。
Sitesメタデータ：Version14/public/指定URLを確認。現在のソースSHAは前工程のb51be93f4bbd75877062530a49823c7243f02fc5記録を引用し、新規全件照合はしていない。
|項目|候補／修正案|現行Portal|
|---|---|---|
|App名|FieldRise Creator Studio|未確認|
|Website|https://fieldrise-creator-studio.wryrice16.chatgpt.site/（サービス説明ページ）|未確認、過去は旧URL|
|Redirect URI|https://fieldrise-creator-studio.wryrice16.chatgpt.site/api/tiktok/callback|未確認、過去は旧Supabase|
|Terms|同origin /terms|未確認|
|Privacy|同origin /privacy|未確認|
|Support|同origin /support|未確認。独立必須欄の有無も未確認|
|Scopes|user.info.basic/video.upload候補、video.publishは不要|未確認、過去は3scope|
|製品|Login Kit＋Content Posting API Upload候補|未確認|
|動画|第一部最終版＋不足場面追加後|未確認。第一部だけで置換しない|
|環境|Sandbox実演とProduction申請を区別|新Sandbox資格情報をProductionへコピーしない|

コード/公開文面の不足：
- Supportには「URL検証未完了」の古い表現あり。URL検証PASS／Inbox結果UNKNOWNへ更新する案。今回Webコード変更なし。
- 規約は通常1日5回上限だが、現在Sandboxの個別1回ゲートがある。環境/承認別制限を説明する案。
- Privacyは登録削除で送信履歴も消去すると説明。台帳を導入する場合は実装と保持方針に合わせ変更する必要。
- 投稿準備サービスは実在するが、公開TikTok経路は未完成。広い一般利用者向けの機能・2ユーザー実機隔離・写真経路の実証が不足。一般公開の文字だけで審査適合とはしない。

### 日本語説明草案（未提出・現在の事実）
FieldRise Creator Studioは、外部のクリエイター向けに写真・MP4の準備と利用者ごとの下書き保存を提供するWebサービスです。利用者はChatGPTでサインインします。Login KitでTikTokを接続し、user.info.basicの表示名・アバターで対象アカウントを確認します。video.uploadによるInbox引き継ぎを実装していますが、現在のSandbox送信試行は結果不明で、成功・受信の実証は未完了です。第一部動画はプロフィール・素材準備・送信制限・UNKNOWN履歴を示します。動画の説明文・ハッシュタグはTikTok内で入力し、音源選択・最終編集・公開は利用者がTikTok内で行います。Direct Postや自動公開、自動音源ID指定は提供しません。全経路の安全性と成功実証完了後、最終申請文を確定します。

### English draft (not for submission yet)
FieldRise Creator Studio provides media preparation and user-specific drafts for external creators. Users sign in with ChatGPT and connect TikTok through Login Kit. We use user.info.basic to display the connected account's name and avatar. The video.upload Inbox integration is implemented, but the Sandbox attempts currently have unknown outcomes; successful delivery and Inbox receipt have not been demonstrated. Part 1 shows the profile, media preparation, send restrictions and UNKNOWN history. Video captions and hashtags are entered in TikTok. Users select an available sound, complete editing and publish in TikTok. We do not offer Direct Post, automatic publication or automatic sound-ID selection. We will finalize submission claims only after safe end-to-end verification.
写真Inboxを実使用済みと記述しない。公開版準備機能とAPI実証を分ける。

## 7. 残作業・実行順
1. Portal既存申請の読み取り確認（ログインが必要）。旧記録との差分確定。
2. 削除安全対策の具体的な設計/保持方針確定→限定実装承認→隔離検証→デプロイ承認。既存UNKNOWN保持。
3. OAuth追加録画は別承認後。既存映像があれば新規再認証より優先。
4. TikTokへ既に到達した可能性を残したまま、診断/公式サポート等の安全な解決方針を判断。再送・状態APIは承認なしに使わない。
5. 成功・Inbox受信の実証は別の安全な承認計画が必要。Phase1通信修正/Version14公開だけで成功としない。
6. 写真を申請説明へ含めるなら写真経路の安全な実証も必要。不要機能/スコープ変更は別承認。
7. 動画追補・最終申請文/Portal差分修正の承認→最終提出承認→受付証跡。今回は未提出。

## 8. 社長が次に行う最小限の操作／承認
今すぐ送信・状態確認・全削除・再認証する必要はない。まず最終MP4をご確認いただく。
Portal現行値の確認にはDeveloper Portalへログインし、App details / Products / Scopes / App reviewを保存せず確認。Secret欄・Callback全体・認証情報を含む画像は共有しない。
別承認事項：削除安全対策実装/保持方針/DB移行・公開反映、OAuth追加撮影に伴う再認証、過去UNKNOWNの安全な調査/実証方法、Portal設定差分の保存とscope削除、最終Production提出。これらは今回未承認。
