# Suno AI 高度設定・精度向上ガイド (2026年版)

## 1. クリエイティブ・スライダーの仕様と活用法
Suno AIの「Custom Mode」で使用可能な詳細設定パラメータの解説です。

### 1.1 Weirdness (違和感・意外性)
- **範囲:** 0 (Safe) 〜 100 (Chaos)
- **標準値:** 50
- **効果:** 値を上げると、AIがより実験的で予測不能なメロディや構成を選択します。
- **Cafeシリーズ推奨:** `0 - 10`
  - 理由: Cafeシリーズは「安定感」と「王道」が重要であり、意外性は不要なため。

### 1.2 Style Influence (スタイル影響度)
- **範囲:** 0 (Loose) 〜 100 (Strong)
- **標準値:** 50
- **効果:** 「Style」欄に入力したプロンプトをどれだけ厳密に守るかを制御します。
- **Cafeシリーズ推奨:** `70 - 90`
  - 理由: 特定の楽器（Soft Piano, Upright Bass）や構成を確実に反映させる必要があるため。

### 1.3 Audio Influence (オーディオ影響度)
- **出現条件:** 「Audio Upload」機能使用時のみ表示。
- **効果:** アップロードした音源のメロディやリズムをどれだけ引き継ぐかを制御します。
- **活用法:** 成功モデル001のメロディラインを微修正して新曲を作る際に有効。

---

## 2. 精度を最大化する「7ステップ・プロンプト法」
Suno AI v4/v5以降で特に有効な、階層化されたプロンプトエンジニアリング手法です。

1.  **[Reference]**: 既存の成功曲やアーティスト名を引用（例: `Similar to "Cafe" by runa_girl8215`）。
2.  **[Vocal]**: ボーカルの有無、質感（例: `Instrumental only, no vocals`）。
3.  **[Style]**: ジャンル、年代、雰囲気を指定（例: `Modern Cafe Jazz, 2020s, relaxing`）。
4.  **[Instrument]**: 使用楽器を列挙（例: `Soft piano, warm upright bass, brush drums`）。
5.  **[BPM/Key]**: 具体的な数値とキーを指定（例: `[BPM] 118`, `[Key] F Major`）。
6.  **[Structure]**: 時系列での構成を指示（例: `0:00-0:02 Intro: Bass solo`）。
7.  **[Dynamics]**: 音量の強弱（pp, p, mf, f）を指定。

---

## 3. Cafeシリーズ特化型テクニック

### 3.1 2秒の法則（Intro Hook）の確実な実装
プロンプトの冒頭に `Start with a distinct warm deep bass note in the first 2 seconds` と記述し、Style Influenceを高めに設定することで、SNSでの離脱を防止するイントロを確実に生成します。

### 3.2 「音の隙間」の設計
`Minimal arrangement`, `ample space between notes`, `comfortable silence (rest)` といったワードを組み合わせることで、ナレーションやASMR音と喧嘩しない「最高の脇役」を実現します。

### 3.3 コール・アンド・レスポンス（対話的旋律）
`Piano featuring call-and-response phrases` と指定することで、単調な繰り返しを避けつつ、耳に心地よいメロディラインを誘導します。

---
**知識資産管理:** FieldRise Music AI (桃花)
**最終更新:** 2026年7月30日
**出典:** Suno AI Official Help, Jack Righteous Advanced Guide (2026)
