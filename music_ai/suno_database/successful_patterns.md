# Cafeシリーズ 成功・失敗パターンDB

> **目的**: 成功・失敗を感想で終わらせず、次回の設計で再利用できる「条件 → 根拠 → 行動」として蓄積する。`confirmed`は001・002の双方または独立した複数実験で実測根拠を確認した条件、`provisional`は仮説または聴取確認前の条件とする。

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

## 現在の登録

| pattern_id | type | condition | evidence | use_rule | confidence |
|---|---|---|---|---|---|
| P-S-001 | success | Pianoを主役にし、BassとDrumsを最小限にする。 | 既存成功パターン分析 | 001・002の聴取レビューでPiano／Keysの役割を確認する。 | provisional |
| P-S-002 | success | 0:00〜0:02にWarm deep bassを置く。 | 既存制作標準、A1 | 001・002でBass Onsetが0.464秒。B1以降は0.5秒未満のBass立ち上がりを固定する。 | confirmed |
| P-S-003 | success | 予測可能な展開と自然なLoopを維持する。 | 既存成功パターン分析、001の近似値0.9914 | 終端→開始を聴取し、G08の最終判定後に固定条件化する。 | provisional |
| P-S-004 | success | Intro 0〜2秒を低域主導にし、DrumsをBassより大幅に後退させる。 | A1：Bass低域比率84.21〜98.73%、Drums RMSはBassより約37〜40 dB低い。 | B1以降、Introで強いDrumsを入れない。 | confirmed |
| P-S-005 | success | 推定80〜86 BPM帯からCafe BGMを設計する。 | A1：001 86.13 BPM、002 80.75 BPM。 | B1はこの範囲を固定し、テンポを変更変数にしない。 | confirmed |
| P-S-006 | success | ボーカルを主成分にしない。 | A1：ボーカルRMSは001 -108.55、002 -80.83 dBFS。 | Voiceover-friendlyを維持し、主旋律の歌唱を入れない。 | confirmed |
| P-F-001 | avoid_condition | Heavy drums、EDM、強いビルドアップを入れない。 | 既存制作標準 | プロンプトのAvoid欄へ明記する。 | provisional |
| P-F-002 | avoid_condition | Complex melodyや過度なリバーブを入れない。 | 既存制作標準、Cafe 003計画 | Piano密度を変数にする際、他の要素を固定する。 | provisional |
| P-F-003 | failure | 無音のMainを正解データとして採用しない。 | A1：002 MainはRMS -240.00 dBFS。 | MainのRMS・Onset・ステム再構成を入力検証に追加する。 | confirmed |

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
4. 001・002の両方、または複数実験で根拠を確認後に`confirmed`へ更新する。
5. 反証された条件は削除せず、`deprecated`に変更して履歴を残す。

## 参考資料

[1] [001・002 ステム実測レポート](../analysis/cafe/2026-08-12_001-002-stem-measurement.md)
[2] [Cafeシリーズ成功パターン分析](../analysis/cafe_series_success_pattern.md)
[3] [Prompt Design Ver.2](../knowledge/prompt_design_v2.md)
