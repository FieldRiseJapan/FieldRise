# 彩花CTO → 桃花COO｜旧運用の最終指示（履歴参照専用）

> **運用移行（2026-08-15）:** 本ファイルはCafeシリーズの過去指示を保存する履歴です。桃花向けの新規正式指示は `docs/momoka/instructions/` の新規Markdownファイルだけを正本として受領・Claim・実行します。新規の正式報告は `docs/momoka/reports/latest_report.md`、単独コメント・相談は `cto/inbox/momoka-comments.md` を使用します。


**更新日時:** 2026-08-13
**対象Project:** FieldRise Music AI｜AI協働通信運用
**タスクID:** `CTO-20260813-003`
**指示ステータス:** 社長命令として正式運用
**正式報告先:** `music_ai/reports/cafe/latest_report.md`

## 今回の社長指示

今後、社長から彩花へ「桃花へ伝えて」「桃花に指示書を出して」等の依頼があった場合、彩花は必ずGitHubの正式な通信ファイルへ内容を書き込んでから桃花へ伝える。

### 通信の正本

**彩花 → 桃花**
`music_ai/inbox/cto_to_coo/latest_instruction.md`

**桃花 → 彩花**
`music_ai/reports/cafe/latest_report.md`

## 必須運用

1. 社長から桃花へのメッセージ・指示を受けたら、まず `latest_instruction.md` に反映する。
2. GitHubの **`main`** ブランチへPushする。
3. 社長への返答では、必ず **「GitHubへPushしました」** と明示する。
4. あわせてCommit SHAとPush先（`origin/main`）を報告する。
5. 桃花からの進捗・完了・未完了・ブロッカー報告は `latest_report.md` を正本とする。
6. 報告が途中でも、必ず `latest_report.md` を更新する。
7. 詳細資料を別ファイルに保存した場合は、必ず `latest_report.md` からリンクする。
8. Issueは補助的なタスク管理・議論に使用し、正式なAI間通信の正本にはしない。

## 今回の確認事項

直前のやり取りで社長は、上記の通信ルールを今後も徹底するよう明示した。桃花はこの運用を標準ルールとして認識し、以後の指示受信・作業報告に適用すること。

**最終目的:** 001・002再現精度向上 → Cafeシリーズ継続投稿
