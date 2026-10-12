# 一般公開版OAuth成功・デモ撮影準備（2026-10-12）

既存2026-10-11資料は旧社内版調査の履歴として保存する。本資料を現行一般公開版の補足とし、旧版のDirect Post、Creator Info、社内専用説明を公開版の申請に流用しない。

## 確認状況
- 社長Chrome実機確認：Sandbox OAuth、Runa-Girl8215接続表示、Callback正常復帰、connected=1。送信・公開未実施。
- 現行スコープ候補：user.info.basic、video.upload。video.publishなし。
- User Infoのopen_id/display_name/avatar_url取得後、所有者に結びつけたAES-GCM暗号化を行いD1保存する。暗号化保存完了後だけ成功へリダイレクト。表示はD1から取得する。Secret・トークン値は検査・資料化しない。
- 別セッション/再読み込み永続化は未確認。ChromeでF5→接続表示維持を確認する。解除不要。

## 接続解除・再接続（承認待ちの手順）
1. 社長の明示承認後のみ、現在の接続表示を確認して接続解除を1回行う。
2. 再読み込み後に未接続表示となることを確認する。
3. 新しい接続開始→TikTok許可画面→basic/uploadを許可→正常復帰→接続表示確認。
4. 再読み込みで表示が維持されることを確認する。
現行disconnectはローカルD1のconnections行削除であり、TikTok側の認可取消APIは呼ばない。「TikTok側の権限を取り消した」と説明しない。TikTok側の取消は別操作・別検証。現在の接続は維持し、手順のみ整備。

## 公開版の撮影台本
PCの実画面を1920×1080を目標に録画。WorkからWindowsデスクトップ/切り取りツールの直接操作・録画はできないため、社長が開始/停止を担当する方式。機密を含むアドレスバー、Network、Cookie、Secret/DB画面は収録しない。完成MP4は全編再生して文字可読性・マスクを確認する。提出条件は実Portalで再確認、従来の50MB以下目安を守る。

|場面|実操作|状態|
|---|---|---|
|1|公開版URL・アプリ名・規約/プライバシー/サポート・ユーザー認証|録画未実施|
|2|登録同意・接続画面・Sandboxの明示|録画未実施|
|3|Login Kit認証・basic/upload許可・Callback正常復帰|実機成功、録画未実施。接続中のため再接続撮影は承認後|
|4|接続プロフィール表示・F5後の維持|初回表示成功、F5未確認|
|5|写真編集/投稿準備、MP4選択/プレビュー、下書き、同意UI|実画面で確認してから撮影。送信ボタンは押さない|
|6|Inbox送信とAPI結果|未実演。Sandbox送信承認と必要なメディアドメイン検証後のみ。未実演のまま成功動画を作らない|
|7|Inboxは公開完了ではなくTikTok内で最終編集・公開することを説明|TikTok側編集・SoundOn音源選択は今回未検証|

## 申請説明文（日英草案）
日本語：FieldRise Creator Studioは、外部利用者が自身のアカウントで写真・動画素材を準備し、TikTokアカウントへ接続するWebサービスです。Login Kitとuser.info.basicにより利用者が許可したプロフィールを表示します。video.uploadは利用者の明示同意後に素材をTikTok Inboxへ送るために使用します。最終編集・公開はTikTok上で利用者が行います。Direct Postは今回の申請対象に含めません。

English: FieldRise Creator Studio is a web service where external users prepare photo and video assets and connect their own TikTok account. Login Kit and user.info.basic are used to display the profile authorized by the user. video.upload is intended to send prepared media to the user's TikTok inbox after explicit consent. Final editing and publication take place in TikTok and remain under the user's control. Direct Post is not included in this application.

上記は提出前草案。OAuthはSandbox実機成功、Inboxはコード実装のみで実送信未確認。一般公開アクセス・外部ユーザー登録・隔離・媒体送信等の実検証結果とPortal選択を確認してから提出文を確定する。送信済み・Production成功とは記載しない。

## 未完了事項
- Chrome再読み込みで接続情報維持確認
- 承認後の接続解除/再接続と撮影
- Sandbox送信の別承認、メディアドメイン検証、Inbox実応答
- 実操作デモ動画の録画・編集・品質確認
- 公開版申請説明とPortal製品/スコープの最終照合
- 社長最終承認後のProduction審査提出
