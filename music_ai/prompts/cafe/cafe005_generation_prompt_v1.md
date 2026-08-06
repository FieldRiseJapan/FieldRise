# Cafe 005 Generation Prompt & Design v1 (冒頭2秒ベース特化型リベンジ設計書)

## 📋 概要
本ドキュメントは、Cafe004 Test-001の検証において社長より指摘された最大の課題「スタートから2秒の柔らかいベースの欠落」を完全に克服し、成功モデル001の冒頭の空気感を100%再現するためのCafe005生成前設計書である。

---

## 🎯 修正の核心
- **Cafe004の失敗:** `Start all instruments simultaneously from 0:00` という指示により、冒頭から全楽器が鳴り響き、ベースの柔らかいアタックと「タメ」が潰れてしまった。
- **Cafe005の改善:** 冒頭0.4秒から単音で柔らかく入る「ディープで温かいアップライトベースの余韻」を最優先事項としてプロンプトに刻み込む。

---

## 🎼 1. SUNO AI入力用プロンプト (Cafe 005)

### Style of Music (音楽スタイル指定)
```text
Lo-fi jazz, chillhop, calm cafe music, warm upright bass with soft long decay, zero sharp attack, warm acoustic piano with sparse notes and ample rests, soft brush drums, voiceover-friendly, constant gentle mezzo-piano dynamics, relaxing and sophisticated cafe atmosphere, F major, medium tempo 118 BPM.
```

### Lyrics / Prompt Section (曲調・構造指定 - 冒頭特化型)
```text
[Intro]
The track begins softly at 0.4 seconds with a single, deep, and incredibly warm upright bass note, featuring a long, gentle decay and zero sharp attack. The acoustic piano enters sparsely a moment later, leaving vast, beautiful spaces and rests between notes. Soft brush drums maintain a subtle, whispering swing far in the background.

[Verse]
The mood is calm, relaxed, and sophisticated, perfectly tailored for cooking ASMR and quiet daily vlogs. The instrumentation is extremely minimal, ensuring the mid-range frequency remains completely open for voiceover. The dynamics stay perfectly flat and consistent like a gentle mezzo-piano.

[Chorus]
The walking bass smoothly connects each measure, providing a comforting, steady foundation. The piano continues its conversational melody with natural rests, maintaining an elegant, uncluttered cafe ambiance without any sudden volume spikes.
```

---

## ⚙️ 2. SUNO AI 設定値
- **Model:** V3.5 / V4
- **Custom Mode:** ON
- **Weirdness:** 5 - 10 (安定性の維持)
- **Style Influence:** 95 (ジャンルの強力な固定)
- **Duration:** 30 - 60秒 (リール動画用ループ最適化)

---

## 🌸 桃花からの誓約
社長、このCafe005のプロンプトでは、冒頭のベースの「タメ」と「柔らかい余韻」を最優先でAIに命令しています。
次こそは「これだ！」と言っていただける最高のベースをお届けします！🌸🔥

**作成者:** 桃花 (COO)
**技術監修:** 彩花 (CTO)
**接続監修:** 風花 (CCO)
**日付:** 2026年8月6日
**ステータス:** Cafe005 Ready for Execution
