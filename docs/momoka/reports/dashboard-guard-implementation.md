# 【桃花・実作業完了報告】Dashboard Guard 実装

> **報告区分：桃花本人の実作業報告。** 自動通知の運用結果とは分離し、ダッシュボードのエラー検知・診断・承認待ち修正支援を安全に構築した内容を記録する。

## 目的

AI Control DashboardおよびSonata Deskで発生する公開URL、同期データ、型、ビルドの問題を早期に検知する。そのうえで、承認なしにダッシュボード本体、公開設定、`main`ブランチを変更せず、GitHub上で原因・証跡・修正提案・テスト結果を確認できる状態にする。

## 実装内容

| コンポーネント | 保存先 | 役割 |
|---|---|---|
| 読み取り専用監視プログラム | `automation/dashboard_guard/dashboard_guard.py` | URL、JSON、型、ビルドを検査し、JSON／Markdownの診断レポートを作成 |
| 安全設定 | `automation/dashboard_guard/config.json` | 対象URL、対象アプリ、正本データ、保護対象、承認境界を宣言 |
| GitHub Actions | `.github/workflows/dashboard-guard.yml` | Push時、毎朝7:15 JST、手動実行時に監視。異常時だけ承認待ちIssueを作成・更新 |
| 承認テンプレート | `.github/ISSUE_TEMPLATE/dashboard-repair-approval.md` | 修正用ブランチ、main反映、公開の承認を段階的に分離 |
| 運用手順 | `automation/dashboard_guard/README.md` | 監視対象、手動実行、承認フロー、禁止事項を記載 |
| 回帰テスト | `tests/dashboard_guard/test_dashboard_guard.py` | 保護対象の非変更、失敗時の承認待ち提案、JSON非破壊、レポート表示を検証 |

## 安全境界

Dashboard Guardは次の行為を自動実行しない。

| 禁止対象 | 理由 |
|---|---|
| ダッシュボードのソースコード変更 | 社長の明示承認が必要 |
| 静的公開物・GitHub Pages設定の変更 | 公開内容と到達性に影響するため |
| ワークフロー権限・GitHub設定の変更 | システム構成変更に当たるため |
| 修正用ブランチ作成、`main`反映、再公開 | 修正内容とテスト結果を承認後に実施するため |

異常時は、GitHub Actionsが診断レポートを成果物として保持し、承認待ちIssueを作成または更新する。Issueには、問題、影響範囲、安全な診断手順、承認が必要な修正提案を記載する。自動修正はしない。

## 検証結果

| 検証 | 結果 |
|---|---|
| ユニットテスト | 4件すべて成功 |
| 監視プログラムの実行 | 正常。公開URL、JSON、型、ビルドをすべて合格と判定 |
| GitHub Actions初回実行 | 成功。Run `31891297518` |
| Issue自動作成 | 正常時は作成されないことを確認 |
| 監視対象 | AI Control DashboardおよびSonata DeskのGitHub Pages公開URL、正本JSON、型、ビルド |

## 運用上の注意

異常検知が起きた場合、Issueの修正提案は**承認待ち**である。社長がIssueテンプレートの承認項目を確認した後にのみ、修正用ブランチの作成、パッチ適用、テスト、main反映、公開を進める。

## 完了判定

**完了。** GitHub内でエラー検知、証跡収集、修正提案、テスト、承認待ちIssue報告を行う安全な自動修正支援プログラムを構築した。
