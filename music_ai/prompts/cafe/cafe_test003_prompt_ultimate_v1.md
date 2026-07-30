# Cafe 003 Test-001 改善版 究極の検証用プロンプト設計 (v1)

## 📋 実験・検証概要
- **実験名:** Cafe 003 Test-001 改善版プロンプト検証
- **目的:** Cafeシリーズ成功モデル001・002、およびCafe 003 Test-001の検証結果、Suno AI最新リサーチを基に、次回SUNO AI生成用の究極の検証プロンプトを作成し、FieldRise Music AIの制作知識を最大化する。
- **検証テーマ:** IntroのBassフックの確実性、Pianoの対話的メロディ、ASMRとの共存を最大化する「音の隙間」の最適化。

---

## ⚙️ SUNO AI 設定 (Settings)
生成時に必ず以下の設定値を反映してください。

- **Model:** v4 (or latest)
- **Mode:** Custom Mode
- **Weirdness:** `0-10` (Safe Zone)
  - 理由: Cafeシリーズは「王道」であるべき。奇をてらう必要はないため、最小限に留める。
- **Style Influence:** `80-90` (Strong)
  - 理由: プロンプトの指示（特に楽器構成やIntroルール）を確実に守らせるため、高めに設定する。
- **Duration:** `180s (3分)`
  - 理由: TikTok利用（15-60秒）を前提としつつ、YouTube作業用BGMとしての汎用性も確保。
- **Audio Upload:** なし (今回は使用しません)

---

## 📝 プロンプト設計 (Prompt Design)

### [Reference]
`Similar to "Cafe" by runa_girl8215 (success model 001)`

### [Vocal]
`Instrumental only, no vocals`

### [Style]
`Warm and elegant cooking cafe background music, Modern Cafe Jazz, relaxing, stylish atmosphere`

### [Instrument]
`Distinct low warm upright bass, gentle soft piano, light brush drums, subtle jazz harmony`

### [BPM/Key]
`[BPM] 118 (Upbeat walking tempo)`
`[Key] F Major`

### [Structure]
`0:00-0:02 Intro: Distinct low warm upright bass note solo`
`0:02-0:10 Section A: Smooth transition to gentle soft piano melody with call-and-response phrases`
`0:10-1:00 Section B: Minimal arrangement, ample space and comfortable silence (rest) between notes, light brush drums provide a steady rhythmic pulse with consistent volume`
`1:00-1:50 Section A2: Piano melody continues with subtle variations, non-intrusive melody`
`1:50-2:00 Outro: Natural loop structure, fade out gently`

### [Dynamics]
`0:00-0:02 pp (very soft)`
`0:02-0:10 p (soft)`
`0:10-1:50 mp (medium soft)`
`1:50-2:00 pp (very soft)`

---

## 📊 期待する検証ポイント
- **Introのフック強化**: 最初の2秒間のBassが「distinct」として明確に機能し、スクロール停止率向上に貢献するか。
- **BPMの精度**: 指示したBPM (118) に近いテンポで生成されるか。
- **対話的メロディの有効性**: Pianoの「call-and-response phrases」が、BGMとしての心地よさと主張しすぎないバランスを両立しているか。
- **ASMR共存度**: 「ample space and comfortable silence (rest)」の指示により、調理音やナレーションが無理なく入り込める「音の隙間」が十分に確保されているか。
- **ループの自然さ**: 楽曲の終わりと始まりが自然に繋がり、違和感なく繰り返せるか。
- **Dynamicsの反映**: 指示した音量変化が適切に反映されているか。

---

## 💰 Credit管理
今回はプロンプト設計のみ実施。SUNO AIでの生成は社長の承認後に実行します。

---
**作成者**: 桃花 (COO)
**作成日**: 2026年7月30日
**ステータス**: 🟡 生成待ち（社長承認待ち）
