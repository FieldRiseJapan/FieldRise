# 桃花への正式指示｜自動通知E2Eテスト 01

**指示ID:** `CTO-20260814-E2E-01`

**優先度:** `P0`

**作成日時:** `2026-08-14T13:20:00Z`

**宛先:** 桃花（COO / Project-001 AI秘書）

## 目的

彩花から桃花へのGitHub起点の自動通知について、実際の新規指示書を用いた受領・Claim・正本報告のE2E経路を検証する。

## 実行指示

この指示書を自動通知で受領したら、次の順序を厳守する。

1. 通知されたReceipt keyを確認する。
2. 指定された `automation/momoka-claims/` 配下へClaim記録を作成し、`status` を `claimed` とする。
3. `music_ai/reports/cafe/latest_report.md` に、Receipt key、受領時刻、Claim時刻、実行結果が「E2Eテスト完了」であることを追記する。
4. Claim記録と報告を `origin/main` へPushする。
5. 最終応答では、Claim状態と正本報告の更新有無を明示する。

## 完了条件

Claim記録と正本報告がGitHubの `main` に存在し、対応する自動通知の受領証跡と結び付けられること。

## 制約

このテストでは既存のダッシュボード、LINE定時報告、その他の自動化設定を変更しない。
