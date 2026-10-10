# Windows実機検証ガイド

基準Commit：603f0f746894adcf87fdf4500a54d74c6b3b0910。検証対象は専用ブランチ `feature/tiktok-photo-windows-release-readiness` の最終Commit。現時点ではWindows実機未検証。

## 起動
1. 専用ブランチのコードをWindowsへ取得する。既存作業フォルダの未保存変更を上書きしない。Gitを使わずGitHubからブランチZIPを取得して新規フォルダへ展開してもよい。
2. Python 3.9以上を用意。Node.jsは構文診断用（ない場合はBLOCKEDとして出力）。スクリプトはソフトのインストール、ネット接続、課金、管理者権限要求を行わない。
3. PowerShellから以下を実行。会社/組織の実行ポリシーで拒否される場合、ポリシーを変更せず下記Python直接実行を使う。

```powershell
& .\automation\sns_auto_posting\tiktok\photo\tools\start_windows.ps1
```

Python直接実行：

```powershell
py -3 .\automation\sns_auto_posting\tiktok\photo\tools\local_tool.py diagnose --output "$env:TEMP\fieldrise-photo-diagnostics.json"
py -3 .\automation\sns_auto_posting\tiktok\photo\tools\local_tool.py serve --port 8000
```

ChromeまたはEdgeで http://127.0.0.1:8000/ を開く。file://で直接開かない。Ctrl+Cで終了。サーバーは127.0.0.1のみで、他のPCへ公開しない。ポート使用中なら既存サーバーを終了する。8001へ変えるとブラウザ保存場所が変わるので、日常利用では同じURL/ポート/ブラウザを使う。
このサーバーは写真準備フォルダの8静的ファイルだけを提供する。他のFieldRise画面は提供しない。

**以前のルートサーバーURL** `http://127.0.0.1:8000/automation/sns_auto_posting/tiktok/photo/` **とはパスが異なるがOriginは同じ。** 同じポートならlocalStorageキーを共有する。再利用する前に旧画面でJSONを退避し、旧サーバーを終了してから新サーバーを起動する。別ポート/本番HTTPS/別ブラウザはOriginや保存領域が変わるため、自動で移行しない。

## 検証データと安全
実際のJPG/PNG/WebPを各1枚以上用意（社長本人の写真、機密・個人情報を含まない検証用）。横/縦、透過PNG、スマホ撮影のEXIF回転画像も含める。既存データを使う前にJSONバックアップ。実投稿URL欄のテストは実績と混同しないため検証専用セットに「TEST」と付ける。音源ID/ISRCは推測入力しない。
TikTok Studioリンクは開くだけ。ログイン・アップロード・音源操作・実投稿・予約投稿を自動実施しない。必要な本人確認は社長が行う。本手順は実投稿の承認を含まない。

## チェックリスト（PASS/FAIL/BLOCKED/NOT TESTEDを記入）
|番号|確認|期待結果|結果・証拠|
|---|---|---|---|
|1|起動/再読込|日本語表示、moduleエラーなし、診断結果を保存|NOT TESTED|
|2|JPG/PNG/WebP複数投入/ドロップ|各写真を読み込む。無効ファイルは個別拒否|NOT TESTED|
|3|サムネイル/枚数/名前|写真と表示が一致、0/35超過を確認|NOT TESTED|
|4|↑↓/削除|順序変更、写真個別削除、他画像保持|NOT TESTED|
|5|3:4/4:3/16:9一括|900x1200/1200x900/1600x900|NOT TESTED|
|6|個別切抜き/EXIF回転|選択写真のみ調整、縦横/内容/保存結果一致|NOT TESTED|
|7|ZIP保存|OSダウンロード先で実ファイルを確認|NOT TESTED|
|8|エクスプローラーでZIP展開|001連番、順序、全枚数、JPEG、白背景、破損なし|NOT TESTED|
|9|6カテゴリ/3候補/長さ|各候補を選択、編集、重複警告|NOT TESTED|
|10|各コピーボタン→メモ帳へ貼付|文章/タグ単独/楽曲名が一致。拒否時手動案内|NOT TESTED|
|11|セット保存→ページ再読込→開く|設定保持、元画像再選択要求、最終音源確認リセット|NOT TESTED|
|12|複製/状態/予定/日時検索|新ID、確認リセット、JST保持、同時刻警告、空検索誤操作なし|NOT TESTED|
|13|JSON/CSVバックアップ/再取込|UTF-8日本語、重複拒否、既存上書きなし|NOT TESTED|
|14|未確認/不一致/利用不可|理由保持、完了拒否、公式URLの対応根拠保持|NOT TESTED|
|15|Studioリンク|https://www.tiktok.com/tiktokstudio を別タブで開く。送信なし|NOT TESTED|

JSON再取込の正常追加は独立した新規ブラウザプロファイルの空状態で検証（同一データを元ブラウザへ入れると重複拒否が期待結果）。既存プロファイルを消去しない。初期cafeが重複する場合は重複拒否が正しい。すべてを上書き復元する機能ではない。
追加確認：保存失敗時JSON退避/再試行、未保存切替確認、破損データ保護、Chrome/Edge表示差。破損/容量不足は専用プロファイルだけで検証し、実ユーザーデータを壊さない。

## 証拠の残し方
OS/ブラウザのバージョン、検証Commit、日時（JST）、画像形式/枚数/容量、各結果、診断JSON、ZIPの枚数/サイズ、機密情報を除いたスクリーンショットを記録。Windows起動スクリプトの実行も未検証ならそのまま残す。FAILは再現操作・修正SHA・再テスト結果を併記。
公開承認の前に結果を正式報告へ反映する。診断PASSだけでWindowsブラウザPASSにしない。
