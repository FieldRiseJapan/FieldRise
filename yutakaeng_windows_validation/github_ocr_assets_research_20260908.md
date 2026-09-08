# yutakaeng向けGitHub実装資産調査

## 結論

今回の調査では、yutakaengをそのまま置き換える単一のGitHubプロジェクトは見つかりませんでした。現在のPySide6・PyMuPDF・RapidOCR・Tesseract・OpenCV・openpyxlの構成は、固定された配線図面とオフライン要件に適しています。一方で、**PaddleOCR/PP-Structureを比較用の高精度OCR候補として追加し、ocr_ensembleの考え方を警告セル再解析へ取り入れ、Bakkopi/engineering-drawing-extractorとimg2tableから枠線除去・座標分離の実装パターンを参考にする**のが最も現実的です。

## 推奨候補

| 優先度 | GitHub資産 | yutakaengでの使い道 | 導入方針 |
|---:|---|---|---|
| 1 | [PaddleOCR](https://github.com/PaddlePaddle/PaddleOCR) / PP-Structure | 主文字、線サイズ、タイトル欄の比較用ローカルOCR。座標付きテキストや文書構造解析の候補 | まず評価用に別経路で導入し、RapidOCR/Tesseractを置き換えず、警告セルだけで比較する |
| 2 | [ocr_ensemble](https://github.com/rafelafrance/ocr_ensemble) | 複数前処理・複数OCRの候補を距離と合意で絞り込む設計 | 方式を直接コピーせず、ZT主文字・Tブロック・線サイズの候補合意ロジックへ応用する |
| 3 | [engineering-drawing-extractor](https://github.com/Bakkopi/engineering-drawing-extractor) | 工業図面の不要線・枠・表領域を処理し、OCRからExcelへ出す実装例 | 小規模な参考実装として、タイトル欄・枠線除去・Excel列構造を比較する |
| 4 | [img2table](https://github.com/xavctn/img2table) | OpenCVによる罫線・表セル・座標の検出、OCR信頼度のしきい値処理 | 配線図全体を表として扱わず、ZT/Tブロックのセル境界検出部だけを参考にする |
| 5 | [LayoutParser](https://github.com/Layout-Parser/layout-parser) | ページ内のタイトル欄、配線枠、表、文字領域のレイアウト検出 | 固定図面の主処理には重いため、図面種類が増えた場合の候補として検証する |
| 6 | [docTR](https://github.com/mindee/doctr) | 文字検出と文字認識を分離し、単語単位の座標・信頼度を取得する | PyTorch依存とモデル容量を確認したうえで、オフライン評価版に限定する |
| 7 | [HURIDOCS PDF layout analysis](https://github.com/huridocs/pdf-document-layout-analysis) | PDFの文書領域・表・タイトル・本文の一般的な分割 | Docker、REST、重量級モデルのため、Windowsポータブル本体には採用しない |

## 重要な評価

### PaddleOCR/PP-Structure

PaddleOCRはPDF・画像を構造化し、テキスト座標や表セル座標を返す機能を持ち、英語・日本語を含む多言語モデルとWindows向けローカル推論経路が公開されています。したがって、ZTブロックの主文字、長いTブロック文字、右下タイトル欄の候補比較には最も有望です。[1]

ただし、配線図固有の`RIGHT-Y5`、`LEFT-Y5`、`T1:4-Y2`、マルチコネクター名、丸囲み記号の意味までは一般OCRが理解するわけではありません。PaddleOCRを導入しても、現在の見出し辞書、電線コード形式照合、ページ間整合性、誤確定防止ルールは残す必要があります。

### ocr_ensemble

ocr_ensembleは、複数の画像前処理と複数OCRエンジンの候補を作り、編集距離や合意を使って外れ値を除外する考え方を示しています。[2] yutakaengでは、全ページに適用すると処理が重くなるため、**警告セルだけ**に限定します。RapidOCR、Tesseract、PaddleOCRの候補が一致した場合にのみ自動確定し、不一致なら警告として残します。

### engineering-drawing-extractor

engineering-drawing-extractorは、工業図面から不要な線・境界・注記を除去し、OCRで図面番号・タイトルなどを取り出し、openpyxlでExcelへ出力する近い目的のサンプルです。[3] 現在のyutakaengと依存関係が近いため、タイトル欄と罫線除去の比較材料として有用です。ただし、コネクター分類やZTブロック、マーク数、盤間配線といった本プロジェクト固有の業務ルールは別途維持します。

### img2table

img2tableはOpenCV中心でPDF・画像から表領域、行列境界、セル座標を抽出し、OCR信頼度で採用可否を制御できます。[4] 配線図全体を表抽出へ任せるのは適切ではありませんが、ZTブロックやTブロックの実セル境界を検出する部品として参考になります。`RIGHT`/`LEFT`の隣接欄を分離する処理にも応用できます。

### LayoutParserとdocTR

LayoutParserはレイアウト領域を検出し、領域ごとにOCRを実行する統一APIを提供します。[5] docTRは文字検出と認識を2段階に分け、単語の座標・信頼度を返せます。[6] どちらも固定座標だけに依存しない構成を作る助けになりますが、PyTorch・Detectron系モデルをWindowsポータブルZIPへ同梱すると容量、起動時間、CPU処理時間が増えます。したがって、直ちに本体へ組み込まず、候補セルだけで精度比較を行うべきです。

## yutakaengへの推奨導入順序

1. **PaddleOCRのローカル評価経路を追加する。** 通常解析には使わず、主文字・線サイズ・タイトル欄の警告セルだけでRapidOCR/Tesseractと比較する。
2. **ocr_ensemble型の候補合意を改善する。** 元画像、罫線除去、局所二値化、反転、拡大の候補を作り、候補文字列が一致した場合だけ確定する。
3. **engineering-drawing-extractorとimg2tableの枠線・セル境界処理を参考にする。** ZT/Tブロックでは固定比率より実罫線検出を優先する。
4. **正解付きゴールドセットを固定する。** ZT主文字、Tブロック長文、線サイズ、RIGHT/LEFT、オーダー番号、盤番号をページ・枠ID単位で記録する。
5. **精度だけでなく誤確定率を測る。** `正確確定率`、`警告率`、`誤確定率`、`1ページ処理時間`を比較し、誤確定が増える候補は採用しない。
6. **Windows版へは採用したモデルだけを同梱する。** 候補モデルをすべて同梱せず、実測で改善したものだけを最終ZIPへ入れる。

## 採用しない方がよいもの

HURIDOCSのPDF文書レイアウト解析は、VGTまたはLightGBM、Tesseract、Docker、REST APIを組み合わせた一般文書向けのサービスです。[7] 研究用の比較対象としては有益ですが、会社PCでネット接続なしに使う205MB級のポータブルアプリへ組み込むには、依存関係・モデル容量・起動構成が重すぎます。また、一般文書の表や本文を解析する仕組みであり、配線図のコネクター意味や線コード規則を自動的に解決するものではありません。

## 最終結論

現時点で最も有効なのは、**現在の業務ルールとOpenCVの枠検出を残し、PaddleOCRを警告セル専用の第3候補として追加し、ocr_ensemble方式の候補合意を強化すること**です。LayoutParserとdocTRは将来の図面種類拡張に備えた比較候補、engineering-drawing-extractorとimg2tableは実装パターンの参考資産として扱うのが安全です。これならオフライン動作、PDF外部送信なし、Excel形式維持、誤確定防止を壊さず、ZT主文字と線サイズの改善可能性を検証できます。

## 参考資料

[1]: https://github.com/PaddlePaddle/PaddleOCR "PaddlePaddle/PaddleOCR"
[2]: https://github.com/rafelafrance/ocr_ensemble "rafelafrance/ocr_ensemble"
[3]: https://github.com/Bakkopi/engineering-drawing-extractor "Bakkopi/engineering-drawing-extractor"
[4]: https://github.com/xavctn/img2table "xavctn/img2table"
[5]: https://github.com/Layout-Parser/layout-parser "LayoutParser"
[6]: https://github.com/mindee/doctr "Mindee docTR"
[7]: https://github.com/huridocs/pdf-document-layout-analysis "HURIDOCS PDF document layout analysis"

> **ライセンスについて:** 導入前に各リポジトリのLICENSE、モデル配布条件、依存モデルの利用条件を個別に確認する必要があります。この調査では、実装機能と構成適合性を中心に評価し、yutakaengへのコード取り込みや配布許諾を確定したものではありません。

## 2026-09-08 実装・実測追記

PaddleOCR 3.7.0 / PaddlePaddle 3.3.1 を警告セル専用の任意ローカル候補として接続した。モデルは `PP-OCRv6_medium_det` と `PP-OCRv6_medium_rec` をWindows配布時に同梱し、モデルディレクトリが存在しない場合は初期化せず、ネットワークへ接続しない設計とした。CPUのoneDNN互換エラーを避けるため `enable_mkldnn=False` を設定した。

RapidOCR・Tesseract・PaddleOCRの候補は、エンジン名を重複させず、2つ以上の独立エンジンが一致した場合だけ安全候補として採用する。候補が不一致の場合は従来どおり警告へ残す。img2tableを参考に、ZT/Tブロックでは検出した水平罫線を除去してから主文字・左右欄を再解析する。PyInstaller実行時は実行ファイル基準の `paddle_models` も探索する。

実図面4ページの最終実測では、生成Excelのシートは `概要, 0.5, 2, 3, 5, ZTブロック, 線サイズ判別不明, 線サイズ未記載`。ZTブロック13行について主文字空欄は0行となり、主文字存在率は13/13だった。状態は読取済み8行、警告あり1行、セクション行等4行。警告行は `RIGHT-Y51` のような線サイズ不確定や右側接続先未読取を推測確定せず保持している。

全回帰テスト、構文検査、GitHub資産アダプターテストは通過。処理時間はPaddleOCRの警告セル再解析により増加するため、通常行を既存RapidOCRで処理し、警告候補に限定してPaddleOCRを呼び出す。
