# Cafeシリーズ 成功・失敗パターンDB

> **目的**: 成功・失敗を感想で終わらせず、次回の設計で再利用できる「条件 → 根拠 → 行動」として蓄積する。現時点の登録は既存の制作標準から抽出した**運用仮説**であり、実験で確認できるまで`provisional`とする。

## 登録ルール

| フィールド | 内容 |
|---|---|
| `pattern_id` | 一意のID。成功は`P-S-`、失敗・回避条件は`P-F-`で始める。 |
| `type` | `success`、`failure`、`avoid_condition`のいずれか。 |
| `condition` | 成功・失敗につながった入力条件を、再利用可能な短文で書く。 |
| `evidence` | 実験ID、参照曲、タイムコード、または元資料を記録する。 |
| `effect` | 観測された結果。未実験なら「仮説」と明記する。 |
| `use_rule` | 次回に固定・回避・比較する具体的な行動を書く。 |
| `confidence` | `provisional`、`confirmed`、`deprecated`のいずれか。 |

`confirmed`へ変更するには、001・002の両方で根拠を確認するか、独立した二つ以上の実験で同じ傾向を確認する。根拠がない状態で「成功」と断定しない。

## 現在の登録

| pattern_id | type | condition | evidence | effect | use_rule | confidence |
|---|---|---|---|---|---|---|
| P-S-001 | success | Pianoを主役にし、BassとDrumsを最小限にする。 | `analysis/cafe_series_success_pattern.md` | 既存分析では、背景音楽としての余白と長時間聴取のしやすさに寄与すると整理されている。 | 001・002の観測完了後、楽器数と中域密度を固定条件候補にする。 | provisional |
| P-S-002 | success | 0:00〜0:02にWarm deep bass、0:02〜0:10にSoft Pianoを置く。 | `knowledge/prompt_design_v2.md` | 既存制作標準では、早い段階でCafeの世界観を提示するルールとして定義されている。 | A1で001・002の実際のタイムコードを記録し、B1以降の固定候補にする。 | provisional |
| P-S-003 | success | 予測可能な展開と、終端から始点へ自然につながるLoopを維持する。 | `analysis/cafe_series_success_pattern.md` | 既存分析では、没入感と背景音楽としての使いやすさに寄与すると整理されている。 | G08を必須ゲートとして判定する。 | provisional |
| P-F-001 | avoid_condition | Heavy drums、EDM、強いビルドアップを入れない。 | `knowledge/prompt_design_v2.md` | 既存制作標準では、映像・声との競合や集中阻害につながる回避条件とされている。 | プロンプトのAvoid欄へ明記し、発生時はG05/G07でタイムコードを記録する。 | provisional |
| P-F-002 | avoid_condition | Complex melodyや過度なリバーブを入れない。 | `knowledge/prompt_design_v2.md`, `experiments/cafe_series_test001.md` | 声や環境音の余白を減らし、音の輪郭をぼかす可能性がある。 | Piano密度を変数にする実験では、他の要素を固定する。 | provisional |

## 新規登録テンプレート

```yaml
pattern_id: P-S-XXX
type: success | failure | avoid_condition
condition: "再現可能な条件"
evidence:
  experiment_ids: []
  reference_models: []
  timecodes: []
  source_files: []
effect: "観測事実または、仮説であることが分かる記述"
use_rule: "次回に固定・回避・比較する行動"
confidence: provisional | confirmed | deprecated
updated_at: YYYY-MM-DD
```

## 更新手順

1. 実験台帳の結論から、再利用可能な条件だけを抽出する。
2. 実験ID・タイムコード・評価項目を`evidence`へ保存する。
3. 一回の検証結果は`provisional`で登録する。
4. 再現確認後に`confirmed`へ更新し、更新理由を追記する。
5. 反証された条件は削除せず、`deprecated`に変更して履歴を残す。

## 参考資料

[1] [Cafeシリーズ成功パターン分析](../analysis/cafe_series_success_pattern.md)
[2] [Prompt Design Ver.2](../knowledge/prompt_design_v2.md)
[3] [Cafe 003 制作実験計画](../experiments/cafe_series_test001.md)
[4] [Issue #2 — 追加タスク⑦](https://github.com/FieldRiseJapan/FieldRise/issues/2)
