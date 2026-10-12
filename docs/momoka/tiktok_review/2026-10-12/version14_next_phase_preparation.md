# Version 14後：削除安全対策・審査動画編集の準備
確認日：2026-10-12。準備資料のみ。実装・DB変更・実送信・審査提出を承認する資料ではない。

## Windows実機証跡
社長Chrome F5後、21:42:47のUNKNOWN1件表示PASS。NETWORK_RESULT_UNKNOWN、「結果不明・再送せずInboxを確認」。状態確認・送信・全削除ボタン未操作。TikTok受理/Inbox成功は未検証。

## データ削除対策の変更案
1. サーバーの登録削除処理とUIを両方保護。INITIALIZING/PROCESSING/STATUS_UNKNOWNを未解決として扱い、通常の全削除処理を直ちに実行しない。UIボタン無効化だけでは不十分。
2. 送信予約と削除受付の競合を防ぐため、所有者単位の原子的な状態遷移を設計する。単独SELECT→DELETEの順序だけで安全としない。必要なD1スキーマ/移行は別承認。
3. 送信許可はjob件数と分離し、明示的な承認を一度消費したら再登録でも復活させない。新21:42UNKNOWNを削除・復旧でリセットしない。失われた旧16:51試行は履歴資料で保持し、成功/失敗を新規に捏造しない。
4. 退会時の個人情報削除を妨げないため、通常データ削除と必要最小限の未確定試行保護を分けて検討。仮名識別子も個人情報となり得る。保持目的・期間・削除条件・利用者への説明を決め、無期限保存/無期限削除拒否は採用しない。
5. 想定テスト：UNKNOWN時の削除拒否/代替受付、他ユーザー隔離、送信と削除の競合、再登録による許可復活防止、冪等性維持、保持期限到達時の処理。全て隔離DB/モックで実施予定。現DBには適用しない。

承認依頼前に、変更ファイル・DB移行案・利用者への説明・ロールバック・保存期間を具体化する。Phase3削除対策はまだ未実装。

## 原本保全
添付原本：レコーディング 2026-10-12 212331.mp4
SHA-256：a8569ef1b3e29c800545982d2551b548b88eb7f27271ac0942149be1b2c1a2a8
222.8333秒、2548×1264、30fps、H.264/AAC、65,589,460 bytes。原本は変更しない。今回再SHA一致。
原本はVersion14で再撮影したものではない。Version14実送信成功映像として扱わない。

## 編集範囲（第一部）
原本の実画面を使用。下記時刻は既存解析に基づく概略で、編集前に境界を原寸確認する。
|場面|原本内の概略|扱い|
|---|---|---|
|トップ/Terms/Privacy/Support|0〜110秒|各画面を短く残し、長い静止/スクロールをカット|
|Studio/動画選択/保存プレビュー|110〜155秒|実際の選択・表示を残す。再生未確認なら再生実証とは言わない|
|接続プロフィール|155〜175秒|user.info.basic用途を説明、私的なChatGPT表示名はマスク|
|素材同意/URL検証|180〜210秒|「送信しない」検証とPASSの両方を残す|
|送信履歴0件|213秒以降|撮影時点の事実。現在UNKNOWN1件と混同しない。不要なら省き、削除前旧履歴を合成しない|

目標：2〜3分、1920×1080キャンバス、文字可読性優先、H.264 MP4、日英字幕。原本の縦横比を維持し余白を使用、画面を引き伸ばさない。容量目安50MB以下だがPortal最新条件を提出前に確認する。

## 日英字幕素材
- FieldRise Creator Studioの一般公開版です。 / This is the public version of FieldRise Creator Studio.
- user.info.basicで許可されたプロフィールを表示します。 / user.info.basic displays the authorized profile.
- MP4素材を選択し、投稿準備を行います。 / Users select an MP4 and prepare their content.
- 動画の説明文・タグはTikTok内で入力します。 / Video captions and hashtags are entered in TikTok.
- ここではメディアURLの取得を検証しています。TikTokへ送信していません。 / This step verifies media retrieval. It does not send content to TikTok.
- Inboxへの引き継ぎと公開投稿は別操作です。最終公開はTikTokで利用者が行います。 / Inbox handoff and publication are separate. The user publishes in TikTok.
- この第一部はInbox送信成功を実証するものではありません。 / This first part does not demonstrate successful Inbox delivery.

字幕時刻は実映像に合わせて確定。個人名・識別子・機密映り込みを全編確認。原本音声は未聴取、編集時に確認して不要音声を除去/適切に処理する。

## 完成検査と不足証拠
出力後：全編再生、文字可読性、日英内容、マスクの全フレーム継続、コーデック/時間/解像度/容量、原本と説明の一致を確認する。
不足：Login Kit認可画面の録画、video.upload送信成功、TikTok Inbox受信結果、Portal最終整合性。UNKNOWNを成功として字幕化しない。第一部完成とProduction提出READYを分ける。

## 実行状態
本資料準備のみ。編集版MP4/SRT未出力。コード/DB/環境/公開版変更なし。実送信・状態照会・審査提出なし。
