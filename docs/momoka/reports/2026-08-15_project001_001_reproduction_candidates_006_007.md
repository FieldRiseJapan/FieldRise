# Project-001｜001再現検証：Suno候補006・007 比較報告

**作成日:** 2026-08-15（GMT+9）
**作成者:** Manus AI（COO）
**検証対象:** 001 Master、Suno候補004〜007
**判定範囲:** 公開Prompt／Negative指定と、全体ミックスを対象とした客観的音響プロキシの比較。個別楽器の存在・不在、クリック音の知覚、Bassの主観的音色、Loop自然さは、この測定だけで断定しない。

![001 Masterと候補006・007の0〜2秒比較](../../music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno006_007_intro.png)

*図1：50ミリ秒窓におけるRMSと帯域エネルギー比。濃線はRMS、背景はLow（20–180 Hz）・Low-mid（180–2,000 Hz）・High（2,000–10,000 Hz）の相対比である。*

## 結論

候補006・007は、公開Prompt、公開Negative指定、BPM 80–86が同一の生成出力ペアである。[1] [2] このPromptは、Bass開始0:00、無音なし、0〜2秒Bass単独、低域中心、上位倍音・early stereo reverb抑制という、先行検証で定めた改善条件を明示している。

**CAND-006は004〜007の中で、0〜2秒のLow比率が最も高い66.88%であり、現時点の最良候補である。** 先行最良のCAND-005（63.56%）より3.32ポイント改善し、Low-mid比率も36.32%から33.12%へ低下した。[3] [4] ただし001 MasterのLow比率98.04%には31.16ポイント届かず、CAND-006の導入スペクトル重心は256.6 Hzで、001 Masterの97.7 Hzより高い。Bass単独性の達成は未確定である。

**CAND-007は0.00秒から持続信号を検出した点では最新受入条件に近い一方、0〜2秒Low比率37.71%、Low-mid比率62.24%であり、帯域面では004〜007の中で最も不利である。** CAND-006は持続信号開始が0.10秒で、0:00開始条件への適合はMP3デコードの先頭処理を含むため留保するが、帯域構成と導入レベルでは007より優れる。[3]

## 検証入力と再現性

| 項目 | CAND-006 | CAND-007 |
|---|---|---|
| Suno song ID | `89a554f4-7676-43f5-9435-498a02243f59` | `fa977d24-f9a1-4b74-bffc-fb3224614245` |
| 形式 | MP3、48 kHz、Stereo、約191 kbps | MP3、48 kHz、Stereo、約181 kbps |
| 曲尺 | 153.841秒 | 104.360秒 |
| 公開Prompt／Negative | 同一表示 | 同一表示 |
| BPM指定 | 80–86 | 80–86 |
| SHA-256 | `a1f02349bbb8...ace0a288` | `605689f30d42...dff541757` |

公開Promptは、Bassの0:00開始・無音なし、0〜2秒のBass単独、低域優勢、上位倍音抑制、中央・親密な定位、intro中のwide stereo bassおよびstereo reverb除外、2秒の疎なPiano導入、後続minimal soft brush drumsを明示する。[1] [2] 非表示seed・内部設定は確認できないため、両候補を公開条件が同じ生成出力ペアとして扱うが、完全な一変数実験とは主張しない。

## 0〜2秒Bass導入の比較

| 指標 | 001 Master | CAND-004 | CAND-005 | CAND-006 | CAND-007 |
|---|---:|---:|---:|---:|---:|
| 持続信号開始 | 0.400秒 | 0.000秒 | 0.000秒 | 0.100秒 | 0.000秒 |
| 導入RMS | -22.64 dBFS | -15.13 dBFS | -15.62 dBFS | -16.50 dBFS | -15.12 dBFS |
| Low 20–180 Hz比率 | 98.04% | 57.32% | 63.56% | **66.88%** | 37.71% |
| Low-mid 180–2,000 Hz比率 | 1.80% | 42.51% | 36.32% | **33.12%** | 62.24% |
| スペクトル重心 | 97.7 Hz | 215.8 Hz | 217.4 Hz | 256.6 Hz | 217.6 Hz |
| Low比率80%以上の窓割合 | 45.0% | 15.0% | 27.5% | 27.5% | 7.5% |
| 導入Side/Mid比 | -32.40 dB | -9.18 dB | -10.24 dB | -11.27 dB | -13.94 dB |
| 最大RMS上昇 | 0.45秒 | 1.85秒 | 1.35秒 | 0.10秒 | 0.95秒 |

CAND-006は、004・005よりLow比率を改善し、導入RMSも001 Masterへ近づいた。一方、Low比率80%以上の窓割合はCAND-005と同じ27.5%にとどまり、導入全体を安定して低域優勢にできていない。CAND-007はSide/Mid比が候補中では最も低く、中央寄りの可能性があるものの、Low-mid比率が大幅に高いため、Bass単独導入の帯域要件を満たす候補とは評価しない。

> **判定:** CAND-006を次の基準候補として採用する。ただし「0〜2秒に他楽器が混入していない」「Bassの音色・アタック・クリック音が適切である」は、全体ミックス測定では確認できない。人によるA/B聴取またはステム分離で追認する。

## Fact / Hypothesis / Evidence / Result

| 区分 | 内容 |
|---|---|
| FACT | CAND-006・007は同一の公開Prompt／Negative指定／BPM指定を表示し、異なる音源ハッシュを持つ。 |
| FACT | CAND-006のLow比率66.88%は004〜007で最高、Low-mid比率33.12%は004〜006の中で最低である。 |
| FACT | CAND-007は0.00秒から持続信号を検出する一方、Low-mid比率62.24%で候補中最高である。 |
| HYPOTHESIS | CAND-006の0.10秒開始検出は、実際のBass開始遅延、MP3先頭のエンコード処理、または両方の影響を含む可能性がある。 |
| HYPOTHESIS | CAND-006の高い導入スペクトル重心は、Bassの上位倍音、早期の非Bass成分、または音源処理の複合要因による。 |
| EVIDENCE | `2026-08-15_project001_001_vs_suno006_007.json`、同CSV、図1、共有Sunoページの公開Prompt。 |
| RESULT | CAND-006は候補中の最良だが、001 Masterの低域集中・狭い空間・導入レベルへは未到達。 |

## 次の一変数検証

CAND-006を基準に、Bass開始0:00・無音なし、0〜2秒のPiano／Drums／メロディ／他楽器なし、2秒の疎なPiano、後続minimal brush drums、既存Negative指定を固定する。次の候補は**Bassの倍音量だけ**を変更し、低域集中をさらに強める。

> **変更対象（1変数）:** 既存の`restrained upper harmonics`を、`very little overtone content; keep nearly all intro energy below 180 Hz and avoid audible 180–2,000 Hz resonance during the first 2.00 seconds`へ強化する。

この変更は、CAND-006で残るLow-mid 33.12%と高いスペクトル重心を直接検証する。開始時刻や曲の構成を変えないため、次候補でLow比率、Low-mid比率、スペクトル重心、導入RMS、Side/Mid比が改善するかを一変数として評価できる。

## 制約と未完了事項

| 項目 | 状態 | 理由・次対応 |
|---|---|---|
| Bass単独の厳密確認 | `open` | フルミックス測定のみでは個別楽器の有無を断定できない。ステム分離または人による聴取記録が必要。 |
| クリック／金属音／アタック | `open` | Public Promptの除外指定は確認済みだが、聴感上の結果確認が必要。 |
| CAND-006の0.10秒開始 | `open` | MP3先頭処理を含む可能性があるため、原音エクスポートまたは聴取で追認する。 |
| Loop自然さ | `open` | 終端8秒→冒頭8秒の聴取試験が必要。 |

## 保存データ

| 種別 | 保存先 |
|---|---|
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidates_006_007_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno006_007_intro.png` |
| 再現スクリプト | `tools/compare_cafe001_suno_candidates.py` |

## References

[1]: https://suno.com/s/Y4pUYkjkf5VRtgNb "Suno — 006 by 「Runa」"
[2]: https://suno.com/s/KH1HYSA4VPQxZJQj "Suno — 007 by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json "FieldRise — 001 Master and Suno 006/007 measurement dataset"
[4]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json "FieldRise — 001 Master and Suno 004/005 measurement dataset"
