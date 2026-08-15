# Dashboard Guard

Dashboard Guardは、FieldRiseのAI Control DashboardとSonata Deskを**読み取り専用で監視**するGitHub内の修正支援プログラムです。公開URL、JSON正本、TypeScript検査、本番ビルドを確認し、問題が見つかった場合は証跡と修正提案を作成します。

> Dashboard Guardは、ダッシュボード本体、静的公開物、GitHub Pages設定、workflow権限、`main`ブランチを自動変更しません。

## 監視対象

| 対象 | 検査 |
|---|---|
| AI Control Dashboard | GitHub PagesのHTTP応答、初期HTMLのタイトル、TypeScript、本番ビルド |
| Sonata Desk | GitHub PagesのHTTP応答、初期HTMLのタイトル、TypeScript、本番ビルド |
| 正本データ | `dashboard-data.json`、桃花実行状態JSONの構文 |

監視は対象ファイルのPush時、毎朝7:15 JST、またはGitHub Actionsの手動実行で動きます。

## エラー時の動作

問題を検知すると、GitHub Actionsは診断レポートを30日間の成果物として保存します。続いて、`automation`、`dashboard`、`verification`ラベルを持つ既存Issueを更新するか、承認待ちIssueを作成します。

| 段階 | Dashboard Guardの動作 | 人の承認 |
|---|---|---|
| 検知 | HTTP、JSON、型、ビルドを検査 | 不要 |
| 診断 | エラー証跡と影響範囲をレポート化 | 不要 |
| 修正提案 | 修正対象・安全な診断手順・禁止事項をIssueに提示 | 不要 |
| 修正用ブランチ | パッチを作る準備 | 必要 |
| `main`反映・公開 | ダッシュボード本体または公開物へ反映 | 必要 |

## 手動実行

ローカルでは、次のコマンドで検査だけを実行できます。

```bash
python3 automation/dashboard_guard/dashboard_guard.py
```

レポートは`automation/dashboard_guard/reports/`に出力されます。このディレクトリはGitで管理しません。テストは次のコマンドです。

```bash
python3 -m unittest discover -s tests/dashboard_guard -p 'test_*.py'
```

## 修正提案の扱い

Issueが作成された場合は、`.github/ISSUE_TEMPLATE/dashboard-repair-approval.md`の確認項目を使って、原因・影響・変更予定ファイル・テスト計画をレビューします。承認前には、Dashboard Guardが修正コード、デプロイ、URL変更、GitHub設定変更を実行することはありません。
