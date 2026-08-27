# yutakaeng プロジェクト構成

## 目的

`yutakaeng_windows_validation` は、配線図PDFを外部送信せずに解析し、ホットマーカー用のExcel候補を出力するWindows持ち運び版の開発・検証フォルダです。

## 主要ファイル

| パス | 役割 | 変更時の注意 |
|---|---|---|
| `src/app.py` | PySide6の画面、ドラッグ＆ドロップ、処理中コード画面、進捗、ETA、完了表示 | 画面表示だけを変更する場所。OCR判定ロジックを混ぜない |
| `src/pipeline.py` | PDF描画、枠検出、OCR、業務ルール、Excel出力 | 主文字・接続先・除外条件・シート仕様を変更する場所 |
| `tests_pipeline_rules.py` | OCR候補の安全ゲートと業務ルールの試験 | ルール変更時に必ず更新・実行する |
| `tests_excel_layout.py` | Excel列順、プレフィックス、マーク個数、確認状態の試験 | Excel形式変更時に必ず更新・実行する |
| `PORTABLE_README.txt` | Windows利用者向け説明書 | 利用方法や安全方針を変更したら更新する |
| `TEST_RESULTS.md` | 実PDFと自動試験の検証記録 | 実測値を推測で書かず、日付と入力PDFを残す |
| `PROJECT_STRUCTURE.md` | 本ファイル。役割と変更方針を記録 | 大きな構成変更時に更新する |
| `.github/workflows/yutakaeng-windows-validation.yml` | Windows Actions、依存関係、PyInstaller、成果物ZIP | 同梱物やビルド手順変更時に確認する |

## UIの状態

画面は、`待機中`、`解析中`、`解析完了`、`エラー`の状態を持ちます。解析中は全画面に近いコード風ログを表示し、ローカルOCR・外部送信なし・警告行のみ確認という処理モードを明示します。解析完了時は大きな緑色の`解析完了！`を表示し、Excelの保存先をダイアログへ示します。

## Excel出力の基本

主文字は、読取できた場合に`盤番号-見出しまたは端子台-主文字`の順で出力します。電線サイズ別シートは、入力図面から実際に抽出できたサイズだけを作成します。サイズや見出しを特定できない行は`警告一覧`へ集約し、正常行は`確認不要`、不確かな行だけを`警告確認`とします。

## 変更手順

まず対象ファイルの既存動作を確認し、変更は役割に合ったファイルへ限定します。次に`python3 -m py_compile src/pipeline.py`、`python3 tests_excel_layout.py`、`python3 tests_pipeline_rules.py`を実行します。実PDFで結果を確認した後、必要ファイルだけをGitへ追加し、`git pull --rebase origin main`の後にコミット・pushします。診断用スクリプトや一時出力はコミット対象へ含めません。

## 安全方針

PDF全体を外部へ送信しません。Copilot補助は警告セル画像1件を利用者が選択し、手動添付する場合だけ使用します。OCR候補が不確かな場合は推測で補完せず、空欄・警告としてExcelへ出力します。
