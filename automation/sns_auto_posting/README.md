# FieldRise SNS Auto Posting

## 管理ルール

このディレクトリは、今回計画している **TikTok / Instagram / YouTube 自動投稿システム専用** とする。

既存の `automation/social_analytics/`（SNS分析・実績収集）とは分離し、投稿システムの実装・設定・テスト・投稿履歴関連ファイルをここへ集約する。

## 対象範囲

- 曲・画像の受け入れ
- 投稿用コンテンツ生成
- キャプション生成
- ハッシュタグ生成
- Runa-Girl8215ロゴ処理との連携
- TikTok投稿
- Instagram投稿
- YouTube投稿
- 投稿予約・実行管理
- 投稿結果の記録
- 投稿失敗時の再試行・エラー管理
- 投稿前の社長確認フロー
- SNS自動投稿システムのテスト

## 既存システムとの分離

- `automation/social_analytics/` = 投稿後のSNS分析・データ収集
- `automation/sns_auto_posting/` = SNS自動投稿システム
- `.github/workflows/` = GitHub Actionsの実行入口。自動投稿用Workflowを作成する場合も、SNS自動投稿関連であることが明確に分かる命名（例: `sns-auto-posting.yml`）を使用する。

## ファイル配置ルール

今後、自動投稿システムを実装する際は、原則としてこのディレクトリ配下に専用サブディレクトリを作る。

例:

```text
automation/sns_auto_posting/
├── README.md
├── config/
├── scripts/
├── services/
├── tests/
├── templates/
├── logs/
└── data/
```

実際の構成は実装内容に応じて必要なものだけ作成する。

## セキュリティ

APIキー、アクセストークン、リフレッシュトークン、クライアントシークレット等の秘密情報をこのディレクトリへ保存しない。GitHub Actions Secrets等から実行時に注入する。

## 基本思想

社長が曲と画像を用意し、AIがSNSごとの投稿文・ハッシュタグ・投稿戦略を最適化し、社長の確認後に3SNSへ投稿できる仕組みを目指す。

最終的には投稿実績を分析側へ戻し、次の投稿改善につなげる。
