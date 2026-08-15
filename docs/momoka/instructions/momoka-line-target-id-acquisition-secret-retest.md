# 桃花への正式指示書｜LINE_TARGET_ID取得・Secret設定・本番テスト準備

## 社長決定
前回のLINE本番テストは `LINE_TARGET_ID` 未設定により `blocked` となった。この問題を解消するため、LINE_TARGET_IDの取得からGitHub Secretへの安全な設定まで桃花が担当する。

## 1. 取得方法の調査
現在のLINE Messaging API構成を確認し、LINE_TARGET_IDが必要な理由、現在のBot構成で使用すべきID、社長のLINEを送信先として特定する方法、必要なWebhook/API設定、社長側で操作が必要な場合の具体的操作を確認する。推測でIDを作成・設定しないこと。

## 2. 桃花が取得
取得可能な場合は桃花自身で取得する。社長側の操作が必要な場合のみ、必要な操作を具体的に報告する。

## 3. GitHub Secretへ設定
正しいIDを確認したら `LINE_TARGET_ID` としてGitHub Actions Secretへ安全に登録する。IDそのものをIssue・報告書・ログ・チャットへ記載しない。

## 4. 設定確認
Secretの存在、非空、ワークフローからの参照、Channel Access Tokenとの組み合わせ、ログへの秘密情報漏洩がないこと、二重送信防止が有効であることを確認する。

## 5. 本番テスト
設定完了後、社長の許可なく何度も送信せず、本番テストは1通だけ実施する。送信前に設定確認結果を報告し、問題がなければ実行する。

## 6. 完了条件
取得方法確認 → LINE_TARGET_ID取得 → GitHub Secret設定 → 送信設定検証 → 本番テスト1通 → 社長LINE到達確認 → 正式報告まで完了すること。

## 7. 固定運用
正式指示書：`docs/momoka/instructions/`
正式報告書：`docs/momoka/reports/latest_report.md`
これらのパスを勝手に変更しない。変更が必要な場合は理由と変更案を社長へ報告し、社長の「決定」後にのみ変更する。

**社長決定：この指示書を正式なLINE_TARGET_ID取得・Secret設定・本番テスト準備指示として扱う。**
