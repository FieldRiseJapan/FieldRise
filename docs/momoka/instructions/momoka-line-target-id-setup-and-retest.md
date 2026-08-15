# 桃花への正式指示書｜LINE_TARGET_ID取得・安全設定・本番再テスト

## 社長決定
現在のLINE自動通知システムは `LINE_TARGET_ID` 未設定により本番送信が blocked になっている。これを安全に解決し、社長のLINEへ実際に1通届くところまで確認する。

## 1. LINE_TARGET_IDの調査
現在のLINE Messaging API構成を確認し、LINE_TARGET_IDの意味、必要なIDの種類、社長LINEを送信先として特定する正しい方法、取得に必要な操作・Webhook・API等を調査する。推測でIDを作成しないこと。

## 2. セキュリティ
Channel Access TokenをIssue・報告書・通常ログへ書かない。LINE_TARGET_IDをIssueや報告書へ平文で記録しない。秘密情報はGitHub Actions Secrets等へ保存する。このチャットへTokenやTarget IDを貼らない。ログに秘密情報を出力しない。

## 3. GitHub Secret設定
正しい送信先IDが取得できたら `LINE_TARGET_ID` としてGitHub Actions Secretへ安全に登録する。既存の `LINE_CHANNEL_ACCESS_TOKEN` も含め、Secretが正しく参照されることを確認する。

## 4. 送信前検証
`LINE_TARGET_ID` が存在する、空文字でない、正しい形式である、社長LINEを送信先として特定できる、Channel Access Tokenが有効、二重送信防止が有効、を確認する。

## 5. 本番テスト
検証完了後、Dry Runではなく本番モードでテスト通知を1通だけ社長LINEへ送信する。通知内容は「🌸 桃花LINE本番テスト / 社長LINEへの到達確認」と分かるものにする。

## 6. 到達確認
GitHub Actionsの成功だけでは完了としない。社長のLINEアプリに実際に通知が届いたことを確認する。送信されなかった場合は勝手に繰り返さず原因を報告する。

## 7. Receipt
送信後、GitHubへ `task_id`、`execution_name`、`notification_status`、`sent_at`、`notification_id`、`delivery_test`、`report_commit` を記録し、成功時は `notification_status=sent` を確認する。

## 8. 二重送信確認
同一テストタスク・同一receipt keyで2通目が送信されないことを確認する。

## 9. 正式報告
`docs/momoka/reports/latest_report.md` に、LINE_TARGET_ID取得方法、Secret設定結果、セキュリティ確認、本番送信日時、送信結果、社長LINE到達結果、notification_id、receipt、二重送信確認、エラー、最終ステータスを報告する。ただしLINE_TARGET_IDそのものやTokenなどの秘密情報は記載しない。

## 完成条件
LINE_TARGET_ID取得 → GitHub Secretへ安全に登録 → 送信先検証 → 本番LINEへ1通送信 → 社長LINEへ実到達 → receipt記録 → 二重送信防止確認 → 正式報告、まで完了すること。

**社長決定：この指示書を正式なLINE_TARGET_ID設定・本番再テスト指示として扱う。**
