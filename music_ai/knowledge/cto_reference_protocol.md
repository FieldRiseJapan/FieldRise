# 彩花向け — 次回検証の参照・判断手順

> **目的**: GitHubに保存された最新記録から、次の検証で何を固定し、何を一つだけ変えるかを判断する。自動でプロンプトを決めることではなく、判断根拠を揃えることを優先する。

## 参照する順番

| 順番 | 参照先 | 確認すること | 判断への使い方 |
|---:|---|---|---|
| 1 | [`reports/cafe/latest_report.md`](../reports/cafe/latest_report.md) | 現在の完了状況、ブロッカー、次の決定事項 | まず未完了の前提を把握する。 |
| 2 | [`reference_music/ground_truth_spec_v1.md`](../reference_music/ground_truth_spec_v1.md) | G01〜G09、必須ゲート、正解データの定義 | 評価の観点を固定する。 |
| 3 | [`reference_music/success_song_001.md`](../reference_music/success_song_001.md) と `002` | 001・002の観測済み・未観測項目 | 未観測が残っている場合、派生実験を開始しない。 |
| 4 | [`experiments/`](../experiments/) の最新台帳 | 直近実験の変更変数、結論、次の一手 | 同じ変数を無目的に繰り返さない。 |
| 5 | [`suno_database/successful_patterns.md`](../suno_database/successful_patterns.md) | `confirmed` と `provisional` の条件 | 固定条件候補と回避条件を選ぶ。 |
| 6 | [`evaluations/evaluation_rules.md`](../evaluations/evaluation_rules.md) | 採点方法と必須ゲート | 結論の形式を統一する。 |

## 彩花が出す設計指示の最小形式

```yaml
next_experiment_id: "B1"
purpose: "何を再現・改善したいか"
reference_models: ["001", "002"]
fixed_conditions:
  - "A1で確認済みの条件"
changed_variable: "一つだけ"
expected_effect: "G03が上がる、など"
reject_if: "G01/G07/G08が不通過、など"
evaluation_version: "v1"
reasoning_sources:
  - "参照した実験ID・Pattern ID・ファイル"
```

## 今回の判断

**A1が未完了の間は、B1以降の生成条件を確定しない。** 001・002の音源参照先と、G01〜G08の観測がないためである。A1が完了した後は、B1で`Pianoの音数・間`など一つの変数だけを変更し、ほかの条件を固定する。

Cooking、Focus、Morning、Nightのような用途別設計は、001・002再現の基準が固定された後に扱う。用途別の派生は、再現実験と同一の目的・スコアとして比較しない。

## 返信先

彩花の判断は、`cto/outbox/2026-08-12_001-002-reproduction-base-report_reply.md` に、上記の最小形式で保存する。桃花は、承認済みの固定条件と変更変数を実験台帳へ転記し、生成結果・評価・Pattern DB更新までを記録する。

## 参考資料

[1] [Issue #2 — 追加タスク⑧と正式フロー](https://github.com/FieldRiseJapan/FieldRise/issues/2)  
[2] [FieldRise Music AI 全体設計](../strategy/Music_AI_System_Design.md)  
[3] [001・002 正解データ仕様 Ver.1](../reference_music/ground_truth_spec_v1.md)
