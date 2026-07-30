# Cafe 003 Test-001 改善版 検証用003プロンプト設計 (v1)

## 🎯 作業目的
Cafeシリーズ成功モデル001・002の分析結果、およびCafe 003 Test-001の検証結果を基に、次回SUNO AI生成用の改善プロンプトを作成する。検証データを増やし、FieldRise Music AIの制作知識を蓄積することを主眼とする。

## 🔍 作業前確認
以下の既存資産を確認し、設計に反映しました。
- `music_ai/knowledge/prompt_design_v2.md`
- `music_ai/research/Cafe_Lab/hypothesis.md` & `discoveries.md`
- `music_ai/experiments/cafe_series_test001.md`

## 📝 設計内容

### 1. SUNO AI入力用プロンプト（英語）

```text
A warm and elegant cafe background music for cooking and work videos. Start with a distinct low warm upright bass note in the first 2 seconds, followed by a smooth transition to a gentle soft piano melody. The piano should feature call-and-response phrases that are non-intrusive and soothing. Minimal arrangement, voiceover-friendly, leaving ample space and comfortable silence (rest) between notes. Light brush drums provide a steady rhythmic pulse with consistent volume. Soft jazz harmony, F major feeling, designed for natural looping and long-time listening. No heavy drums, no aggressive sounds, no dramatic changes.
```

### 2. プロンプト設計理由

- **Introのフック**: 「distinct low warm upright bass note in the first 2 seconds」により、スクロール停止率を高める2秒の法則を物理的に指示。
- **旋律の対話性**: 「call-and-response phrases（問いと答え）」を指定することで、単調にならず、かつ主張しすぎない音楽的対話を生み出し、心地よさを向上させる。
- **音の隙間の確保**: 「ample space and comfortable silence (rest)」を明示し、ASMRやナレーションとの共存性を極限まで高める。
- **リズムの安定性**: 「steady rhythmic pulse」と「consistent volume」により、長時間の視聴でも耳が疲れない安定感を実現する。

### 3. Cafe 001・002との共通点
- **楽器構成**: Soft piano, Warm upright bass, Brush drumsの黄金セットを継承。
- **世界観**: Minimal arrangementによる「最高の脇役」としての立ち位置。
- **調性**: 安心感を与える F Major / Jazz harmony の採用。

### 4. Cafe 003 Test-001から変更した部分
- **イントロ指示の具体化**: Bassの音色を「distinct（明確な）」と表現し、Pianoへの「smooth transition（自然な移行）」を明示。
- **フレーズ構造の指定**: 「call-and-response（問いと答え）」という具体的な音楽構造を追加。
- **休符の概念導入**: 「comfortable silence (rest)」を加え、音を鳴らさないことの価値をAIに指示。

### 5. 期待する検証ポイント
- **離脱防止率の向上**: 冒頭2秒のBassが意図通り出力され、フックとして機能するか。
- **対話的メロディの有効性**: 「問いと答え」の構造が、BGMとしての心地よさにどう寄与するか。
- **ASMR共存度**: 意図的に作られた「隙間」が、実際の動画編集においてどれほど有効か。

---
## 💰 Credit管理
今回はプロンプト設計のみ実施。SUNO AIでの生成は社長の承認後に実行します。

## 📁 保存情報
- **Repository**: `FieldRiseJapan/FieldRise`
- **保存場所**: `music_ai/prompts/cafe/`
- **ファイル名**: `cafe_test003_prompt_v1.md`

---
**作成者**: 桃花 (COO)
**作成日**: 2026年7月30日
**ステータス**: 🟡 生成待ち（社長承認待ち）
