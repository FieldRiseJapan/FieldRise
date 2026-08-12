# 実験台帳テンプレート

> **目的**: 検証番号 → プロンプト → SUNO設定 → 生成結果 → 分析 → 結論を、一つのファイルで追跡する。1実験で変更する変数は原則一つとする。

## 管理情報

```yaml
experiment_id: "A1"
status: planned | generated | evaluated | adopted | rejected | blocked
created_at: YYYY-MM-DD
owner: "桃花"
reference_models: ["001", "002"]
purpose: null
changed_variable: null
fixed_conditions: []
```

## 1. 仮説

| 項目 | 記録 |
|---|---|
| 確かめること | 未記入 |
| 変更する変数 | 未記入 |
| 固定する条件 | 未記入 |
| 期待する効果 | 未記入 |
| 不採用条件 | 未記入 |

## 2. プロンプト

```text
Prompt:

Avoid:
```

## 3. SUNO設定

| 項目 | 値 | 変更理由 |
|---|---|---|
| Weirdness | 未記入 |  |
| Style Influence | 未記入 |  |
| Duration | 未記入 |  |
| その他 | 未記入 |  |

## 4. 生成結果

| 項目 | 記録 |
|---|---|
| 生成日時 | 未記入 |
| 生成結果URLまたはファイル | 未記入 |
| 生成回数・Credit | 未記入 |
| 音源の可聴状態 | 未記入 |

## 5. 評価

`../reference_music/ground_truth_spec_v1.md` のG01〜G09に沿って採点する。

| ID | 点数 | 根拠タイムコード | 観測メモ |
|---|---:|---|---|
| G01 |  |  |  |
| G02 |  |  |  |
| G03 |  |  |  |
| G04 |  |  |  |
| G05 |  |  |  |
| G06 |  |  |  |
| G07 |  |  |  |
| G08 |  |  |  |
| G09 |  |  |  |
| **合計** |  |  |  |

## 6. 結論

```yaml
gates:
  g01_intro: pending
  g07_noise: pending
  g08_loop: pending
decision: hold
reason: "未記入"
pattern_updates: []
next_action: "未記入"
```

## 7. 確認チェック

- [ ] 実験IDがファイル名・生成ログ・Pattern DBに一致している。
- [ ] 変更変数が一つに限定されている。
- [ ] 生成結果への参照先がある。
- [ ] 結論と次回の一手が記録されている。
