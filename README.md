# FieldRise AI協働本部

**「データで学び、AIで創り、人が価値を決める。」**

このリポジトリは、FieldRiseの経営体制における**AI社員の共同作業場（AI協働本部）**です。
社長・COO（桃花／Manus）・CTO（彩花／ChatGPT）・AI社員（Muse）・Automation担当（GitHub Actions）が、このリポジトリを通じて情報を共有し、協力して業務を遂行します。

## 体制

| 役職 | 担当 | 役割 |
|---|---|---|
| 社長 | 人間（最終判断者） | 創造・判断・責任 |
| COO | 桃花（Manus AI） | 実務遂行、調査、動画制作支援、SNS運営支援、AI秘書プロジェクト推進、業務改善提案 |
| CTO | 彩花（ChatGPT） | 技術戦略、設計レビュー、技術的助言 |
| AI社員 | Muse | リサーチ、情報収集、分析、改善提案、調査報告 |
| Automation | GitHub Actions | 定期実行、自動化ワークフロー |

## ディレクトリ構成

```
FieldRise/
├── README.md                  ... 本ファイル（体制と使い方）
├── docs/
│   ├── company-policy.md      ... 会社理念・AI社員基本方針
│   ├── collaboration-rules.md ... AI社員間の連携ルール
│   └── muse/                  ... Muse専用の調査・分析・報告・テンプレート
├── cto/
│   ├── inbox/                 ... COO→CTOへの依頼・相談（ChatGPTに渡す指示書）
│   └── outbox/                ... CTO→COOへの回答・成果物（ChatGPTの出力を保存）
├── coo/
│   └── reports/               ... COOの作業報告・調査結果
├── projects/
│   └── project-001-ai-secretary/ ... Project-001: FieldRise AI秘書
├── automation/
│   └── (GitHub Actions ワークフロー関連の設計書・スクリプト)
└── .github/
    └── workflows/             ... 自動化ワークフロー定義
```

## 連携の基本フロー

1. **社長 → COO（Manus）**: Manusのタスクで指示
2. **COO → CTO（ChatGPT）**: `cto/inbox/` に依頼書（Markdown）をコミット。社長がChatGPTにそのファイル（またはリンク）を渡す
3. **CTO → COO**: ChatGPTの回答を `cto/outbox/` に保存（社長が貼り付け、またはChatGPTのGitHub連携機能で直接参照）
4. **Automation（GitHub Actions）**: 定期実行タスクは `.github/workflows/` で管理し、結果をリポジトリにコミット
5. **COO → 社長**: 重要事項は速やかに報告
6. **Muse → 社長／CTO／COO**: `docs/muse/` に公開可能な調査・分析・報告を保存して共有

## 情報セキュリティ

- APIキー・パスワード・個人情報は**このリポジトリにコミットしない**
- 機密値はGitHub Secrets（Settings → Secrets and variables → Actions）で管理する
- 必要最小限の情報のみ利用し、安全性を最優先する

---

*AI創業記念日: 2026年7月18日*
