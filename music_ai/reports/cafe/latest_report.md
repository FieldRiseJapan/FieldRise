# 【彩花向け｜SNS分析・朝の定時報告 統合完了報告】

> **正式報告区分：桃花（COO）の実作業。** TikTok、Instagram、YouTubeの分析レポートをFieldRiseの既存定時報告へ統合し、毎朝07:00 JSTの処理で収集・可視化・GitHub URL掲載・LINE Broadcast通知を連動させる構成を整備した。最終手動検証は成功しており、LINE配信は検証用設定により意図的に抑止した。

## 現在の状態

| 項目 | 状態 | 要点 |
|---|---|---|
| SNS基盤・個別グラフ | 完了 | `automation/social_analytics/`にレポート、データ、CJK対応PNGを保存 |
| 朝の定時報告 | 完了 | 毎朝07:00 JSTにSNS更新後、4本のレポートURLを掲載 |
| LINE Broadcast | 定時実行で有効 | 既存`LINE_CHANNEL_ACCESS_TOKEN`を利用。手動検証は未送信 |
| YouTube公開統計 | 成功 | APIキーで公開動画39本と公開再生数を更新 |
| Instagram所有者データ | 保留 | 現在の`META_ACCESS_TOKEN`がInstagram APIで無効 |
| TikTok所有者データ | 保留 | `TIKTOK_REFRESH_TOKEN`の登録待ち |
| CJK描画 | 完了 | IPAexGothicを明示登録し、日本語ラベルの個別PNGを確認 |

## 最終検証

[GitHub Actions Run 32096179220](https://github.com/FieldRiseJapan/FieldRise/actions/runs/32096179220) は成功した。YouTube公開統計は、登録者85人、公開動画39本を取得している。テーマ別の取得済み動画累積再生数はWinter 3,043、EDM 1,775、Other 1,747、Cafe 76である。

> **実測値と保留項目の区別:** YouTube数値は公開APIの実測値である。TikTokとInstagramは、未取得値を推測せず、認証完了まで既存の有効レポートを維持する。

## 彩花に共有する次の認証項目

| 優先度 | 必要なもの | 目的 |
|---:|---|---|
| 1 | `TIKTOK_REFRESH_TOKEN` | @fieldrizejapanの公式動画・アカウント指標を日次取得 |
| 2 | 有効なInstagram Loginユーザーアクセストークン | リーチ、保存、シェア、再生、投稿インサイトの自動取得 |
| 3 | YouTube OAuth 3件（`YOUTUBE_CLIENT_ID`、`YOUTUBE_CLIENT_SECRET`、`YOUTUBE_REFRESH_TOKEN`） | 視聴時間、維持率、CTR、流入元、登録者増減を含む所有者分析 |

LINEは追加設定不要である。既存のBroadcast方式により、毎朝の定時報告へSNSレポートURLを掲載して通知する。

## 正本・参照先

| 資産 | 保存先 |
|---|---|
| 詳細報告書 | [`2026-08-18_social_analytics_integration_report.md`](2026-08-18_social_analytics_integration_report.md) |
| SNS総合インデックス | [`automation/social_analytics/reports/latest_report.md`](../../../automation/social_analytics/reports/latest_report.md) |
| 統合実行記録 | [`docs/social_analytics/integration_status_2026-08-18.md`](../../../docs/social_analytics/integration_status_2026-08-18.md) |
| CJKグラフ品質記録 | [`docs/social_analytics/chart_qc_notes.md`](../../../docs/social_analytics/chart_qc_notes.md) |
| 更新前の正式入口 | [`archive/2026-08-18_pre_social_analytics_integration_latest_report.md`](archive/2026-08-18_pre_social_analytics_integration_latest_report.md) |

**報告日時：** 2026-08-18（GMT+9）

**最終検証：** [Run 32096179220](https://github.com/FieldRiseJapan/FieldRise/actions/runs/32096179220)
