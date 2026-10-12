# Version 13 録画準備・非送信調査（2026-10-12 17:11 JST更新）

本節を最新手順とする。下部は以前の撮影案の履歴であり、未確認/FALSE表記を現在の状態として使用しない。

## 実機確認
社長Windows Chrome：F5後の送信履歴に既存UNKNOWNジョブ1件。2026/10/12 16:51:56、結果不明・再送せずInboxを確認、NETWORK_RESULT_UNKNOWN。上部SANDBOX_SEND_LIMIT。状態確認ボタン未操作、新規送信・再送なし。履歴表示PASS（社長報告）。
OAuth・F5接続維持・Production URL所有権・実URL全体取得/SHA一致は既にPASS。MEDIA_DOMAIN_VERIFIED=trueは承認済み反映済み。今回1回送信承認は使用済み、Inbox受信未確認。Sandbox制限は解除しない。

## 既存ジョブの非送信調査
- D1ジョブ/予約と既存サーバーログの読み取りは可能。秘密値を取得しない。過去のHTTP 502だけでTikTok到達を断定しない。
- publish_idが保存されていないため、現行status/fetch照会は不可。「状態を確認」ボタンは押さない。
- 今回追加の診断ログは将来の承認済み実行用であり、過去の応答を復元できない。診断を発生させるための再送は禁止。
- 社長のTikTok Inbox画面を閲覧することは可能。通知なしだけで不受理と確定しない。
- 必要ならTikTokサポートへ照会。質問案：「Sandbox Inbox Uploadを2026-10-12 07:51:56 UTCに1回試行しました。自サービスは502、結果UNKNOWN、publish_id未保存、Inbox通知なしです。再送せず受理有無を確認する公式手段はありますか。」Secret/トークン/素材URL/ユーザーID/本文を添付しない。外部への問い合わせ送信は別承認。

## 最小限の録画（送信なしの第一部）
Workは社長Windowsを直接操作できない。社長がChromeの画面遷移も行う必要があるため「録画開始・停止だけで全実演を自動操作できる」とは約束しない。
約2〜3分、ブラウザ本文のみ、可能なら1920×1080、アドレスバー・個人情報・開発者ツールを含めない。
1. 録画開始。公開版トップのアプリ名と規約/Privacy/Supportを表示。
2. 既存の接続・設定画面を開き、SandboxとRuna-Girl8215のプロフィール表示を示す。解除・OAuth再認可はしない。
3. 保存済みの今回テスト下書きを閲覧し、MP4プレビュー・説明文/タグ・同意UIを示す。素材再選択・下書き保存・同意変更・URL発行・送信は行わない。
4. 送信履歴を表示。UNKNOWN1件とSANDBOX_SEND_LIMITを示す。状態確認ボタンは押さない。
5. 録画停止、MP4保存、GPTへ添付。GPTが編集・字幕・全編確認・機密マスキング・解像度/容量検査を担当。
未撮影の写真編集/登録認証/OAuth認可画面/Inbox受信を、この第一部の実演済み項目に含めない。必要な追加録画は後から不足場面だけ行う。

## 日英字幕素材（画面に対応して編集時に配置）
- FieldRise Creator Studioの一般公開版です。 / This is the public version of FieldRise Creator Studio.
- TikTok Sandboxの接続プロフィールです。user.info.basicで許可された名前とアバターを表示します。 / This is the connected Sandbox profile. user.info.basic displays the authorized name and avatar.
- 動画の説明文とタグはTikTok内で入力します。 / Video captions and hashtags are entered in TikTok.
- video.uploadは同意後のInbox引き継ぎに使用します。公開は利用者がTikTok内で行います。 / video.upload is used for consent-based Inbox handoff. The user publishes in TikTok.
- 今回の試験結果はUNKNOWNです。Inbox到着を確認できていません。再送していません。 / This test remains UNKNOWN. Inbox delivery has not been confirmed. No retry was performed.
- この録画は送信なしの第一部です。Inbox成功の実証を意味しません。 / This is the non-sending first part. It does not demonstrate successful Inbox delivery.

## 審査提出の残課題
実操作MP4未受領・未完成。Login Kit認可画面の実録画、video.uploadの実証、Inbox受信結果、Portalスコープ/説明/URLの最終照合が残る。第一部だけで提出READYとしない。新規送信/再送・接続解除・Production提出は別承認。既存UNKNOWNジョブ/冪等性キー/予約を維持。

---

## 以前の準備資料（履歴）
# 公開版 実操作録画チェックシート（2026-10-12）

## 実機証跡
社長Chrome確認：Sandbox OAuth正常復帰、connected=1、接続中Runa-Girl8215、F5後も同表示。OAuth接続維持PASS。確認手段は社長の報告であり、GPTによる直接画面確認とは区別する。トークン再取得・復号検査・期限切れ更新検証を意味しない。

## 現在の録画可能範囲
送信・解除なしで、公開版起動、規約/プライバシー/サポート、接続プロフィール、F5後の接続維持、写真編集、MP4選択、投稿準備UIを撮影できる。素材保存・アップロードを行う際は専用テスト下書きに限定し既存下書きを変更しない。手元に素材がなければ新しく架空の素材/結果を作らず、社長の権利保有画像とMP4を用意する。

## Windows操作（録画開始・停止のみ社長担当）
1. Chromeで https://fieldrise-creator-studio.wryrice16.chatgpt.site/studio を開く。
2. Windows切り取りツールに動画録画機能があれば、ブラウザ本文の領域を選ぶ。アドレスバー・ブックマーク・個人情報を含めない。1920×1080目標、文字が読める範囲を優先。
3. 「接続・設定」→Runa-Girl8215表示を約5秒→F5→表示維持を約5秒。
4. 「制作」→写真選択→サイズ/位置調整→投稿文・ハッシュタグ。既存下書きを開いて変更しない。
5. 新規の動画下書きでMP4選択を示す。実UIにある保存素材の表示を示す。現行動画選択はメタデータ検証後アップロードし、独立した動画プレビュー機能は未確認。再生を撮れていない場合「プレビュー実演済み」と説明しない。
6. 投稿同意の説明とInbox送信先を示す。送信ボタンは押さない。
7. 録画を停止しMP4を保存。送信/解除なしの第一部として提出する。GPTが受領後、再生時間・解像度・容量・全編の機密/可読性・スコープ対応を検証する。

## 字幕・説明案
「FieldRise Creator Studioの一般公開版です。」
「TikTok Sandboxで接続を検証しています。Production承認を示すものではありません。」
「user.info.basicは、許可されたプロフィール名とアバターを表示するために使用します。」
「再読み込み後もアカウント接続情報が維持されています。」
「video.uploadは、利用者の同意を得て素材をTikTok Inboxへ送るための権限です。今回の録画では送信を実行していません。」
「Inboxへの送信は公開ではありません。楽曲選択・最終編集・公開はTikTok内で利用者が行います。」
「動画の説明文・ハッシュタグはInbox APIでは渡せないため、TikTok側で入力します。」
タグ追加は固定例でありAIネット検索による自動生成とは説明しない。公式音源選択・収益発生を保証しない。

## 審査動画完成の残条件
- 認可画面→Callback→プロフィール表示を新規に録画する。現行UIは接続中でも接続開始可能。既存接続解除は不要だが、再認可を撮影する前に社長と実施を確認する。
- video.upload実使用を示すには、メディアドメイン検証と社長の個別Sandbox送信承認が必要。未送信の第一部だけで審査動画完成と判定しない。
- 現行MEDIA_DOMAIN_VERIFIED=false。設定変更・Portalドメイン検証は今回未実施。ゲートを勝手に解除しない。
- 完成動画は社長確認用。Portalアップロード・審査提出は最終承認後のみ。

## 変更保護
今回は専用GitHubブランチの報告・資料のみ更新。Sitesソース/環境変数/再デプロイなし。main、社内版、Supabase、SoundOn、YouTubeへの変更なし。録画操作はWorkからWindowsへ直接実行できないため、完成MP4受領待ち。
