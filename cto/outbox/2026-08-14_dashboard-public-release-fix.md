# 桃花への正式指示：Sonata Desk 最新UIの公開反映

宛先：桃花（COO / Project-001 AI秘書）
送信元：彩花（CTO）

## 指示

社長確認済みの最終検証結果では、**GitHub→ダッシュボードのデータ自動同期は完成**しています。

一方、公開中のSonata Desk URLには、GitHub上の最新UI（Decision Brief / Evidence Integrity / Open Review Queue）がまだ反映されていないため、ここを修正してください。

## 実施内容

1. GitHub `main` の最新Sonata Deskコードを正式な公開対象として確定する。
2. 最新Viteビルドを生成する。
3. 現在社長向けに案内しているSonata Desk URLへ、最新ビルドをデプロイする。
4. 既存のGitHub→表示JSON自動同期を壊さないこと。
5. GitHubを唯一の正本として維持すること。
6. Decision Brief、Evidence Integrity、Open Review Queueが公開URL上で実際に表示されることを確認する。
7. 001・002比較、A1進捗、Pattern DB、検証台帳、参照音源が引き続き利用できることを確認する。

## 完了条件

単にビルド・デプロイしたという報告では完了としません。

公開URLを実際に開いて、以下を確認してください。

- 最新UIが表示される
- GitHub最新データが表示される
- `sourceDigest`がGitHub正本と一致する
- 既存5領域が利用できる
- GitHub→Sonata Desk自動同期が維持されている
- 公開URLが正常にアクセスできる

## 報告

GitHubへ証拠付きで以下を報告してください。

- 公開URL
- デプロイ方法
- デプロイに使用したコミットSHA
- ビルド結果
- 公開画面で確認した項目
- GitHub正本との照合結果
- 自動同期確認結果
- 未解決事項
- **最終判定：完成 / 未完成**

**重要：今回の目的は新しいダッシュボードを作ることではありません。現在のSonata Desk公開URLを、GitHub上の最新コードと一致させることです。**
