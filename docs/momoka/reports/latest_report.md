# Project-001｜Cafe 001再現検証｜候補006・007比較報告

**状態:** `candidate_evaluation_complete`
**正式指示:** [`2026-08-15_project001_reproduction_verification.md`](../instructions/2026-08-15_project001_reproduction_verification.md)
**最新検証条件:** [`2026-08-15_project001_numbering_and_bass_intro.md`](../instructions/2026-08-15_project001_numbering_and_bass_intro.md)
**詳細比較報告:** [`2026-08-15_project001_001_reproduction_candidates_006_007.md`](2026-08-15_project001_001_reproduction_candidates_006_007.md)
**候補取得記録:** [`2026-08-15_project001_suno_candidates_006_007_intake.md`](2026-08-15_project001_suno_candidates_006_007_intake.md)

> **正式結論:** CAND-006を現時点の最良候補として採用する。0〜2秒のLow比率66.88%は候補004〜007で最高、Low-mid比率33.12%は004〜006で最低である。しかし001 MasterのLow比率98.04%には未到達で、Bass単独性・音色・クリック／金属音・Loop感も全体ミックス測定だけでは確定できない。次候補では、Bass開始0:00・無音なし・0〜2秒Bass単独を固定し、Bassの**倍音量だけ**を変更する。[1] [2] [3]

## 完了状況

| 項目 | 状態 | 結果 |
|---|---|---|
| 001 Masterの固定 | 完了 | 001 Masterを比較基準として固定し、0〜2秒のLow比率98.04%、導入RMS -22.64 dBFSを基準値とした。 |
| CAND-006・007の公開条件確認 | 完了 | 公開Prompt、Negative指定、BPM 80–86が同一表示。非表示seed・内部設定は未確認。 |
| 音源取得・指紋化 | 完了 | 公開CDN MP3の形式、曲尺、SHA-256を取得記録へ保存した。 |
| 同条件の音響比較 | 完了 | 0〜2秒RMS、Low／Low-mid比率、持続信号開始、RMS遷移、導入Side/Mid比を測定した。 |
| 最良候補の選定 | 完了 | CAND-006を選定。CAND-007は即時信号の点で近いが、Low-mid比率62.24%のため不採用。 |
| 人によるA/B聴取 | `open` | 個別楽器、アタック、ノイズ、Piano／Drumsの知覚Onset、Loop感を追認する。 |
| 次の一変数生成 | `ready` | Bass開始0:00・無音なしを固定し、0〜2秒のBass上位倍音量のみを抑制する。 |

## 0〜2秒の主要測定結果

| 指標 | 001 Master | CAND-004 | CAND-005 | CAND-006 | CAND-007 |
|---|---:|---:|---:|---:|---:|
| 導入RMS | -22.64 dBFS | -15.13 dBFS | -15.62 dBFS | -16.50 dBFS | -15.12 dBFS |
| Low 20–180 Hz比率 | 98.04% | 57.32% | 63.56% | **66.88%** | 37.71% |
| Low-mid 180–2,000 Hz比率 | 1.80% | 42.51% | 36.32% | **33.12%** | 62.24% |
| 持続信号開始 | 0.400秒 | 0.000秒 | 0.000秒 | 0.100秒 | 0.000秒 |
| 導入Side/Mid比 | -32.40 dB | -9.18 dB | -10.24 dB | -11.27 dB | -13.94 dB |

## Fact / Hypothesis / Evidence / Result

| 区分 | 内容 |
|---|---|
| FACT | 006・007は公開Prompt／Negative指定／BPM指定が同一で、異なる音源ハッシュを持つ。 |
| FACT | CAND-006は候補004〜007で最も高いLow比率を示す。 |
| FACT | CAND-007は持続信号を0.00秒で検出するが、Low-mid比率が候補中で最も高い。 |
| HYPOTHESIS | CAND-006の持続信号開始0.10秒は、Bass開始、MP3先頭のエンコード処理、または両方の影響を含む可能性がある。 |
| OPEN | Bass以外の混入、クリック／金属音、Bassの聴感、Piano／Drumsの厳密Onset、Loop品質は人による聴取またはステム分離で確認する。 |

## 次の一変数生成指示

> **固定条件:** Bass開始0:00、無音なし、0〜2秒Bass単独、2.00秒の疎なPiano、後続minimal soft brush drums、既存Negative指定。
>
> **変更条件（1変数）:** `restrained upper harmonics`を、`very little overtone content; keep nearly all intro energy below 180 Hz and avoid audible 180–2,000 Hz resonance during the first 2.00 seconds`へ強化する。

次候補では、0〜2秒のLow比率、Low-mid比率、スペクトル重心、導入RMS、Side/Mid比をCAND-006と比較し、Bass倍音抑制だけの効果を判定する。

## 保存済み成果物

| 種別 | 保存先 |
|---|---|
| 正式比較報告 | `docs/momoka/reports/2026-08-15_project001_001_reproduction_candidates_006_007.md` |
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidates_006_007_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno006_007_intro.png` |
| 更新済み比較スクリプト | `tools/compare_cafe001_suno_candidates.py` |
| 更新前の入口報告 | `docs/momoka/reports/archive/2026-08-15_pre_candidate_006_007_comparison_latest_report.md` |

**候補006・007比較Commit SHA:** `b7403730413cc24e80dd60d63a1f172649555c88`（測定データ、可視化、比較報告、取得記録、測定スクリプト更新）
**Push先:** `origin/main`。上記コミットはプッシュ済みで、反映時のローカルHEADとリモートHEADの一致を確認した。

## References

[1]: https://suno.com/s/Y4pUYkjkf5VRtgNb "Suno — 006 by 「Runa」"
[2]: https://suno.com/s/KH1HYSA4VPQxZJQj "Suno — 007 by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json "FieldRise — 001 Master and Suno 006/007 measurement dataset"
