# 【彩花向け｜SNS分析・朝の定時報告 統合完了報告】

> **正式報告区分：桃花（COO）の実作業。** TikTok、Instagram、YouTubeの分析レポートをFieldRiseの既存定時報告基盤へ統合し、毎朝07:00 JSTの処理で収集・可視化・GitHub URL掲載・LINE Broadcast通知を連動させる構成を整備した。手動検証ではLINE配信を抑止し、ワークフロー成功を確認している。

## 1. 完了事項

SNS分析基盤は、認証情報が実際に保存されている`FieldRiseJapan/FieldRise`へ統合した。分析コード、初期データ、構造化レポート、個別PNGグラフは`automation/social_analytics/`に保存し、既存の`.github/workflows/daily-briefing.yml`から毎朝07:00 JSTに起動する。

定時報告の生成前に各媒体を更新し、総合・TikTok・Instagram・YouTubeの4レポートURLを定時報告本文およびLINE Broadcast本文へ掲載する。手動起動時は`send_line=false`を既定にして、検証時に不必要な通知を発生させない。

| 項目 | 状態 | 実装・確認内容 |
|---|---|---|
| SNSレポート基盤 | 完了 | `automation/social_analytics/`へ統合 |
| 毎朝の定時処理 | 完了 | `.github/workflows/daily-briefing.yml`へ組込み、07:00 JSTに実行 |
| 朝の定時報告へのURL掲載 | 完了 | 総合、TikTok、Instagram、YouTubeの4本を掲載 |
| LINE Broadcast | 定時実行で有効 | 既存`LINE_CHANNEL_ACCESS_TOKEN`をそのまま利用。手動検証では未送信 |
| CJKグラフ | 完了 | IPAexGothicを明示登録し、個別PNGで日本語表示を確認 |
| YouTube公開統計 | 有効 | APIキーで公開動画39本、公開再生数を毎日更新 |

## 2. 最終検証結果

最終手動検証は、GitHub Actions Run `32096179220`で成功した。[1] LINE送信は`send_line=false`により意図的にスキップしており、通常の毎朝定時実行では既存のBroadcast API通知が動作する設計である。

| 媒体・機能 | 検証結果 | 現状の意味 |
|---|---|---|
| YouTube | 成功 | `YOUTUBE_API_KEY`で公開統計、公開動画39本、動画別の公開再生数を更新 |
| Instagram | 安全に保留 | 現在の`META_ACCESS_TOKEN`はInstagram APIで解析できず、HTTP 400 / OAuth code 190 |
| TikTok | 安全に保留 | `TIKTOK_REFRESH_TOKEN`が未登録のため、未取得値を推測せずスキップ |
| レポート・グラフ生成 | 成功 | 既存データとYouTube更新データからMarkdown・PNGを生成 |
| LINE通知 | 手動検証では未送信 | 意図した安全制御であり、失敗ではない |

YouTubeは公開統計として、登録者85人、公開動画39本を取得した。テーマ別の取得済み動画累積再生数はWinter 3,043、EDM 1,775、Other 1,747、Cafe 76である。これらはYouTube Data APIで取得した公開統計であり、視聴時間、維持率、CTR、流入元などの所有者指標は含まない。[2]

## 3. CJKグラフ品質

OSパッケージ取得がGitHubランナー上で長時間停止する事象を避けるため、`japanize-matplotlib`に同梱されるIPAexGothicをmatplotlibへ明示登録する方式へ変更した。Python 3.12では同パッケージの旧式モジュールを直接importせず、同梱TTFを登録するため、OSのフォント配布状況に依存しない。

> 全グラフは、白背景、薄灰色の点線グリッド、指定の青・水色・ティール・緑・黄・橙・灰の配色を用いる。日本語タイトル、凡例、注記および数値の表示を個別PNGで確認済みである。[3]

## 4. 彩花に共有する認証・判断待ち事項

| 優先度 | 項目 | 必要な理由 | 次の状態 |
|---:|---|---|---|
| 1 | `TIKTOK_REFRESH_TOKEN` | 既存のTikTok client key / secretと組み合わせ、@fieldrizejapanの公式データを取得する | 登録後、次回定時実行からTikTokグラフを自動生成 |
| 2 | Instagram Loginに対応する有効なユーザーアクセストークン | 現在の`META_ACCESS_TOKEN`はInstagram APIで使用できない | 正しいトークンを`INSTAGRAM_ACCESS_TOKEN`として登録、または取得方式を再指定 |
| 3 | `YOUTUBE_CLIENT_ID`、`YOUTUBE_CLIENT_SECRET`、`YOUTUBE_REFRESH_TOKEN` | 視聴時間、維持率、CTR、流入元、登録者増減を含む所有者分析に必要 | 公開統計版から所有者分析版へ拡張 |

LINEについては追加の`LINE_TARGET_ID`を必要としない。既存の`LINE_CHANNEL_ACCESS_TOKEN`によるBroadcast方式で、定時報告にSNSレポートURLを含めて配信する。

## 5. 保存先と参照先

| 資産 | 保存先 |
|---|---|
| SNS総合インデックス | [`automation/social_analytics/reports/latest_report.md`](../../../automation/social_analytics/reports/latest_report.md) |
| YouTubeフル分析 | [`automation/social_analytics/reports/youtube_full_analysis.md`](../../../automation/social_analytics/reports/youtube_full_analysis.md) |
| 統合の実行記録 | [`docs/social_analytics/integration_status_2026-08-18.md`](../../../docs/social_analytics/integration_status_2026-08-18.md) |
| CJKグラフ品質記録 | [`docs/social_analytics/chart_qc_notes.md`](../../../docs/social_analytics/chart_qc_notes.md) |
| 朝の定時報告 | [`projects/project-001-ai-secretary/briefings/latest.md`](../../../projects/project-001-ai-secretary/briefings/latest.md) |
| 本報告書 | `music_ai/reports/cafe/2026-08-18_social_analytics_integration_report.md` |
| 更新前の正式入口 | `music_ai/reports/cafe/archive/2026-08-18_pre_social_analytics_integration_latest_report.md` |

## 参照

[1]: https://github.com/FieldRiseJapan/FieldRise/actions/runs/32096179220 "FieldRise AI秘書 - 定時報告：最終手動検証"
[2]: https://developers.google.com/youtube/v3/docs/channels "YouTube Data API: channels"
[3]: ../../../docs/social_analytics/chart_qc_notes.md "SNS分析グラフ品質確認"
