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


## LINE定時報告 7:00 JST未着調査（2026-08-30）

### 完了状況

社長から「日本時間7:00にLINEが届かない」との報告を受け、本日分のGitHub Actions実行履歴、リポジトリの既定ブランチ、ワークフロー状態、スケジュール設定、LINE送信条件を再確認した。

### Fact（確認できた事実）

`FieldRise AI秘書 - 定時報告` はmainブランチで `active` である。修正後のスケジュールは `20 21 * * *`（UTC）で、毎朝6:20 JSTに起動する。LINE送信ステップは、起動が7:00 JSTより前なら7:00まで待機し、7:00 JSTを過ぎて起動した場合は直ちに送信する。リポジトリの既定ブランチは `main` である。

ただし、2026-08-30 07:00 JSTの定時実行はActions履歴に存在しなかった。直近のschedule実行はRun `33145925689`で、作成時刻は `2026-08-28T05:49:22Z`（2026-08-28 14:49:22 JST）だった。したがって、今回の未着は「cronが日本時間7:00ではない」ことではなく、GitHub Actionsのscheduleイベントが指定時刻どおりに発火していないことが原因候補である。GitHub Actionsのscheduleは実行基盤の混雑等により遅延・欠落し得るため、cron設定だけでは端末への7:00到達を保証できない。

### 検証結果

2026-08-30 08:01 JSTごろ、LINE送信を行わない `workflow_dispatch` を実行したRun `33279982686` は、天気・AIニュース・SNS収集、定時報告生成、ダッシュボードURL検証、結果コミットまで成功した。LINE通知ステップは `send_line=false` のため意図的にスキップされた。これは定時報告生成経路が動作することの検証であり、LINE実配信の検証ではない。

### 実施した修正

定時報告ワークフローを、6:20 JST起動の `20 21 * * *`（UTC）へ変更し、送信ステップに7:00 JST同期待機を追加する。これにより、GitHub Actionsが早く起動した場合でもLINE送信は7:00 JSTまで待機する。タスク完了時のLINE通知ワークフローは社長判断により停止済みであり、今回の定時報告とは分離されている。

### 未完了・ブロッカー

GitHub Actionsのscheduleイベントが7:00 JSTより前に起動した場合は待機同期できるが、schedule自体が欠落した場合や、7:00 JSTを大きく過ぎてから起動した場合の端末到達時刻はGitHub側の実行状況に依存する。今回の調査時点では、修正後scheduleの実際の発火とLINE端末での到達は未確認である。

### 参照

- [定時報告ワークフロー](https://github.com/FieldRiseJapan/FieldRise/blob/main/.github/workflows/daily-briefing.yml)
- [Run 33279982686（LINE送信なしの手動検証）](https://github.com/FieldRiseJapan/FieldRise/actions/runs/33279982686)
- [Run 33145925689（直近のschedule実行）](https://github.com/FieldRiseJapan/FieldRise/actions/runs/33145925689)


### GitHub反映

- **完全Commit SHA:** `37ae3118c955f179ce4a27af3892f69dcecf2c39`
- **Push先:** `origin/main`
- **変更:** 6:20 JST起動（UTC `20 21`）と、LINE送信前の7:00 JST同期待機


## LINE定時報告 未着の再発確認と冗長化修正（2026-08-31）

### 完了状況

2026-08-31 07:54 JST時点で、LINE定時報告が再度未着であるとの報告を受けた。本日分の `FieldRise AI秘書 - 定時報告` Actions実行履歴を確認したが、schedule実行は存在しなかった。ワークフロー自体は `active` であり、タスク完了時のLINE通知ワークフローは `disabled_manually` のままである。

### Fact（確認できた事実）

mainブランチの定時報告ワークフローには、6:20 JST起動（UTC `20 21`）と7:00 JST同期待機が反映されていた。しかし、2026-08-31 07:54 JSTまでに当該ワークフローのschedule Runは発生していなかった。同じリポジトリの `API Health Check` と `Dashboard Guard` ではschedule Runが確認できたため、LINEトークン送信時のエラーではなく、定時報告ワークフローのscheduleイベント未発火段階で止まっている可能性が高い。

### 今回の修正

GitHub Actions scheduleの欠落に備え、主起動を6:20 JST、バックアップ起動を6:40 JSTの2本へ変更した。両方が起動した場合の二重送信を避けるため、`data/project-001-ai-secretary/last_line_briefing_sent_jst.txt` に日本時間の日付を記録し、同日の送信済みなら後続Runをスキップするガードを追加した。どちらのRunもLINE送信前に7:00 JSTまで待機するため、早く起動した場合は7:00 JSTに送信する。

### 検証

LINE送信なしの手動検証Run `33279982686` は、データ収集、定時報告生成、ダッシュボードURL検証、結果コミットまで成功した。冗長化修正後の手動検証Run `33340545502` も、GitHubがワークフローを受理し、定時報告生成・URL検証・ジョブ完了まで成功した。`send_line=false` のため、両RunともLINE実配信は行っていない。ローカル既存テストは1件と9件が成功している。実際のschedule発火とLINE端末への到達は、次回実行前のため未確認である。

### 未完了・ブロッカー

GitHub Actionsのscheduleイベント自体が2本とも欠落する場合、GitHub Actions単独では7:00 JST到達を保証できない。確実な7:00配信が必要で、次回も未着となる場合は、外部の定時実行サービスまたは常時稼働スケジューラーからGitHub Actionsを起動する構成へ切り替える必要がある。この構成変更には、利用サービスと認証情報の社長承認が必要である。

### GitHub反映

- **完全Commit SHA:** `5e6e03b8b86b7f43f358a5ab0d5984bce8d3d08d`
- **Push先:** `origin/main`
- **検証Run:** [Run 33340545502](https://github.com/FieldRiseJapan/FieldRise/actions/runs/33340545502)
