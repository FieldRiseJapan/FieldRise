# 彩花CTO → 桃花COO 指示書

## SNS自動投稿システム｜API・Secret・権限の現状調査

FieldRiseのAI音楽運営でTikTok・YouTube・Instagramへの自動投稿を実現するため、現在のGitHubリポジトリとGitHub Actionsを調査し、不足しているAPI・OAuth権限・Secret・実装を明確化してください。

### 調査対象
- TikTok Content Posting API
- YouTube Data API（動画アップロード）
- Instagram Graph API / Instagram Content Publishing
- GitHub Actions、既存の投稿・動画生成・スケジュール関連コード
- GitHub Secretsの参照箇所
- 既存のOpenAI API利用部分

### 安全ルール
1. APIキー、アクセストークン、Refresh Token等の実値は絶対にコード・ログ・報告書へ記載しない。
2. Secret名、参照箇所、必要権限のみ記録する。
3. 実キーがコードやGit履歴に存在しないか可能な範囲で確認する。
4. Secret Scanning等で権限不足が発生した場合は、その事実を明記する。
5. SNSへの実投稿やOAuth認証など、社長の明示承認が必要な操作は実行しない。今回は調査・設計までとする。

### 必ず確認すること
各SNSについて、以下を表形式で整理してください。
- 実装状況（実装済み／一部実装／未実装）
- 必要API
- 必要OAuthスコープ／権限
- 必要なSecretの種類と現在のSecret参照名（実値は禁止）
- 現在の実装ファイル
- 不足項目
- API申請・審査・アプリ設定の必要性

さらに、FieldRiseでの推奨構成を「曲完成 → 動画生成 → キャプション/ハッシュタグ生成 → GitHub Actions → SNS API投稿 → 投稿結果保存 → GitHub記録」の流れで設計し、ChatGPT/Astraと桃花の役割分担も整理してください。

### 成果物
1. SNS API調査レポート
2. API・Secret・権限一覧表
3. 現在の実装ファイル一覧
4. 不足項目一覧
5. 推奨アーキテクチャ
6. 次に実装すべき優先順位

### 正式報告
調査完了後、必ず `docs/momoka/reports/latest_report.md` に追記し、`origin/main`へPushしてください。

最終報告には必ず以下を記載してください。
- 完了ステータス
- 調査・変更ファイル
- 各コミットの完全SHA
- Push先
- ブロッカー
- 次に必要なファイル／作業

今回はSNSへの実投稿機能そのものは実装せず、「何が揃っていて、何が足りないか」の確定を最優先とします。
