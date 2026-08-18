# SNS分析・朝の定時報告統合：最終実行記録

**対象リポジトリ:** `FieldRiseJapan/FieldRise`  
**最終検証実行:** [GitHub Actions Run 32096179220](https://github.com/FieldRiseJapan/FieldRise/actions/runs/32096179220)  
**実行方式:** 手動検証（`send_line=false`、LINE配信は意図的に抑止）  
**結果:** ワークフロー成功

## 実装済みの運用

TikTok、Instagram、YouTubeの分析コード、初期レポート、個別PNGグラフを`automation/social_analytics/`へ統合した。既存の毎朝07:00 JSTワークフロー（`.github/workflows/daily-briefing.yml`）は、SNSデータを収集し、CJKフォント対応のグラフを再生成した後、朝の定時報告へ4本のGitHub URLを掲載する。

LINEの既存Broadcast API通知は、定時実行では自動送信される。手動検証時のみ、`send_line=false`により通知を抑止する。これにより、動作確認が不要なLINE配信を発生させない。

| 対象 | 自動更新状態 | 実行確認 | 補足 |
|---|---|---|---|
| YouTube | 有効 | 成功 | `YOUTUBE_API_KEY`で公開統計、公開動画39本、動画別公開再生数を取得 |
| Instagram | 保留 | 接続失敗を安全に処理 | `META_ACCESS_TOKEN`はInstagram APIでOAuth tokenとして解釈できず、HTTP 400 / code 190 |
| TikTok | 保留 | 安全スキップ | `TIKTOK_REFRESH_TOKEN`が未登録 |
| 朝の定時報告 | 有効 | 成功 | 3媒体と総合インデックスのGitHub URLを掲載 |
| LINE Broadcast | 定時実行で有効 | 手動検証では意図的に未送信 | 既存の`LINE_CHANNEL_ACCESS_TOKEN`を使用 |

## CJKグラフの安定化

OSパッケージ取得が長時間停止する事象を避けるため、`japanize-matplotlib`に同梱されたIPAexGothicフォントを明示登録する方式に変更した。Python 3.12では同パッケージを直接importせず、同梱TTFをmatplotlibへ登録する。これにより、GitHubランナーでOSのフォントパッケージに依存せず、日本語ラベルを描画する。

| グラフ | 状態 |
|---|---|
| Instagram 投稿別の露出と反応 | IPAexGothicで日本語ラベル・凡例・注記を確認 |
| Instagram リール反応率 | IPAexGothicで日本語ラベル・百分率を確認 |
| YouTube 視聴上位10本 | IPAexGothicで日本語タイトル・注記を確認 |
| YouTube テーマ別累積再生数 | API取得済み39本の集計注記を確認 |

## 残る認証項目

| 優先度 | 必要な項目 | 理由 |
|---:|---|---|
| 1 | `TIKTOK_REFRESH_TOKEN` | 登録済みのTikTok client key / secretと組み合わせ、@fieldrizejapanの公式データを取得するため |
| 2 | Instagram Loginに対応する有効なユーザーアクセストークン | 現在の`META_ACCESS_TOKEN`はInstagram API endpointで解析できない。置換後は`INSTAGRAM_ACCESS_TOKEN`として登録するか、ワークフローの対応先を更新する |
| 3 | `INSTAGRAM_USER_ID`（必要時） | 正しいトークンで`/me`からProfessional Account IDを解決できない場合のみ必要 |
| 4 | `YOUTUBE_CLIENT_ID`、`YOUTUBE_CLIENT_SECRET`、`YOUTUBE_REFRESH_TOKEN` | 視聴時間、維持率、CTR、流入元、登録者増減を含む所有者分析に必要 |

> 既存の`YOUTUBE_API_KEY`による公開統計取得と、既存の`LINE_CHANNEL_ACCESS_TOKEN`による定時Broadcastは、追加の認証なしで運用可能である。

## 主要リンク

| 項目 | URL |
|---|---|
| 朝の定時報告 | [latest.md](https://github.com/FieldRiseJapan/FieldRise/blob/main/projects/project-001-ai-secretary/briefings/latest.md) |
| SNS総合インデックス | [latest_report.md](https://github.com/FieldRiseJapan/FieldRise/blob/main/automation/social_analytics/reports/latest_report.md) |
| YouTube分析 | [youtube_full_analysis.md](https://github.com/FieldRiseJapan/FieldRise/blob/main/automation/social_analytics/reports/youtube_full_analysis.md) |
| 設定ガイド | [setup.md](https://github.com/FieldRiseJapan/FieldRise/blob/main/docs/social_analytics/setup.md) |
