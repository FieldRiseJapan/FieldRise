# Cafe Standard Prompt v1 (Success Model 001 Reconstruction)

## 📋 概要
本プロンプトは、TikTokで5.9万本の実績を持つ成功モデル001「cafe」を完璧に再現するために設計された、FieldRiseの標準プロンプトである。

---

## 🎼 SUNO AI 入力用プロンプト (English)

### Style Prompt
`A warm and elegant cafe jazz background music. Start all instruments (piano, upright bass, brush drums) simultaneously from 0:00. Consistent walking tempo at 118 BPM. Acoustic piano features syncopated call-and-response phrases with ample rests. Clear upright walking bassline. Soft brush drums with a steady swing feel. F Major key, major 7th chords, no dramatic changes, no dynamic build-ups. Voiceover-friendly, designed for cooking and lifestyle Vlogs. Minimal arrangement, high-quality studio recording feel.`

---

## ⚙️ SUNO AI 設定 (Settings)
- **Model:** v4 (or latest)
- **Mode:** Custom Mode
- **Instrumental:** ON
- **Weirdness:** `0-5` (Safe Zone)
- **Style Influence:** `85-95` (Strong / Strict adherence to prompt)
- **Duration:** `180 - 240` seconds
- **BPM:** `118` (Strictly consistent)
- **Key:** `F Major`

---

## 🎯 再現・検証ポイント
1. **0秒の同時開始:** ピアノ、ベース、ドラムが冒頭0.1秒から揃って開始されているか。
2. **テンポの安定性:** 118 BPMの軽快なウォーキングテンポが最後まで維持されているか。
3. **音の隙間 (Rest):** ピアノの旋律の間に、ナレーションやASMR音が入る「余白」が十分に確保されているか。
4. **楽器の質感:** ブラシドラムの柔らかさと、ウッドベースの輪郭が001と同等か。

---

## 💡 設計の意図
- **同時開始の優先:** 001の「スクロールを止める魔法」を再現するため、あえてベース単独開始のルールを排除。
- **BPMの明示:** 001の「歩くような軽快さ」を出すため、118 BPMという具体的な数値を指定。
- **Style Influenceの強化:** AIの余計なアレンジを防ぎ、001のミニマルな構成を徹底させる。

---
**設計:** 桃花 (COO)
**監修:** 彩花 (CTO)
**日付:** 2026年7月31日
**保存場所:** `music_ai/prompts/cafe/`
