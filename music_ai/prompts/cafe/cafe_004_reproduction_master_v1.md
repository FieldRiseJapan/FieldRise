# Cafe 004 Reproduction Master Design (Cafe 004 再現設計図 v1)

## 📋 概要
本ドキュメントは、彩花（CTO）の設計指示に基づき、成功モデル001「cafe」の絶対仕様（Fact）をSUNO AI向けに最適化された特徴表現へと翻訳し、Cafe 004の生成および検証を行うためのマスター設計書である。新しいアイデアの追加を一切排除し、001の再現率100%向上を最優先とする。

---

## 🎯 目的
- 成功モデル001のステム解析数値（RMS -16.8dBFS等）を、SUNO AIが音楽的ニュアンスとして正しく解釈できる「人間が聴いた時の特徴表現」へ変換する。
- 誰が生成しても001と同等の「Voiceover-friendlyな空気感」を持つ楽曲を得られるようにする。

---

## 🎼 1. Cafe 004 Master Prompt v1

### [Prompt Text]
```text
[Intro]
Start all instruments (warm acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00. The acoustic piano plays a gentle, conversational melody with frequent rests and ample space. The upright walking bass immediately establishes a warm, deep, and steady low-end foundation. Soft brush drums maintain a subtle, gentle swing with minimal attack, ensuring a non-intrusive rhythm. 

[Verse]
The mood is calm, relaxed, and sophisticated, perfect for a quiet cafe scene or a thoughtful vlog. The instrumentation is sparse, clean, and minimal, focusing on clarity and room for voiceover. The dynamics remain perfectly flat and consistent throughout, like a gentle mezzo-piano. F major, medium tempo around 118 BPM. The piano phrases feature comfortable silence between notes.

[Chorus]
No single instrument dominates; all contribute equally to an unobtrusive background texture. The walking bass maintains its smooth, comforting rhythm. The piano continues its subtle, conversational melody with natural rests. The entire piece is designed for seamless looping, maintaining a consistent, elegant cafe ambiance without any dramatic volume changes.
```

---

## ⚙️ 2. SUNO AI 設定推奨値

| パラメータ | 推奨値 | 設計意図・理由 |
| :--- | :--- | :--- |
| **Style Influence** | 85 - 95 | 成功モデル001のLo-fi Jazz / Cafe Musicのジャンル感を強力に維持し、意図しない逸脱を防ぐ。 |
| **Weirdness** | 0 - 10 | 予期せぬノイズや奇抜な展開を排除し、極めて安定した予測可能なBGM出力を得る。 |
| **Duration** | 30 - 60秒 | TikTokやInstagramリールでの自動ループ再生に最適な尺を確保。 |
| **Audio Quality / Safe Zone** | 標準 /有効 | アコースティック楽器の温かみを損なわず、クリアなMid帯域（余白）を維持。 |

---

## 📊 3. 001一致率評価項目 (Cafe 004 Evaluation)

生成されたCafe 004楽曲は、以下の基準（`001_Score.md` 準拠）で採点される。

| 評価項目 | 評価基準 (001との一致度) | 目標値 |
| :--- | :--- | :--- |
| **Intro (0-2秒)** | 0秒同時開始、全楽器のバランス、世界観の提示 | 95%以上 |
| **Bass** | ウォーキングベースの温かさと安定感 (RMS -18.1相当) | 95%以上 |
| **Piano** | 会話的フレーズと連続した休符（余白）の配置 | 95%以上 |
| **Brush Drum** | アタック極小のソフトスイング (RMS -48.8相当) | 90%以上 |
| **Rest（余白）** | ナレーションを邪魔しない空間の広がり | 95%以上 |
| **Voiceover Friendly** | Mid帯域のクリアさと動画素材との共存性 | 100% |
| **Loop** | シームレスな接続とループ性 | 90%以上 |
| **Tempo** | BPM 約118の一致度 | 98%以上 |
| **Harmony** | 聴き疲れしない循環コード感 | 95%以上 |
| **Cafe感** | 洗練された落ち着いた空気感の再現度 | 95%以上 |
| **ダイナミクス** | 全体を通した完全なフラット（mp / RMS -16.8相当） | 95%以上 |

---

## 🔄 4. 生成後改善ポイント（検証用チェックリスト）

生成結果を確認し、以下の項目をチェックしてEvolution Logへ記録する。
1. **0秒フックの有無:** イントロの0.0秒からピアノ・ベース・ドラムが同時に鳴っているか。
2. **余白の確保:** ピアノが弾きすぎていないか。ナレーションが入るスペース（Rest）が十分に感じられるか。
3. **ダイナミクスの安定:** 曲中で盛り上がりすぎていないか。常に一定の「mp（メゾピアノ）」が保たれているか。
4. **ドラムのアタック:** ドラムが主張しすぎていないか。ブラシの柔らかさが表現されているか。

---

## 🌸 桃花からのコメント
彩花CTOの設計指示に基づき、数値を音楽的な「特徴表現」へ見事に翻訳したマスタープロンプトが完成しました。新しい挑戦を抑え、001の再現率100%に特化したこの設計図こそ、Cafe 004を成功へと導く最強の羅針盤です！🌸✨

---

**作成者:** 桃花 (COO)
**設計監修:** 彩花 (CTO)
**接続監修:** 風花 (CCO)
**日付:** 2026年8月6日
**ステータス:** Cafe 004 Ready
