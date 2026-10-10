# TikTok写真 ZIP出力安全分離改修報告

2026-10-10 / GPT桃花 / 開発ブランチ `feature/tiktok-photo-global-english`

## 判定

**ZIP保存機能：Windows実機検証PASS（社長確認）。Creator Studio全体：Production反映不可（CONDITIONAL）**。2026-10-10、検証対象Commit `bb4eb678e1df383fa34429d79d9272232317c945` のJPG3枚・3:4出力を再検証済み。社長実機でZIPが止まった直接原因は未確定であり、原因特定完了とは報告しない。

## 原因調査と再現範囲

開始時はWorking Tree clean、最新HEAD `ae9d5b25b45b9bd976a238f90f26cc93da771a5b`。巻き戻しなし。

`downloadAll.onclick` → decode → paint → canvasBlob → zip → download を追跡した。ZIPハンドラは `check` / `preflight` / `recordInput` を生成前に呼ばず、投稿文・SoundOn未確認による出力停止条件は存在しない。HTML上でもZIPボタンは楽曲登録フォーム外だった。

実機で見えた「投稿前確認が必要です。不一致は準備完了にできません」は `recordInput` のエラー文であり、投稿記録操作から出る。ZIPへのガード誤適用と断定する証拠はない。

確定した問題は、ZIPボタンが共有 `busy` 中に無通知でreturnし、以前の通知が残ること、変換中も通知が更新されないこと、変換が全件失敗しても旧処理が成功分のみZIPの通知を出すこと。これらは動作・通知上の不具合である。以前の実機停止が処理中return、異なる操作経路、ダウンロード制限、非同期処理停滞のどれかは未確定。今回の再検証成功は、以前の直接原因の完全特定を意味しない。

## 修正

- STEP 4にZIP専用ライブ通知を追加。画像素材の書き出しと投稿準備承認の違いを明記。
- 処理中クリックは待機通知。実行時はロックと無効化を維持し、画像変換・ZIP生成・ダウンロード開始を表示。
- 画像設定・元画像・既存形式／容量制限を検証。1枚でも変換失敗なら不完全ZIPを成功として渡さない。失敗写真を連番で案内し、個別保存・再選択による再試行を提示。
- ZIP生成例外とダウンロード開始例外を区別。内部例外文を画面に公開しない。finallyでロック解除。
- ダウンロードリンクをDOMへ追加してクリック後に除去。保存開始はOS保存完了の保証ではない。
- ZIP生成前の音源・投稿文ガードは追加しない。完了後に独立した投稿前判定を表示。ZIPで投稿セットや楽曲を書き換えない。
- ビジネス音源利用が未確認なら新たな準備完了判定をfalseにする。未知の状態を確認済みへ変更せず、既存JSONスキーマ・保存内容は変更しない。社長判断理由による準備継続と準備完了は別扱い。

## 検証

| 対象 | 結果・範囲 |
|---|---|
| Node | 83/83 PASS、FAIL 0、SKIP 0。写真関連74、YouTube画面8、MP4 APIラッパー1（内部9 Mockケース） |
| Python | 7/7 PASS、FAIL 0、SKIP 0。実画像fixture3、起動・診断2、アイコン2 |
| Linux HTTP診断 | 17/17 PASS。CSP、外部通信なし、既知Secretパターン、MIME、参照、構文 |
| Git差分 | whitespace検査PASS |
| 音源・ビジネス未確認／投稿文空欄／チェック未完了 | Mock DOMで3枚のZIP保存開始、準備未完了、storage完全一致 |
| 画像0枚 | 元画像選択の警告、ダウンロードなし |
| 3枚 3:4 | Mock canvasの各900×1200設定を検査（実JPEG変換ではない） |
| 連続クリック | Mockでダウンロード1回、状態破壊なし |
| JPEG変換エラー | 成功通知なし、個別保存案内、ロック解除 |
| ZIP生成／ダウンロード開始例外 | 区別表示、内部例外非表示、元storage保持 |
| 画像枚数・容量・異サイズ・比率・並べ替え | 既存batch／crop／UI回帰PASS |
| EXIF付きJPEG | 実ファイルのOrientation=6とヘッダー受付PASS。ブラウザでの方向補正結果はNOT TESTED |
| 保存セット／旧JSON／競合・失敗保護 | 既存回帰PASS。スキーマv6・v1～v6読込維持 |

実ZIP検証はPillowで作った正常JPEGをアプリの依存なしZIP生成器へ渡し、Python標準zipfileで展開・CRC・元bytes一致・全画像decodeを検査した。3枚すべて900×1200、連番001～003、順序・破損なしを確認。既存の3:4／4:3／16:9混在JPEG検査も維持。**これはブラウザcanvas変換の検証ではない。**

paintは白背景、品質0.92でcanvas再エンコードする既存実装を維持。元ファイルは変更せず、入力EXIFバイトをZIPへコピーしない。今回のJPG3枚の正常表示とWindows標準ZIP展開は社長実機確認PASS。EXIF方向補正、位置情報非残存、切り抜き位置の厳密一致、画質評価、他形式のブラウザ変換はNOT TESTED。

## 既存データ保護

社長報告の保存セット10件は保護対象。社長PC／Chrome localStorageへアクセス・初期化・削除・統合・再採番は一切していない。ZIP経路は保存関数を呼ばない。Mockで実行前後の保存JSONが完全一致。実際の10件を当環境で照合したとは報告しない。社長実機で10件の一覧・ID維持を確認済み。全フィールド、写真メタデータ・音源根拠の完全一致は未検証。

## 変更ファイル

- automation/sns_auto_posting/tiktok/photo/page.mjs
- automation/sns_auto_posting/tiktok/photo/index.html
- automation/sns_auto_posting/tiktok/photo/data.mjs
- automation/sns_auto_posting/tiktok/photo/tools/local_tool.py
- tests/test_tiktok_photo_ui.mjs
- tests/test_tiktok_photo_data.mjs
- tests/test_tiktok_photo_real_fixtures.py
- docs/tiktok-photo/release_diagnostics.json
- docs/tiktok-photo/windows_validation.md
- docs/momoka/reports/tiktok_photo_zip_export_safety.md
- docs/momoka/reports/latest_report.md

## GitHub

実装Commit: `083c8b31c992430a3bf525f2cd4bb46dcf078682`（GitHubブランチへ反映・fetchで確認済み）。正式報告は後続Commitに保存する。最終HEADは最新報告へのGit履歴または最終回答で確認。

Push先: https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-global-english

## 社長の一括確認

`docs/tiktok-photo/windows_validation.md` の「ZIP安全分離改修のWindows再検証」を実施する。3枚・3:4・投稿文空・音源未確認で出力し、Chrome履歴、Windows展開、全3枚の900×1200・向き・切り抜き・正常表示、準備未完了と保存10件維持を確認する。FAIL時はZIP専用表示を記録し、データ初期化を行わない。

担当によるWindows直接操作は未実施。今回の社長確認で限定したZIP出力の実機条件は達成したが、元の直接原因、EXIF、音源・投稿安全性などは未確認のまま。Production変更・Pages設定変更・main反映・TikTok／YouTube実投稿・課金・画像外部送信なし。公開は別途承認が必要。


## 社長Windows実機再検証記録（2026-10-10）

出典：社長の正式検証結果指示書。担当自身の実機操作・再実行ではない。検証対象Commitは `bb4eb678e1df383fa34429d79d9272232317c945`。

環境：Windows / Google Chrome / PythonローカルHTTPサーバー / `http://127.0.0.1:8000/`。入力はJPG3枚、共通比率3:4、900×1200、使用楽曲表示 cafe / Runa-Girl8215。

| No. | 社長実機確認項目 | 結果 |
|---|---|---|
| 1 | 修正版ローカルサーバー起動 | PASS |
| 2 | Creator Studio画面表示 | PASS |
| 3 | JPG3枚読み込み | PASS |
| 4 | 全写真3:4適用 | PASS |
| 5 | ZIP保存処理開始通知 | PASS |
| 6 | Chrome ZIPダウンロード | PASS |
| 7 | Windows ZIP展開 | PASS |
| 8 | ZIP内3枚確認 | PASS |
| 9 | FieldRise_TikTok_001.jpg：900×1200 | PASS |
| 10 | FieldRise_TikTok_002.jpg：900×1200 | PASS |
| 11 | FieldRise_TikTok_003.jpg：900×1200 | PASS |
| 12 | 展開した3枚の正常表示（目視） | PASS |
| 13 | SoundOn未確認のままZIP保存 | PASS |
| 14 | 保存セット10件維持 | PASS（一覧・IDのみ） |
| 15 | TikTok実投稿なし | 社長確認済み |

未検証：以前の停止原因の完全特定、あらゆる入力形式、EXIF Orientationのブラウザ変換、全画像のEXIF／位置情報削除、10件の全フィールド完全一致、SoundOn公式音源一致、ビジネスアカウント音源利用許可、TikTok投稿動作。ZIPの成功は投稿承認・印税発生の保証ではない。

今回の変更は報告書・手順書・最新報告の3文書のみ。アプリコード・実データ・Pages設定に変更なし。過去のNode83／Python7／診断17 PASSは前回改修時の結果として保持し、今回再実行したとは記載しない。今回の検査はGit差分、Markdown相対リンク、文書整合、変更文書の既知Secretパターンを対象とする。

今回の記録Commit SHAは最終回答とGitHub履歴で提示する（自己参照のSHAを本文へ埋め込まない）。
