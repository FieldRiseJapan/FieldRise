# 001・002再現解析システム｜技術リサーチ記録

**調査日:** 2026-08-27（GMT+9）
**目的:** FieldRiseの001・002再現検証で、再利用可能かつ根拠の明確な解析・補助分離技術を選定する。

## 採用方針

| 技術 | 役割 | 採用理由 | 利用上の注意 |
|---|---|---|---|
| NumPy + SoundFile + FFmpeg | WAV／FLAC／MP3の統一読込、帯域・RMS・Stereo・時間窓測定 | 軽量で再現可能、音源比較の基礎指標を明示できる。 | MP3とWAV／FLACの絶対値比較にはコーデック差がある。 |
| Librosaのonset-strength概念 | 時間変化・立上がりの補助指標 | スペクトルフラックスによるOnset強度を定義し、導入部の変化を時間軸で比較できる。 | Onsetだけでは楽器の種類を特定できない。 |
| Essentia | 将来の高水準音楽記述子、リズム・調性・セグメンテーション拡張 | 音楽情報検索向けの再利用可能なスペクトル・時間・調性・高水準記述子を持つ。 | AGPLv3ライセンスのため、配布・組込み形態を法務・ライセンス確認する。 |
| Demucs | Bass／Drums／other等の補助的な音源分離 | 楽曲分離の研究実装として、Bass・Drums等のstemを出力できる。 | 分離漏れ・artifactがあり、個別楽器の不存在を断定する根拠にはしない。上流リポジトリの保守状況も確認する。 |

## 公式情報から確認した事項

Essentiaは音楽解析と音楽情報検索のためのオープンソースC++ライブラリであり、Pythonバインディング、スペクトル・時間・調性・高水準の音楽記述子、音源分離、セグメンテーション、リズム・テンポ解析、楽器検出に関する機能領域を持つ。[1] [2]

Librosaの`onset_strength`は、スペクトル上の正の変化を集約してOnset強度エンベロープを計算する。導入部の「いつ変化が起きたか」を比較する補助指標として採用できるが、音源や楽器を識別するものではない。[3]

Demucs v4はBass、Drums、Vocals、Other等のstem分離を提供する。公式リポジトリは上流の積極保守が終了した旨を明記しているため、FieldRiseでは検証補助に限定し、将来的には保守状況のよい後継・派生実装を定期評価する。[4]

## システム反映

1. `tools/cafe_reproduction_analyzer.py`は、001を0〜2秒、002を0〜8秒の重点区間として、RMS、帯域比、スペクトル重心、Side/Mid比、持続信号開始、50 ms窓のOnset強度を出力する。
2. `fieldrise-cafe-reproduction-analysis`スキルは、Fact/Hypothesis/Evidence/Result分離、一変数検証、参照音源保護、Fender Studio引き渡しを標準化する。
3. Demucsはインストール済みだが、対象音源の個別解析は必要な場合だけ実行する。分離結果は聴取またはDAWステムと突合する。

## References

[1]: https://essentia.upf.edu/contents.html "Essentia documentation contents"
[2]: https://github.com/MTG/essentia "MTG/essentia — GitHub"
[3]: https://librosa.org/doc/latest/generated/librosa.onset.onset_strength.html "librosa.onset.onset_strength documentation"
[4]: https://github.com/facebookresearch/demucs "facebookresearch/demucs — GitHub"
