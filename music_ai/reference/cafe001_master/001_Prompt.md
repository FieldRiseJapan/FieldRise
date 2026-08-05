# Cafe001 Master Prompt (SUNO AI)

## 📋 概要
本ドキュメントは、FieldRise Music AIの最高位マスターリファレンスである成功モデル001「cafe」をSUNO AIで100%再現するためのマスタープロンプトである。`001_DNA.md` および `001_Timeline.md` で定義された「確定事項（Fact）」に基づき、SUNO AIが意図しないアレンジを加える余地を極限まで減らすことを目的とする。

## 🎯 目的
- 成功モデル001の音楽的要素をSUNO AIに正確に伝達する。
- 再現率評価シート (`001_Score.md`) で高得点を得るための基盤を構築する。
- 感覚ではなく、データに基づいたプロンプト設計の標準を確立する。

## 📝 プロンプト構成要素

### ① 楽曲全体の設定
*   **ジャンル:** Jazz, Lo-fi Jazz, Cafe Music
*   **ムード:** Calm, Relaxing, Smooth, Elegant, Sophisticated
*   **テンポ:** Medium (BPM 118)
*   **キー:** F Major
*   **ダイナミクス:** mp (mezzo-piano) - 全体を通して一定
*   **構成:** Intro - Main Loop (seamlessly loopable) - Outro (gentle fade-out)

### ② 楽器構成と役割 (Factに基づく)
*   **Acoustic Piano:**
    *   **役割:** メロディの核、会話的なフレーズ、休符を多用し「余白」を創出。
    *   **音色:** Warm, mellow, slightly muted.
*   **Upright Bass:**
    *   **役割:** 楽曲の土台、安定したウォーキングベース、温かい音色。
    *   **音色:** Deep, resonant, clear attack.
*   **Brush Drums:**
    *   **役割:** 軽快なリズム、アタック音を最小限に抑え、動画の邪魔をしない。
    *   **音色:** Soft, gentle, subtle swing.

### ③ タイムライン別プロンプト (001_Timeline.mdに基づく)

#### 0.0〜2.0秒：導入（0秒の魔法）
```
[Intro] Start all instruments (acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00, with a complete and stable sound. Acoustic piano plays a syncopated, conversational melody from the very beginning. Upright walking bass starts immediately, providing a warm, clear foundation. Soft brush drums begin with a gentle swing feel. Minimal yet distinct instrumentation. Short, intentional rests are present to allow space for video content. Consistent, stable dynamics from the start. Establishes an elegant, calm cafe atmosphere instantly. Jazz chord progression (Gm7-C7) for a sophisticated opening.
```

#### 2.0〜15.0秒：メインループ前半（Voiceover-friendlyな展開）
```
[Verse] Acoustic piano, upright bass, and brush drums continue. Acoustic piano leads with a gentle melody, supported by bass and drums. Upright walking bass maintains a steady, warm rhythm. Piano plays short, conversational phrases with ample rests, creating comfortable silence. Soft brush drums continue with a gentle swing, minimal attack. Sparse instrumentation, focusing on clarity and space. Frequent and significant rests are crucial for voiceover compatibility. Consistent, flat dynamics throughout this section. Maintains a calm, sophisticated cafe ambiance. Jazz chord progression (Fmaj7-Dm7) continues to loop smoothly. Melody provides a pleasant background, enhancing the video\'s mood without distracting.
```

#### 15.0〜30.0秒：メインループ後半（繰り返しと安定）
```
[Chorus] All three instruments continue their established patterns. No single instrument dominates; all contribute to the background texture. Upright walking bass maintains its consistent, unobtrusive rhythm. Piano phrases are subtle, with variations that don\'t draw attention, and frequent rests. Soft brush drums continue their gentle swing, ensuring a non-intrusive beat. Sparse and clean instrumentation. Extensive rests are maintained for maximum voiceover compatibility. Dynamics remain perfectly flat and consistent. The calm, sophisticated cafe ambiance is consistently maintained. The ii-V-I-vi jazz chord progression continues to loop seamlessly. Melody provides a stable, unobtrusive background, designed for seamless looping.
```

#### 30.0秒〜エンディング：ループまたはフェードアウト
```
[Outro] Ensure seamless looping potential or a gentle, natural fade-out. Maintain consistent dynamics until the end, or a very gradual fade-out. The established cafe ambiance should persist until the very end.
```

### ④ SUNO AI設定 (Hypothesisに基づく)
*   **Style Influence:** 80-95 (高い影響度でジャンルとムードを維持)
*   **Weirdness:** 0-10 (意図しない変化を最小限に抑える)

## 🌸 桃花からのコメント
彩花CTO、社長。
このマスタープロンプトは、`001_DNA.md`と`001_Timeline.md`で定義された「Fact」を基盤とし、SUNO AIの特性を考慮した「Hypothesis」を加えています。これにより、SUNO AIが001の「教科書」を忠実に再現するための具体的な指示となります。

---

**作成者:** 桃花 (COO)
**監修:** 彩花 (CTO)
**日付:** 2026年8月6日
**ステータス:** Master Template
