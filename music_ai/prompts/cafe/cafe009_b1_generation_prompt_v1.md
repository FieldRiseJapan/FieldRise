# 検証用Cafe009 B1｜SUNO生成プロンプト Ver.1

**対象Project:** FieldRise Music AI｜001・002再現
**実験ID:** `B1-INTRO-QUIET-001`
**Prompt版:** `CAFE009-B1-v1`
**状態:** 生成前。社長によるSUNO手動生成待ち
**正式指示:** [`CTO-20260813-002`](../../inbox/cto_to_coo/latest_instruction.md)

> **検証原則:** A/Bで変えるのは、導入静音長を指定する末尾の1行だけです。Style、構造、Key、Tempo、楽器、ネガティブ指定、SUNO設定は完全に固定します。

## 命名規則

| Variant | SUNO上の曲名 |
|---|---|
| A | `検証用Cafe009 B1-A-0.3` |
| B | `検証用Cafe009 B1-B-2.3` |

## 固定SUNO設定

| 項目 | 固定値 | 区分 |
|---|---|---|
| Custom Mode | ON | 固定 |
| Model | 生成画面で選んだ同一Model名をA/B両方で記録する | 生成前にRegistryへ記入 |
| Weirdness | **3**（Safe寄り） | Hypothesis／A/Bで固定 |
| Style Influence | **95**（Strong寄り） | Hypothesis／A/Bで固定 |
| Duration | **30 seconds** | Hypothesis／A/Bで固定 |
| Instrumental | ON。Lyrics欄は空欄 | 固定 |

## Style of Music｜A/B共通

```text
Minimal voiceover-friendly cafe jazz instrumental, F major, 118 BPM, warm mellow acoustic piano, warm upright walking bass, soft brush drums, sparse arrangement, ample intentional rests, gentle swing, constant mezzo-piano dynamics, sophisticated relaxed cafe atmosphere, natural seamless loop potential, long-form background music for cooking, reading, work and lifestyle videos. The bass has a deep wooden body, rounded soft onset and long warm decay. The piano speaks in short conversational phrases and never dominates the mid-range. Keep the mix open for narration.
```

## Prompt / Lyrics Section｜A/B共通Baseline

```text
[Intro]
At the first focal instrumental onset, begin with a warm upright bass that blooms with a very gradual 1.8-second swell, rounded and soft with no sharp transient. Let a warm acoustic piano enter sparsely after the bass onset, leaving generous natural rests. Keep soft brush drums quiet and far in the background. Establish a calm, elegant cafe atmosphere without a hook or dramatic gesture.

[Verse]
Maintain a warm upright walking bass, short conversational acoustic-piano phrases, and barely-there brush drums. Preserve ample breathing room between phrases. Keep volume stable and gentle; the mid-range must stay open for voiceover.

[Chorus]
Continue the same restrained loop without a build-up. No instrument should demand attention. Keep the relaxed cafe background texture, natural loop potential, and constant gentle dynamics.
```

## 追加する唯一の差分行

| Variant | Baseline末尾に追加する一行のみ |
|---|---|
| `検証用Cafe009 B1-A-0.3` | `Use a quiet lead-in of approximately 0.3 seconds before the first focal instrumental onset.` |
| `検証用Cafe009 B1-B-2.3` | `Use a quiet lead-in of approximately 2.3 seconds before the first focal instrumental onset.` |

## Negative指定｜A/B共通

```text
No vocals, no lyrics, no EDM, no electronic drops, no hard kick, no snare crack, no cymbal crash, no bright hi-hat pattern, no sharp bass attack, no slap bass, no staccato bass, no dramatic build-up, no cinematic climax, no dense melody, no sudden volume spike, no busy arrangement, no dominant solo.
```

## 生成前チェック

- [ ] A/Bで曲名、Prompt版、選択Model名、Custom Mode、Weirdness、Style Influence、Duration、Instrumentalを記録した。
- [ ] A/Bで上記の**唯一の差分行以外**が完全一致している。
- [ ] 生成後の原WAVを保存し、分析対象として登録する場所を決めた。
- [ ] 生成後に `probe_intro.py`、`compare_metrics.py`、`quality_gate.py` を実行し、`latest_report.md` を更新する。

## Fact / Hypothesis

| 区分 | 内容 |
|---|---|
| **Fact** | 001 Bassステムは0.02秒開始、約1.8秒のSwellを持つ。002参照音源は-60dBFS RMS閾値を0.21秒で初めて超える。 |
| **Fact** | B1では静音長以外を変えると、比較の原因を分離できない。 |
| **Hypothesis** | Weirdness 3、Style Influence 95、Duration 30秒は、再現性と比較可能性を高める。生成結果で検証する。 |
| **Hypothesis** | 0.3秒案と2.3秒案のどちらがBGM適性・Bass開始・Rest・Voiceover適性に近いかは、生成後の測定と人の評価で判断する。 |
