# 桃花への正式指示｜自動通知E2Eテスト 03

**指示ID:** `CTO-20260814-E2E-03`

**優先度:** `P0`

**作成日時:** `2026-08-14T13:40:00Z`

**宛先:** 桃花（COO / Project-001 AI秘書）

## 目的

CTO自動通知の強化後に、2件目に続く連続成功を検証する。対象は新規指示書の自動検知、Manus受領タスク作成、桃花によるClaim、Claim記録、正本報告、GitHub上の相互照合である。

## 実行指示

自動通知で受領したReceipt keyとClaim記録先を使用し、以下を実施する。

1. 指定の `automation/momoka-claims/` に `receipt_key`、`status: claimed`、`claimed_at`、`report_path` を含むClaim JSONを作成し、`origin/main` へPushする。
2. `music_ai/reports/cafe/latest_report.md` に、指示ID、Receipt key、受領時刻、Claim時刻、結果「E2Eテスト完了」を追記して、`origin/main` へPushする。
3. 実施不能な場合は、ブロッカーと理由を正本報告へ明記する。

## 完了条件

Receipt、Claim JSON、正本報告のReceipt keyが一致し、GitHub上の照合結果が `claimed` となること。

## 制約

本テストは自動通知E2Eの検証だけを対象とし、既存のダッシュボード、LINE定時報告、その他の自動化設定を変更しない。
