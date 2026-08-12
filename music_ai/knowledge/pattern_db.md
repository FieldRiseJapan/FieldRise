# Cafe Pattern DB

**目的:** 成功・失敗・未検証パターンを、Promptの印象ではなくEvidence付きで参照する。各項目はFact、Hypothesis、Blockedを混在させず、次回検証の一変数を明記する。

| Pattern ID | 状態 | パターン | Evidence | 再利用条件 | 次の検証 |
|---|---|---|---|---|---|
| `P-001` | Fact | 001のBassステムは0.02秒開始、1.8秒Swell、860Hz Centroid | `001_Design_Spec.md` | Bassステムと同じ測定範囲を使う比較だけで数値比較する | 新規候補のBass測定範囲を固定する |
| `P-002` | Fact | 001は全体RMS -16.8dBFS、固定ダイナミクス、約30秒Main Loop | `001_Design_Spec.md` | Full trackの同じ集約法を使う場合に限る | 共通Analyzerの出力仕様へ追加する |
| `P-003` | Fact | 002参照音源は-60dBFS閾値を0.21秒で超えるが、0.0〜0.3秒全体は無音ではない | `p0_002_intro_probe.json` | `cafe_rainy.wav`と同じプローブ条件を使う場合 | 002 Main独立音源の提供後に再測定する |
| `P-004` | Existing reported value | Cafe008-1Bは既存分析で95.8%と記録され、A1より高い総合値を持つ | `cafe_20260811_1B_analysis.md` | 原WAV・Prompt・設定を取得するまでは再現済みFactに昇格しない | B1では質感・メロディ関連を固定候補にする |
| `P-005` | Hypothesis | 0.3秒と2.3秒の静かな導入を単独変数にすれば、導入長の寄与を比較できる | `FACT-002-REFERENCE-THRESHOLD`、`HYP-B1-INTRO-SILENCE` | それ以外のPrompt、SUNO設定、評価法を固定する | B1 A/B試験を実施する |

> **禁止事項:** Evidenceがない語句、設定、スコアを「成功パターン」としてKnowledgeへ昇格しない。Pattern DBは生成の根拠を探すためのものであり、生成を自動実行する仕組みではない。
