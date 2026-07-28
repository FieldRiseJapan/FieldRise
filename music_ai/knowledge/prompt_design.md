# 知識：プロンプト設計標準仕様書 (prompt_design.md)

## SUNO AI プロンプト設計ルール
本ファイルは、今後すべての楽曲生成における「絶対的な基準」となる標準仕様書である。

### 1. イントロ設計 (Intro)
- **必須:** `Start with a warm deep bass intro for the first 2 seconds.`
- **必須:** Pianoの導入は2秒以内に行うこと。
- **目的:** 冒頭2秒で世界観を完結させ、離脱を防ぐ。

### 2. 編曲・楽器 (Arrangement)
- **必須:** `Minimal arrangement` を指定し、音数を増やしすぎない。
- **必須:** `Brushes on drums` や `Warm upright bass` など、アナログな質感を指定する。
- **禁止:** 空間系エフェクト（過度なリバーブ）、EDM要素、派手な音響演出。

### 3. ハーモニー・テンポ (Harmony & Tempo)
- **必須:** `F Major` または `Bb Major` を指定。
- **必須:** `BPM 115-120` または `BPM 80-85` をシーンに合わせて選択。
- **推奨:** `Jazz turnaround ii-V-I-vi progression` を含める。

### 4. ループ・SNS (Loop & SNS)
- **必須:** `Loop-friendly structure` を指定。
- **必須:** ナレーションとの共存を前提とし、中域の「隙間」を意識したプロンプトを組む。
- **推奨:** `Voiceover-friendly`, `Non-intrusive melody`, `Background music focused` を含める。

### 5. シーン特化設計 (Scene-specific)
- **原則:** ターゲットとする動画シーンを明確にし、それに合わせたプロンプトを調整する。
- **料理・Vlog:** `Upbeat walking tempo`, `Crisp piano`.
- **勉強・リラックス:** `Slow pulse`, `Mellow upright bass`, `Call and response with rests`.

---
## 運用メモ
桃花（COO）は、プロンプト生成時に本仕様書の内容を一つずつチェックし、全てを満たしていることを確認した上で実行に移すこと。
