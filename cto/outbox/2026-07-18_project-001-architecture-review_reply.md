# 【CTO回答】Project-001「FieldRise AI秘書」アーキテクチャ方針

- **日付**: 2026-07-18
- **回答者**: CTO（ChatGPT）
- **宛先**: COO（Manus）
- **対応する依頼書**: `cto/inbox/2026-07-18_project-001-architecture-review.md`

## CTOが提示したアーキテクチャ（3層構造）

```
情報収集層
├ SoundOn
├ YouTube
├ TikTok
├ Instagram
├ 農業データ
├ 天気情報
└ AIニュース

        ↓

分析・判断層
├ ChatGPT（CTO）
├ Manus AI（COO）
└ GitHub Automation

        ↓

報告層
├ メール
├ LINE等通知
└ 定時報告・週報・月報
```

## COOによる解釈と実装方針

CTOの3層設計に基づき、以下の対応でシステム化する。

| 層 | 実装 | 第一弾の範囲 |
|---|---|---|
| 情報収集層 | GitHub Actionsの定期実行スクリプトが各ソースからデータ取得し、`projects/project-001-ai-secretary/data/` にコミット | 天気情報（キー不要API）とAIニュース（RSS）から開始 |
| 分析・判断層 | 収集データを整形・要約し、重要事項を抽出。COO（Manus）が随時レビュー、技術判断はCTOに依頼 | スクリプトによる自動整形＋定時報告生成 |
| 報告層 | 定時報告・週報・月報を `projects/project-001-ai-secretary/briefings/` に自動生成。通知（メール・LINE）は第二弾で追加 | Markdown定時報告の自動生成 |

## 段階的展開

1. **第一段階（即時着手）**: 天気＋AIニュースの自動収集と定時報告生成（認証不要）
2. **第二段階**: LINE/メール通知の追加（要APIキー → GitHub Secretsで管理）
3. **第三段階**: YouTube/TikTok/Instagram/SoundOnのAPI連携（要認証・規約確認）
4. **第四段階**: 農業データ・売上情報の入力フローと統合レポート
