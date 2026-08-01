# Cafe 004 Reproduction Prompt v1 (Success Model 001 Enhanced)

## 📋 概要
本プロンプトは、FieldRise Music AIの最優先目標である「成功モデル001（TikTok 5.9万本利用の『cafe』）を90%以上の精度で再現する」ために設計された、Cafe 004生成用の強化版プロンプトである。Cafe 003 Test-001で明らかになった課題を克服し、001の「核」となる要素をSUNO AIに厳密に指示することを目的とする。

---

## 🎼 SUNO AI 入力用プロンプト (English)

### Style Prompt
`A warm, elegant, and highly voiceover-friendly cafe jazz background music. **Start all instruments (acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00, with a complete and stable sound.** Maintain a **strictly consistent walking tempo at 118 BPM**. Acoustic piano features syncopated, conversational phrases with **ample rests and comfortable silence between melodies**. Clear, warm upright walking bassline provides a natural presence. Soft brush drums maintain a steady, gentle swing feel with minimal attack. F Major key, utilizing major 7th and 9th chords for a sophisticated yet neutral atmosphere. **Absolutely no dramatic changes, no dynamic build-ups, no strong hooks, and no intrusive elements.** Designed for cooking, lifestyle Vlogs, and ASMR videos, ensuring the music remains a subtle, high-quality background. Minimal arrangement, high-quality studio recording feel.`

---

## ⚙️ SUNO AI 設定 (Settings)
- **Model:** v4 (or latest)
- **Mode:** Custom Mode
- **Instrumental:** ON
- **Weirdness:** `0-3` (Extremely low to prevent unexpected variations)
- **Style Influence:** `90-95` (Very strong adherence to prompt instructions)
- **Duration:** `180 - 240` seconds (3-4 minutes for versatile editing)
- **BPM:** `118` (Strictly consistent)
- **Key:** `F Major`
- **Audio Upload:** なし (今回は使用しない)

---

## 🎯 Cafe 004 検証ポイント

### 1. 001再現性
- **0秒同時開始:** ピアノ、ベース、ドラムが0:00から同時に、かつ完成された状態で始まるか。
- **BPM 118の厳守:** 軽快なウォーキングテンポが最後まで正確に維持されているか。
- **F Majorの空気感:** 明るく中立的で洗練されたF Majorの響きが再現されているか。

### 2. Voiceover-friendly
- **音の隙間 (Rest):** メロディの間に十分な休符があり、ナレーションやASMRを邪魔しない「余白」が確保されているか。
- **中域のクリアさ:** 音が密集しすぎず、声が通りやすい中域の空間があるか。

### 3. BGMとしての機能性
- **一定のダイナミクス:** 曲全体を通して音量・エネルギーが一定で、ビルドアップや派手な展開がないか。
- **ブラシドラムの柔らかさ:** アタック音が最小限に抑えられ、耳障りな高音がないか。
- **自然なループ性:** 始まりと終わりが自然に繋がり、長時間再生に適しているか。

---

## 💡 設計の意図とCafe 003からの改善点

### 1. 「0秒同時開始」の徹底
- **改善点:** Cafe 003ではBass単独開始の傾向が見られたため、プロンプトで「**Start all instruments (acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00, with a complete and stable sound.**」と、具体的な楽器名を挙げて強調しました。

### 2. 「Cafeらしい落ち着いた空気感」の再現
- **改善点:** AIが意図しないアレンジを加える可能性を排除するため、Weirdnessを`0-3`に、Style Influenceを`90-95`に再調整しました。これにより、プロンプトの指示に極めて忠実な生成を促します。

### 3. 「Voiceover-friendlyな余白」の強化
- **改善点:** 「**ample rests and comfortable silence between melodies**」という表現をプロンプト内で複数回使用し、AIに「音の引き算」を強く意識させます。また、「**Absolutely no dramatic changes, no dynamic build-ups, no strong hooks, and no intrusive elements.**」と禁止ワードを明確にすることで、動画の主役を邪魔しないBGMとしての機能を最大化します。

---
**設計:** 桃花 (COO)
**監修:** 彩花 (CTO)
**日付:** 2026年8月2日
**保存場所:** `music_ai/prompts/cafe/`
