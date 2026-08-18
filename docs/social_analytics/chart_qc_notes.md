# SNS分析グラフ品質確認

## 2026-08-18：YouTube APIキー更新後

| ファイル | 確認結果 | 対応状況 |
|---|---|---|
| `automation/social_analytics/reports/charts/youtube_top10_public_views.png` | 日本語タイトル・軸ラベル・数値はNoto Sans CJK JPで正常に描画。長い英語タイトルは改行表示され、上位10本の視認性を維持している。 | 合格 |
| `automation/social_analytics/reports/charts/youtube_category_public_views.png` | 日本語タイトル・軸ラベル・数値は正常に描画。白背景、薄灰色点線グリッド、指定配色を確認。脚注は初期スナップショットの「30本」表記が残っており、API更新後の39本に合わせて修正が必要。 | 脚注・説明文を修正予定 |

CJK font: `Noto Sans CJK JP`。

## 修正後の確認

| ファイル | 最終確認結果 |
|---|---|
| `automation/social_analytics/reports/charts/youtube_top10_public_views.png` | タイトルを「取得済み動画の視聴上位10本」へ更新。YouTube Data APIまたは公開チャンネル取得データを出所として明示し、日本語・数値とも正常に描画。 |
| `automation/social_analytics/reports/charts/youtube_category_public_views.png` | 脚注を「取得済み動画39本をテーマ分類して集計」に更新。以前の30本という不正確な表記を解消し、日本語・数値とも正常に描画。 |

## Python配布フォントによる最終確認

| ファイル | 最終確認結果 |
|---|---|
| `automation/social_analytics/reports/charts/instagram_post_performance.png` | IPAexGothicによる日本語ラベル、凡例、軸名、注記が正常に描画。白背景、薄灰色の点線グリッド、指定の青・ティール配色を維持。 |
| `automation/social_analytics/reports/charts/youtube_category_public_views.png` | IPAexGothicによる日本語タイトル、軸名、脚注が正常に描画。取得済み39本の集計注記、白背景、薄灰色の点線グリッド、指定配色を確認。 |
