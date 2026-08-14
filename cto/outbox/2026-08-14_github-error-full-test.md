# 🌸 彩花（CTO）→桃花（COO）｜GitHub全体エラー総点検 TEST指示書

## 目的
FieldRiseJapan/FieldRise のGitHub内に、現在エラー・異常・未完了・自動化停止・報告不整合がないか総点検する。

## 1. GitHub Actions
- 全Workflowの最新実行結果を確認
- failed / cancelled / timed_out / skipped を抽出
- 現在進行中のWorkflowも確認
- エラーがあれば原因、Workflow名、Run ID、該当ログを記録

## 2. Issue / PR
- Open Issueを確認
- 未対応・ブロッカー・エラー関連Issueを抽出
- Open PR、レビュー待ち、CI失敗PRを確認

## 3. 自動通知システム
以下の一連の流れに不整合がないか確認する。
- CTO outboxへの指示書追加
- 桃花の受領
- Receipt生成
- Claim生成
- 指示実行
- 正本レポート更新
- GitHubへの反映
- 必要な場合の定時報告連携

## 4. 報告システム
以下を確認する。
- music_ai/reports/cafe/latest_report.md
- automation/
- cto/outbox/
- cto/inbox/

報告日時・内容・Commit・Claim・Receiptの整合性を確認する。

## 5. リポジトリ整合性
- 壊れた参照
- 存在しないファイルへのリンク
- 重複ファイル
- mainへの反映漏れ
- Workflow設定の不整合
- 自動化関連ファイルの欠落
を確認する。

## 6. エラー判定
問題を以下に分類する。
- 🔴 Critical：システム停止・自動通知停止
- 🟠 High：重要機能に異常
- 🟡 Medium：修正推奨
- 🟢 Normal：問題なし

## 7. 最重要ルール
推測で「正常」と判断しない。
実際のGitHub Actions、Issue、PR、Commit、ファイルを確認して判定する。

エラーを発見した場合は、
1. 原因
2. 影響範囲
3. 該当URL / Run / Commit
4. 修正方法
5. 修正した場合のCommit ID
を報告する。

## 8. 修正と再TEST
修正可能な問題は、既存資産を壊さない範囲で修正する。
修正後は必ず同じ項目を再TESTし、修正前後の状態を比較する。

社長判断が必要な変更は勝手に確定せず、保留事項として報告する。

## 9. 最終報告
最後に必ず以下を報告する。
- 総合判定：正常 / 要対応
- 発見したエラー一覧
- 未解決事項
- 自動通知システムの状態
- GitHub Actionsの状態
- Issue / PRの状態
- 修正した内容
- 再TEST結果
- 最新Commit ID
- 彩花が確認すべき事項

## 完了条件
「調査した」だけでは完了としない。

**発見 → 原因確認 → 修正可能なら修正 → 再TEST → 最終報告**
まで実施すること。

目的は、GitHub内の問題を可能な限り解消し、FieldRiseの自動通知・報告・開発基盤を正常状態にすることである。
