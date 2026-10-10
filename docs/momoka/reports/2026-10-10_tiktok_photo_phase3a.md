# FieldRise TikTok写真投稿準備 Phase 3-A 実装報告

更新日：2026-10-10 JST

## 1. 完了状況
複数写真・共通比率・個別切り抜き・並び替え・削除・ZIP一括保存・投稿セット管理を実装。隔離テストと既存回帰PASS。実ブラウザ未検証は社長判断で進行条件外、動作保証済みとしない。Production変更・実投稿なし。

## 2. 作成・変更ファイル
追加：photo/batch.mjs、tests/test_tiktok_photo_batch.mjs、docs/momoka/reports/2026-10-10_tiktok_photo_phase3a.md。
変更：photo/index.html、style.css、page.mjs、data.mjs、README.md、tests/test_tiktok_photo_data.mjs、test_tiktok_photo_ui.mjs、latest_report.md。
photoの基準パスはautomation/sns_auto_posting/tiktok/photo/。

## 3–4. CommitとPush先
基準：c468f6fb795072b309e4b6a4217c28da15c2cb19。
Branch：feature/tiktok-photo-preparation-phase3a。
URL：https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-preparation-phase3a
Commit SHAは登録後の完了返信で提示（自身のSHAを循環記入しない）。mainへPushしない。

## 機能・制限
複数選択/ドロップ・サムネイル・個別エラー・枚数/元ファイル名・↑↓順序変更・削除。1セット最大35枚、元画像合計100 MiB、1画像20 MiB、24百万画素、各辺10000、候補70件まで、同時処理1。
JPEG/PNG/WebPシグネチャとヘッダー寸法をデコード前確認、デコード後も寸法確認。ヘッダーが先頭256 KiB内で確認できないファイルは拒否。EXIF等を含む実画像デコードは未検証。
3:4/4:3/16:9を全画像へ適用、各画像の切り抜き位置を保持。900x1200/1200x900/1600x900、白背景JPEG品質0.92。元画像非破壊。サムネイルは一覧用、個別プレビューは切り抜き後。
全画像ZIP保存は無圧縮/CRC32・追加依存なし。出力合計50 MiB上限。投稿順001〜035の重複しないファイル名。一部失敗は成功分のみZIP、エラー写真は選択して個別保存。端末へのダウンロード完了は自動確認できず、開始通知のみ。ZIP自体失敗も個別保存可能。
セットID/名前/作成更新時刻/枚数順序/画像設定/音源スナップショット/投稿文/確認状態を保存・再表示・更新・確認付き削除。画像本体は永続保存しない。再表示は元画像再選択が必要。名/容量/更新日時の照合は補助で、内容同一性を保証しない。再表示後はStudio最終音源確認をリセットする。
文章と共通比率の前回呼出し。JSON v3はsetsを含みv1/v2互換移行。追加取込は重複ID拒否。CSV投稿記録にセットID/枚数を追加。

## SoundOn保護
セットは音源根拠の保存時スナップショットを維持。マスター更新は過去記録/セットの根拠を変更しない。マスター変更・選択時は配信/最終音源チェックをリセット。
不一致は準備完了拒否、未確認の継続理由を保持。全写真未読込は準備未完了。検索/選択成功と音源識別・印税を区別。cafeの実ISRC/音源対応と印税発生は引き続き未確認、0円/確認済みにしない。

## テスト結果
写真/データ/セット28/28 PASS：Phase 1コア5、Phase 2データ8、Batch7、画面イベント8。
検証範囲：複数正常・個別拒否・枚数/容量・順序・個別削除・共通比率・個別位置・連番・ZIP・セット作成更新削除再表示・再選択・音源未確認継承/不一致拒否・JSON v1/v2/v3・CSV・不正入力。
ZIPはPython zipfileで独立読取/CRC PASS。fixtureのテキスト内容をZIP格納、実写真保存の証明ではない。
既存TikTok MP4 API9/9、YouTube画面8/8、アイコン2/2 PASS。MockのみでTikTok/Sandbox送信なし。
node --check/git diff --check/秘密値パターン検査PASS。
実ブラウザのサムネイル/実画像向き/ダウンロード/Clipboard/大量画像性能：未検証。テストはmock DOM/Image/canvasと純粋関数、実機保証としない。

## 操作数削減
設計比較：N枚の個別選択・比率指定・個別保存は3N操作。一括選択・共通比率適用・ZIP保存は3操作。10枚なら30対3（設計値、OS操作・切り抜き・並び替え・音源確認は除外）。実測秒数/実測操作数ではない。

## 安全・既存影響
画像/サムネイルはメモリ内のみ。削除・セット切替時にサムネイルObject URLを解放。大量画像処理の上限はあるが実PCメモリ負荷は未測定。connect-src none、HTML注入/CSV式対策/秘密値形式拒否維持。外部依存・有料サービス追加なし。
既存MP4 API・OAuth・Supabase認証・YouTube Gateway・Developer Portalに変更なし。Production反映なし。旧Phase 1/2のローカル保存キーを維持し、データをv3へ移行。

## 5. 未完了・ブロッカー
実ブラウザと実写真性能未検証。実音源識別・印税発生未確認。TikTok公式Content Posting APIの写真仕様は最大35枚と確認した（https://developers.tiktok.com/docs/en/content-posting-api-reference-photo-post?enter_method=left_navigation）。これはPC版Studioの実上限の保証ではない。ツール上限は35枚とし、Studio側の表示が少ない場合はそちらを優先する。公開反映と実投稿は未実施。

## 6. 次に社長が確認する事項
Production反映は別途承認。次候補はPhase 3-B：SoundOn実データ取込・楽曲別/月別比較。集計遅延と投稿因果の限界を保持。PC操作手順はphoto/README.md参照。
