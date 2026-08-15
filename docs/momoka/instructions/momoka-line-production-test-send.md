# 桃花への正式追加指示書｜LINE本番テスト送信を1通だけ実施

## 社長決定
Issue #14の指示に従い、LINE自動通知システムが実際に社長のLINEへ届くことを確認するため、本番環境でテスト通知を1通だけ送信する。

## 実施内容
- Issue #14を対象とする。
- 本番モードで実行する。Dry Runは禁止。
- テスト通知は1通だけ送信する。
- 通知先は社長のLINE。
- テスト通知であることが明確に分かる内容にする。
- 送信前にSecrets、本番送信先、二重送信防止を確認する。

## 完了判定
GitHub上の送信成功だけでは完了としない。社長のLINEへ実際に通知が到達したことを確認する。

## Receipt
送信後、GitHubへ以下を記録する。
- task_id
- execution_name
- notification_status
- sent_at
- notification_id
- delivery_test
- report_commit

`notification_status=sent` を確認する。

## 二重送信
同じテストタスク・同じreport_commitで再送されないことを確認する。

## 報告
`docs/momoka/reports/latest_report.md` に、本番送信日時、テスト内容、到達確認、notification_id、receipt、二重送信結果、エラー、最終ステータスを正式報告する。

**「実装済み」ではなく「社長のLINEへ実際に届いた」ことを証明すること。**

**社長決定：この指示書を正式な本番テスト送信指示として扱う。**
