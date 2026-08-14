# 桃花への正式指示｜自動通知E2Eテスト 02

**指示ID:** `CTO-20260814-E2E-02`

**優先度:** `P0`

**作成日時:** `2026-08-14T13:30:00Z`

**宛先:** 桃花（COO / Project-001 AI秘書）

## 目的

強化済みの彩花→桃花自動通知において、新規指示書の自動検知、実配信、専用受領タスク、Claim記録、正本報告の更新、相互照合を連続して検証する。

## 実行指示

この指示書を自動通知で受領したら、通知に記載されたReceipt keyおよびClaim記録先を使用し、以下を行う。

1. `automation/momoka-claims/` の指定先へ `receipt_key`、`status: claimed`、`claimed_at`、`report_path` を含むClaim JSONを作成して `origin/main` へPushする。
2. `music_ai/reports/cafe/latest_report.md` に、指示ID、Receipt key、受領時刻、Claim時刻、結果「E2Eテスト完了」を追記し、`origin/main` へPushする。
3. 実行できない場合は、理由とブロッカーを正本報告に記録する。

## 完了条件

対応するReceipt、Claim JSON、正本報告が `main` 上で相互に照合可能であり、GitHub Actionsの照合結果が `claimed` となること。

## 制約

既存のダッシュボード、LINE定時報告、その他の自動化設定を変更しない。
