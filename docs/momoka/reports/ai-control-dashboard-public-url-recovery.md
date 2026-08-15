# 【桃花・実作業完了報告】AI Control Dashboard 公開URL復旧

> **報告区分：桃花本人の実作業報告。** 自動通知やGitHub Actionsの一般的な運用結果ではなく、AI Control Dashboardの公開URL障害に対する原因確認・復旧・再テストの結果を記録する。

## 指示と対象

| 項目 | 内容 |
|---|---|
| 対象 | FieldRise AI Control Dashboard |
| 障害URL | `https://fieldrise-da-mzdfxrfv.manus.space/` |
| 復旧URL | `https://fieldrisejapan.github.io/FieldRise/ai-control-dashboard/` |
| 正本ソース | `dashboard/ai-control-dashboard/` |
| 実施日 | 2026-08-15 |

## 原因

Manus手動公開URLは、DNSおよびTLS接続自体は成立する一方で、HTTP 404かつ空本文を返した。GitHub正本・アプリ本体・GitHub Raw同期データには異常がなく、障害点はManus側の手動公開ルートにあると判断した。これはアプリケーション実装の例外ではない。

また、アプリ内の最新GitHubコミット取得には匿名GitHub REST APIを使用していた。60秒ごとの更新設計に対して匿名APIのレート制限を使い切るとHTTP 403となり、公開画面が`一部取得失敗`になることを再現した。

## 実施内容

1. `dashboard/ai-control-dashboard/`をGitHub Pagesのサブパス配下で動作する静的公開物へビルドした。
2. `ai-control-dashboard/`に公開物と`.nojekyll`を配置し、GitHub Pagesの`main`ブランチ・ルート公開を利用した。
3. 最新コミット表示を匿名REST API依存から、ビルド時生成の`data/latest-commit.json`へ切り替えた。これによりGitHub APIレート制限による同期部分失敗を回避した。
4. 代替公開物の再生成手順を`dashboard/ai-control-dashboard/scripts/build_pages_fallback.sh`として保存した。
5. 毎朝の定時報告・LINE通知・URL検証テストの掲載先をGitHub Pagesの復旧URLへ切り替えた。

## 再テスト結果

| 確認項目 | 結果 |
|---|---|
| GitHub Pages公開ビルド | 成功（commit `bf3512b`） |
| 復旧URLのHTTP応答 | HTTP 200 |
| ダークUI・主要画面 | 正常表示 |
| GitHub正本の取得 | 001/002、G01〜G09、桃花通信、実行状態、正式報告を表示 |
| 同期状態 | `同期正常`、同期対象`4 / 4` |
| 最新コミット表示 | 静的スナップショットから表示。匿名API制限による警告なし |
| 手動再同期 | 操作可能 |
| TypeScript検査 | 通過 |
| 定時報告URLテスト | 通過 |
| LINE通知URLテスト | 通過 |

## 成果物

| 種別 | 保存先 |
|---|---|
| アプリ正本 | `dashboard/ai-control-dashboard/` |
| GitHub Pages公開物 | `ai-control-dashboard/` |
| 再現可能なビルド手順 | `dashboard/ai-control-dashboard/scripts/build_pages_fallback.sh` |
| 定時報告・LINE通知設定 | `automation/scripts/generate_briefing.py`、`automation/scripts/send_line_notification.py` |
| URL検証 | `automation/scripts/test_dashboard_url_in_briefing.py`、`automation/scripts/test_send_line_notification.py` |

## 未解決事項

Manus手動公開URLは引き続き404であり、プラットフォーム側の公開ルート復旧が必要である。ただし、利用者向けの公開到達性と毎朝のLINE掲載はGitHub Pagesの復旧URLにより解消済みである。

## 完了判定

**完了（GitHub Pages代替公開による復旧）**。Manus URLの復旧は外部プラットフォームの保留事項として分離し、実運用URLはGitHub Pages版を使用する。
