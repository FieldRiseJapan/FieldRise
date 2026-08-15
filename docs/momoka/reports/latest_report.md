# Project-001｜Cafe 001再現検証｜候補008・009A比較報告

**状態:** `candidate_evaluation_complete`
**正式指示:** [`2026-08-15_project001_reproduction_verification.md`](../instructions/2026-08-15_project001_reproduction_verification.md)
**最新検証条件:** [`2026-08-15_project001_numbering_and_bass_intro.md`](../instructions/2026-08-15_project001_numbering_and_bass_intro.md)
**詳細比較報告:** [`2026-08-15_project001_001_reproduction_candidates_008_009a.md`](2026-08-15_project001_001_reproduction_candidates_008_009a.md)
**候補取得記録:** [`2026-08-15_project001_suno_candidates_008_009_intake.md`](2026-08-15_project001_suno_candidates_008_009_intake.md)

> **正式結論:** CAND-008を現時点の最良候補として採用する。0〜2秒のLow比率73.31%は候補004〜009Aで最高、Low-mid比率26.59%はCAND-006から6.53ポイント改善、Low比率80%以上の窓割合45.0%は001 Masterと一致する。開始0:00も満たす。一方、導入Side/Mid比-9.26 dBは001 Masterの-32.40 dBから依然として離れているため、次候補では導入0〜2秒の**Stereo幅だけ**を縮める。[1] [2] [3]

## 完了状況

| 項目 | 状態 | 結果 |
|---|---|---|
| CAND-008・009Aの公開条件確認 | 完了 | 008は倍音・Low-mid共鳴抑制、009Aはsub-focused・基音中心を明示。いずれもBass開始0:00・無音なし・0〜2秒Bass単独を指定。 |
| 音源取得・指紋化 | 完了 | 公開CDN MP3の形式、曲尺、SHA-256を取得記録へ保存した。 |
| 同条件の音響比較 | 完了 | 0〜2秒RMS、帯域比、持続信号開始、RMS遷移、導入Side/Mid比を測定した。 |
| 最良候補の選定 | 完了 | CAND-008を選定。CAND-009AもCAND-006より改善したが、帯域集中で008に劣る。 |
| 人によるA/B聴取 | `open` | Bass以外の混入、アタック、クリック／金属音、Piano／Drumsの知覚Onset、Loop感を追認する。 |
| 次の一変数生成 | `ready` | 008の帯域・開始・構成を固定し、導入Stereo幅だけをdual-mono化する。 |

## 0〜2秒の主要測定結果

| 指標 | 001 Master | CAND-006 | CAND-008 | CAND-009A |
|---|---:|---:|---:|---:|
| 導入RMS | -22.64 dBFS | -16.50 dBFS | **-16.80 dBFS** | -16.05 dBFS |
| Low 20–180 Hz比率 | 98.04% | 66.88% | **73.31%** | 71.26% |
| Low-mid 180–2,000 Hz比率 | 1.80% | 33.12% | **26.59%** | 28.57% |
| 持続信号開始 | 0.400秒 | 0.100秒 | **0.000秒** | **0.000秒** |
| Low比率80%以上の窓割合 | 45.0% | 27.5% | **45.0%** | 17.5% |
| 導入Side/Mid比 | -32.40 dB | -11.27 dB | -9.26 dB | -9.09 dB |

## Fact / Hypothesis / Evidence / Result

| 区分 | 内容 |
|---|---|
| FACT | CAND-008のLow比率73.31%は測定済み候補の最高値。 |
| FACT | CAND-008のLow比率80%以上の窓割合45.0%は001 Masterと同値。 |
| FACT | CAND-008・009Aの持続信号開始は0.00秒。 |
| HYPOTHESIS | CAND-008に残るSide成分はBassのStereo処理、残響、またはMP3処理の複合要因による可能性がある。 |
| OPEN | Bass単独の厳密確認、音色・ノイズ、Piano／Drumsの厳密Onset、Loop品質は人による聴取またはステム分離が必要。 |

## 次の一変数生成指示

> **固定条件:** Bass開始0:00、無音なし、0〜2秒Bass単独、極低域・倍音抑制・180〜2,000 Hz共鳴除外、2.00秒の疎なPiano、後続minimal soft brush drums、既存Negative指定。
>
> **変更条件（1変数）:** 導入0〜2秒に`dual-mono identical left and right channels; no stereo width, panning, left-right variation, or spatial modulation during the first 2.00 seconds`を追加する。

次候補では、導入Side/Mid比・左右相関・Low比率・Low-mid比率・導入RMSをCAND-008と比較し、空間幅の抑制だけの効果を判定する。

## 保存済み成果物

| 種別 | 保存先 |
|---|---|
| 正式比較報告 | `docs/momoka/reports/2026-08-15_project001_001_reproduction_candidates_008_009a.md` |
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidates_008_009_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno008_009a_intro.png` |
| 更新前の入口報告 | `docs/momoka/reports/archive/2026-08-15_pre_candidate_008_009a_comparison_latest_report.md` |

**Commit SHA:** この報告の更新コミット後に確定し、本ファイルへ追記する。
**Push先:** `origin/main`（反映後に結果を追記する）。

## References

[1]: https://suno.com/s/OH6EsNilE64L1fgm "Suno — 008 by 「Runa」"
[2]: https://suno.com/s/Oo6Nbb0edO38Qwwn "Suno — 009A by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a.json "FieldRise — 001 Master and Suno 008/009A measurement dataset"
