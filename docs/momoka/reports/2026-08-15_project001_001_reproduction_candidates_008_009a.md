# Project-001｜001再現検証：Suno候補008・009A 比較報告

**作成日:** 2026-08-15（GMT+9）
**作成者:** Manus AI（COO）
**検証対象:** 001 Master、CAND-006、Suno候補008・009A
**判定範囲:** 公開Prompt／Negative指定と、全体ミックスを対象とした客観的音響プロキシの比較。個別楽器の存在・不在、クリック音の知覚、Bassの主観的音色、Loop自然さは、この測定だけで断定しない。

![001 Masterと候補008・009Aの0〜2秒比較](../../music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno008_009a_intro.png)

*図1：50ミリ秒窓におけるRMSと帯域エネルギー比。濃線はRMS、背景はLow（20–180 Hz）・Low-mid（180–2,000 Hz）・High（2,000–10,000 Hz）の相対比である。*

## 結論

**CAND-008を新しい最良候補として採用する。** 0〜2秒のLow比率は**73.31%**で、先行最良のCAND-006（66.88%）から6.43ポイント改善した。Low-mid比率も**26.59%**へ6.53ポイント低下し、導入スペクトル重心は176.5 Hzまで下がった。持続信号開始は0.00秒で、Low比率80%以上の窓割合は45.0%となり、001 Masterの45.0%と一致した。[1] [3] [4]

CAND-009AもLow比率71.26%・Low-mid比率28.57%とCAND-006を上回るが、スペクトル重心253.2 Hz、Low比率80%以上の窓割合17.5%であり、導入の低域集中はCAND-008より劣る。両候補とも001 MasterのLow比率98.04%、Low-mid比率1.80%、導入Side/Mid比-32.40 dBには未到達である。[3]

候補008・009Aの公開文言は倍音・180〜2,000 Hz共鳴を抑える方向で異なるため、両者の差は完全な一変数実験ではない。ただし、CAND-008が最良となったことは、**導入の倍音とLow-mid成分を明示的に抑制する方針が有効である**という実測上の根拠になる。次の検証はBass開始、無音、帯域指定、楽器構成を固定し、導入の左右差・空間幅だけを一変数として縮める。

## 検証入力と再現性

| 項目 | CAND-008 | CAND-009A |
|---|---|---|
| Suno song ID | `ce225f8b-6c6a-4445-ae56-23eabce65e4d` | `1b961067-16ec-46d3-a84a-e18a5b895487` |
| 形式 | MP3、48 kHz、Stereo、約177 kbps | MP3、48 kHz、Stereo、約190 kbps |
| 曲尺 | 91.000秒 | 107.521秒 |
| 公開Prompt／Negative | 倍音を極小化し、導入を180 Hz未満へ集中 | sub-focused・基音中心、180 Hz未満へ集中 |
| BPM指定 | 80–86 | 80–86 |
| SHA-256 | `4ea40b2ae2d4…b23638f0` | `3116cb69406c…9a8c95d5` |

両候補は、Bass開始0:00、無音なし、0〜2秒Bass単独、2秒の疎なPiano、後続minimal soft brush drumsを公開Promptで指定する。[1] [2] 非表示seed・内部設定は共有ページに表示されないため、公開Prompt差と生成差を分離して因果断定しない。

## 0〜2秒Bass導入の比較

| 指標 | 001 Master | CAND-006 | CAND-008 | CAND-009A |
|---|---:|---:|---:|---:|
| 持続信号開始 | 0.400秒 | 0.100秒 | **0.000秒** | **0.000秒** |
| 導入RMS | -22.64 dBFS | -16.50 dBFS | **-16.80 dBFS** | -16.05 dBFS |
| Low 20–180 Hz比率 | 98.04% | 66.88% | **73.31%** | 71.26% |
| Low-mid 180–2,000 Hz比率 | 1.80% | 33.12% | **26.59%** | 28.57% |
| スペクトル重心 | 97.7 Hz | 256.6 Hz | **176.5 Hz** | 253.2 Hz |
| Low比率80%以上の窓割合 | 45.0% | 27.5% | **45.0%** | 17.5% |
| 導入Side/Mid比 | -32.40 dB | -11.27 dB | -9.26 dB | -9.09 dB |
| 最大RMS上昇 | 0.45秒 | 0.10秒 | 1.30秒 | 0.90秒 |

CAND-008はスペクトル面の全主要指標でCAND-006を改善した。導入RMSは001 Masterより5.84 dB高く、Side/Mid比は23.14 dB高いため、音量と空間幅は未達である。CAND-008の開始時刻を0.00秒で検出した点は最新受入条件に沿うが、MP3解析のみでBass単独の厳密な実在を証明するものではない。

> **判定:** 次の比較基準をCAND-008へ更新する。次の主変数は**導入0〜2秒のStereo幅（左右差）だけ**とし、帯域・開始時刻・楽器構成・後続展開は固定する。

## Fact / Hypothesis / Evidence / Result

| 区分 | 内容 |
|---|---|
| FACT | CAND-008の0〜2秒Low比率73.31%は、測定済み候補004〜009Aで最高である。 |
| FACT | CAND-008のLow-mid比率26.59%はCAND-006より6.53ポイント低く、Low比率80%以上の窓割合45.0%は001 Masterと同値である。 |
| FACT | CAND-008・009Aの持続信号開始はともに0.00秒である。 |
| FACT | CAND-008・009Aの導入Side/Mid比は-9 dB台で、001 Masterの-32.40 dBより広い。 |
| HYPOTHESIS | CAND-008の残存するSide成分は、BassのStereo処理、残響、またはMP3処理の複合要因による可能性がある。 |
| HYPOTHESIS | CAND-008の導入RMSが高いのは、Bass音量、残響、または非Bass成分の影響を含む可能性がある。 |
| EVIDENCE | 詳細測定JSON、CSV、図1、共有Sunoページの公開Prompt。 |
| RESULT | CAND-008は現時点の最良候補。ただしBass単独の厳密確認、音色・ノイズ、Loop品質、狭い空間への一致は未完了。 |

## 次の一変数検証

CAND-008の以下を固定する。Bass開始0:00、無音なし、0〜2秒Bass単独、極低域・倍音抑制・180〜2,000 Hz共鳴除外、2.00秒の疎なPiano、後続minimal soft brush drums、既存Negative指定である。

> **変更対象（1変数）:** 導入0〜2秒の空間幅に、`dual-mono identical left and right channels; no stereo width, panning, left-right variation, or spatial modulation during the first 2.00 seconds`を追加する。

この変更で、Low比率とLow-mid比率を維持したまま、導入Side/Mid比を001 Masterの-32.40 dBへ近づけられるかを測定する。次候補では、まず導入Side/Mid比・左右相関・Low比率・Low-mid比率・導入RMSをCAND-008と比較する。

## 制約と未完了事項

| 項目 | 状態 | 理由・次対応 |
|---|---|---|
| Bass単独の厳密確認 | `open` | フルミックス測定のみでは個別楽器の有無を断定できない。ステム分離または人による聴取記録が必要。 |
| クリック／金属音／アタック | `open` | Public Promptの除外指定は確認済みだが、聴感上の結果確認が必要。 |
| 導入空間の一致 | `open` | CAND-008のSide/Mid比-9.26 dBは001 Masterとの差が大きい。次の一変数検証対象。 |
| Loop自然さ | `open` | 終端8秒→冒頭8秒の聴取試験が必要。 |

## 保存データ

| 種別 | 保存先 |
|---|---|
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidates_008_009_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno008_009a_intro.png` |
| 再現スクリプト | `tools/compare_cafe001_suno_candidates.py` |

## References

[1]: https://suno.com/s/OH6EsNilE64L1fgm "Suno — 008 by 「Runa」"
[2]: https://suno.com/s/Oo6Nbb0edO38Qwwn "Suno — 009A by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a.json "FieldRise — 001 Master and Suno 008/009A measurement dataset"
[4]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json "FieldRise — 001 Master and Suno 006/007 measurement dataset"
