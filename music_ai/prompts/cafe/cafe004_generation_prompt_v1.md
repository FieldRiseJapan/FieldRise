# Cafe 004 Generation Prompt & Design v1 (成功モデル001 再現設計書)

## 📋 概要
本ドキュメントは、FieldRise Music AIの最高位マスターリファレンスである成功モデル001「cafe」をSUNO AIで完全に再現するための生成前設計書である。新しいアイデアや派手なアレンジを一切排除し、001のDNA（絶対仕様および市場で選ばれた要因）をSUNO AIのプロンプトおよび設定値へ正確に落とし込むことを目的とする。生成はまだ行わず、設計・検証の基礎資料として活用する。

---

## 🎯 目的
- 成功モデル001が5.9万本以上の動画で使われた理由（「0秒の魔法」と「Voiceover-friendlyな余白」）をSUNO AIのプロンプトで再構築する。
- 聴覚的なニュアンスと数値的事実（Fact）を両立させた、再現性の高い生成基盤を確立する。

---

## 🎼 1. SUNO AI入力用プロンプト (Style of Music / Lyrics)

### Style of Music (音楽スタイル指定)
```text
Lo-fi jazz, chillhop, calm cafe music, warm acoustic piano, warm upright walking bass, soft brush drums with minimal attack, sparse instrumentation, frequent rests and ample space between notes, voiceover-friendly, constant gentle mezzo-piano dynamics, flat energy level, relaxing and sophisticated cafe atmosphere, F major, medium tempo 118 BPM, seamless looping design.
```

### Lyrics / Prompt Section (曲調・構造指定)
```text
[Intro]
Start all instruments (warm acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00. The acoustic piano plays a gentle, conversational melody with frequent rests and ample space. The upright walking bass immediately establishes a warm, deep, and steady low-end foundation. Soft brush drums maintain a subtle, gentle swing with minimal attack, ensuring a non-intrusive rhythm.

[Verse]
The mood is calm, relaxed, and sophisticated, perfect for a quiet cafe scene, cooking ASMR, or a thoughtful vlog. The instrumentation is sparse, clean, and minimal, focusing on clarity and room for voiceover. The dynamics remain perfectly flat and consistent throughout, like a gentle mezzo-piano. The piano phrases feature comfortable silence between notes.

[Chorus]
No single instrument dominates; all contribute equally to an unobtrusive background texture. The walking bass maintains its smooth, comforting rhythm. The piano continues its subtle, conversational melody with natural rests. The entire piece is designed for seamless looping, maintaining a consistent, elegant cafe ambiance without any dramatic volume changes.
```

---

## ⚙️ 2. SUNO AI 設定値 (Recommended Settings)

| 項目 | 推奨値 |
| :--- | :--- |
| **Model** | V3.5 / V4 (最新の安定アコースティック生成モデル) |
| **Custom Mode** | ON (上記 Style of Music および Lyrics を個別入力) |
| **Weirdness** | 0 - 10 (予測可能で安定した出力を得るため最小限に設定) |
| **Style Influence** | 85 - 95 (Lo-fi Jazz / Cafe Musicのジャンル感を強力に固定) |
| **Duration** | 30 - 60秒 (TikTokやInstagramリールでの自動ループ再生に最適化) |
| **Instrumental** | ON (歌声なしの純粋なBGMとして生成) |

---

## 🔬 3. 設計理由の言語化 (Fact & Hypothesis)

### ① Fact（001解析で確認済みの確定事項）
- **全体RMS値 (-16.8 dBFS) & フラットなダイナミクス:** 楽曲全体を通して音量が一定（mp）であり、起伏がないことが解析で判明している。これが動画のナレーションや声を邪魔しない最大の要因であるため、プロンプトに `constant gentle mezzo-piano dynamics` および `flat energy level` を明記した。
- **Upright Bassの即時開始 (RMS -18.1 dBFS):** 0:00からウォーキングベースが温かい土台を提供するため、`Start all instruments simultaneously from 0:00` と指定した。
- **Brush Drumsのアタック極小 (RMS -48.8 dBFS):** ドラムが主張しすぎないよう、`soft brush drums with minimal attack` および `subtle swing feel` を設定した。
- **Mid帯域の休符 (Rest):** ピアノの音数が少なく、余白が多いことが Voiceover Friendly を生んでいるため、`frequent rests and ample space between notes` を必須要素とした。

### ② Hypothesis（検証予定の仮説）
- **スタイルインフルエンスの高設定 (85-95):** この数値域に設定することで、SUNO AIがジャズの複雑なインプロビゼーションに走るのを防ぎ、001のような「ループしやすくシンプルなコンピング」を維持できると仮定している。
- **「Voiceover-friendly」というワードの効果:** AIに対して直接「声の邪魔をしない音楽を作れ」と指示することで、Mid帯域の周波数的な混雑を回避し、動画クリエイターが使いやすい空間（余白）が生成されると仮定している。

---

## 📊 4. 001再現チェック項目 (Cafe 004 Evaluation Criteria)

生成された音源は、以下の基準（`001_Score.md`）で厳格に採点される。
1. **Intro (0-2秒):** 0秒同時開始で世界観を即座に提示できているか。
2. **Bass:** ウォーキングベースの温かさと安定感（-18.1相当）があるか。
3. **Piano:** 会話的フレーズと連続した休符（余白）が確保されているか。
4. **Brush Drum:** アタックが極めて小さく、耳障りな高域がないか。
5. **Rest（余白）:** ナレーションやASMRを受け入れる十分な空間があるか。
6. **Voiceover Friendly:** 動画素材と完璧に共存できる音響設計になっているか。
7. **Loop:** 始まりと終わりがシームレスに繋がり、自動ループに対応できるか。
8. **Tempo:** BPM 118前後の軽快かつ落ち着いたテンポであるか。
9. **Harmony:** 聴き疲れしない循環コード感が維持されているか。
10. **Cafe感:** 洗練されたエレガントな空気感が一貫しているか。
11. **ダイナミクス:** 全体を通してフラット（mp / RMS -16.8相当）で、盛り上がりすぎていないか。

---

## 🌸 桃花からのコメント
彩花CTO、そして社長。
成功モデル001の「5.9万本で使われた理由」をすべてプロンプトの構造とSUNO設定に翻訳した、Cafe 004生成前の最終設計書がここに完成しました。

「良い曲を作る」ではなく「001を100%再現する」という目的を果たすための、極めて純度の高い設計資産です。

---

**作成者:** 桃花 (COO)
**設計監修:** 彩花 (CTO)
**接続監修:** 風花 (CCO)
**日付:** 2026年8月6日
**ステータス:** Generation Prompt Ready (Execution Pending)
