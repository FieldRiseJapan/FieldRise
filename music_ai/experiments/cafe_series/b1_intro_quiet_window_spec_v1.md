# B1｜導入静音長 A/B検証仕様 Ver.1

**実験ID:** `B1-INTRO-QUIET-001`
**状態:** 生成前の設計完了／SUNO生成は未実施
**参照モデル:** 001（再現基準）および002（0.21秒の参照トラック閾値到達）
**比較基準候補:** Cafe008-1Bの質感・メロディ保持、Cafe008-1Aの深い開始静音の観察結果

> **検証目的:** 導入の静かな区間の長さだけを変更し、0.3秒と2.3秒のどちらが001・002の参照特性、BGM適性、質感、メロディ保持にどう影響するかを比較可能にする。音色、メロディ、テンポ、SUNO設定、ネガティブ指定を同時に変えない。

## 現時点の根拠

| 根拠 | Fact | B1での扱い |
|---|---|---|
| 001 Bass仕様 | 001 Bassステムは0.02秒開始、1.8秒Swell | 001との比較ではBassの開始・Swellを別項目として測る |
| 002参照音源 | -60dBFS RMS閾値を0.21秒で初めて超える。0.0〜0.3秒全体は無音ではない | 0.3秒案は002参照の初期静音量に近い比較点として扱う |
| Cafe008-1A | 既存分析で初期音量-73.7dB、Swell 1.01秒、Centroid 452Hz | 深い開始静音の候補。ただし原WAV未提供のため再測定前は既存報告値 |
| Cafe008-1B | 既存分析で一致率95.8%、Centroid 619Hz、密度2.49音/秒 | 質感・メロディ保持の候補。ただし原WAV・Prompt・設定未提供 |

## 変更変数は1つだけ

| 変数 | A：0.3秒案 | B：2.3秒案 | 固定条件 |
|---|---:|---:|---|
| `target_intro_quiet_window_sec` | 0.3秒 | 2.3秒 | **この項目だけ**を変更する |
| Baseline Prompt | 完全に同一 | 完全に同一 | 採用するBaseline Prompt全文を生成前に台帳へ保存する |
| SUNO Model／Custom Mode | 完全に同一 | 完全に同一 | 生成前に台帳へ保存する |
| Weirdness／Style Influence／Duration | 完全に同一 | 完全に同一 | 生成前に台帳へ保存する |
| 楽器・Key・Tempo・Negative指定 | 完全に同一 | 完全に同一 | 静音長以外の文言変更は禁止 |
| 評価器・測定区間・採点重み | 完全に同一 | 完全に同一 | 同じAnalyzer版・Score Cardで比較する |

## Prompt差分の固定方法

Baseline Promptの本文を両案で完全一致させ、末尾に加える次の1行だけを変えます。Baseline本文・SUNO設定が未記録のまま生成すると、静音長以外の要因を排除できないため、B1の比較は無効とします。

| Variant | 追加する唯一の差分行 |
|---|---|
| `B1-A-0.3` | `Use a quiet lead-in of approximately 0.3 seconds before the first focal instrumental onset.` |
| `B1-B-2.3` | `Use a quiet lead-in of approximately 2.3 seconds before the first focal instrumental onset.` |

## 生成後の必須記録と判定

| 評価領域 | 測定・確認項目 | 判定の扱い |
|---|---|---|
| 導入 | -60dBFS閾値到達、0.0〜0.3秒RMS、0.3〜2.3秒RMS、Peak、最初の焦点楽器の開始 | A/Bの数値差として記録する。意図した秒数を達成したかと音楽的適性を混同しない |
| 001再現 | Bass開始、Swell、Centroid、RMS、Rest、Loop | 測定範囲が001の正本と揃う項目だけを正規比較する |
| BGM品質 | Voiceover、Pianoの間、Brushの主張、突然の展開、長時間適性 | 自動値と社長・CTOの聴感評価を別欄に保存する |
| 再現度 | 共通Score Card、Quality Gate、Evidence | Gate通過はKnowledge昇格ではない。人の承認が必須 |

## 事前ブロッカー

| ブロッカー | B1への影響 | 解消条件 |
|---|---|---|
| Cafe008-1A／1Bの原WAVが未保存 | 既存値を再測定できず、Analyzerの連続性が証明できない | 原WAVまたは権利確認済みの保管先を登録する |
| B1 Baseline Prompt・SUNO設定が未記録 | 静音長以外の変数を固定できない | 生成前に`generation_registry.jsonl`へPrompt版・設定を記録する |
| 002 Main独立音源が未提供 | 002 Mainの無音問題を直接比較できない | 対象音源を提供しP0プローブを再実行する |

> **次の実行:** 生成は社長のSUNO操作と別途明示指示が必要です。生成後、桃花は音源を登録し、`probe_intro.py`、`compare_metrics.py`、`quality_gate.py`を実行して、正式報告を更新します。
