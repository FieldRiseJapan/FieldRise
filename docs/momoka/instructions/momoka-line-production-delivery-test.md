# 桃花への正式指示書｜LINE自動通知システム 本番送信・到達確認

## 社長決定
LINE自動通知システムは実装・Dry Run・receipt機構まで確認済み。次の段階として、本番環境から社長のLINEへ実際に通知を1回送信し、到達を確認する。

## 1. 本番送信テスト
安全なテストタスクを1件用意し、`completed` → LINE通知を本番環境で実行する。通知先は社長のLINEとする。

## 2. 通知内容
テスト通知であることが分かる内容とする。例：
「🌸 桃花LINE自動通知 本番テスト / タスク：テストタスク / ステータス：COMPLETED / LINE自動通知システムの本番到達確認」

## 3. 本番送信前の安全確認
- LINE認証情報はSecrets等で安全に管理
- 本番送信先が社長のLINEであることを確認
- テスト通知以外の不要な通知が発生しないことを確認
- 二重送信防止が有効であることを確認
- Dry Runではなく本番モードであることを確認

## 4. 到達確認
本番送信後、社長のLINEへ実際に通知が届いたことを確認する。GitHub上の送信成功だけでは完成扱いにしない。

## 5. Receipt
本番送信後、GitHubへreceiptを記録する。最低限、`task_id`、`execution_name`、`notification_status`、`sent_at`、`notification_id`、`delivery_test`、`report_commit` を記録する。`notification_status = sent` を確認する。

## 6. 二重送信確認
同じテストタスク・同じreport_commitについて、2回目の通知が送信されないことを確認する。

## 7. 失敗時
送信失敗の場合は `notification_status = failed` として記録する。原因を報告し、勝手に本番送信を繰り返さない。

## 8. 完成条件
`completed` → 本番LINE送信 → 社長LINE到達確認 → `sent` receipt記録 → 二重送信防止確認、をすべて満たすこと。

## 9. 正式報告
`docs/momoka/reports/latest_report.md` に、本番送信日時、テストタスク、通知内容、到達結果、notification_id、receipt、二重送信テスト、エラーの有無、最終ステータスを記録する。

**「実装済み」ではなく、「社長のLINEへ実際に届いた」ことを証明すること。**

**社長決定：この指示書を正式な桃花の本番LINE到達確認指示として扱う。**
