# Project-001｜Cafe 001再現検証｜候補004・005比較報告

**状態:** `candidate_evaluation_complete`
**正式指示:** [`2026-08-15_project001_reproduction_verification.md`](../instructions/2026-08-15_project001_reproduction_verification.md)
**詳細比較報告:** [`2026-08-15_project001_001_reproduction_candidates_004_005.md`](2026-08-15_project001_001_reproduction_candidates_004_005.md)
**候補取得記録:** [`2026-08-15_project001_suno_candidate_intake.md`](2026-08-15_project001_suno_candidate_intake.md)

> **正式結論:** Suno候補004・005は公開PromptとNegative指定が同一の生成出力ペアである。しかし、001 Masterの導入0〜2秒には未到達である。候補は001より即時かつ約7 dB高く始まり、Low比率は001より低く、Low-mid比率は高い。最新正式指示に従い、次の生成ではBass開始0:00・無音なしを固定し、**0〜2秒のBass単独性を高める導入スペクトル／空間制約だけ**を検証する。[1] [2] [3] [4]

## 検証の完了状況

| 項目 | 状態 | 結果 |
|---|---|---|
| 001 Master正本の固定 | 完了 | `001_reference_main.flac`、48 kHz／Stereo、222.400秒を基準に固定した。 |
| 001の0〜2秒Bass基準 | 完了 | Bass stem onset 0.464秒、フルミックス持続信号開始0.400秒、0〜2秒Low比率98.04%を確認。最新受入条件のBass開始0:00・無音なしとは別に管理する。 |
| Suno候補004・005の取得 | 完了 | ユーザー共有URLに対応する公開MP3を取得し、曲尺・形式・SHA-256を記録した。 |
| 生成情報の照合 | 完了（限定） | 公開Prompt／Negative指定は同一。seed等の非表示設定は未確認。 |
| 同条件の音響比較 | 完了 | 0〜2秒RMS、帯域比、持続信号開始、RMS遷移、空間プロキシを測定した。 |
| 人によるA/B聴取 | `open` | Bassの楽器実在、クリック／金属音、Piano／Drumsの知覚Onset、Loop感は未確定。 |
| 次の一変数生成 | `ready` | Bass開始0:00・無音なしを固定し、0〜2秒のBass単独性を高める導入スペクトル／空間制約のみを加える。 |

## 0〜2秒の主要測定結果

| 指標 | 001 Master | CAND-004 | CAND-005 | 判定 |
|---|---:|---:|---:|---|
| 持続信号開始（全体ミックス） | 0.400秒 | 0.000秒 | 0.000秒 | 両候補は即時開始で、001と不一致。 |
| 導入RMS | -22.64 dBFS | -15.13 dBFS | -15.62 dBFS | 両候補は001より約7 dB高い。 |
| Low 20–180 Hz比率 | 98.04% | 57.32% | 63.56% | 005が候補中では近いが、001水準には未到達。 |
| Low-mid 180–2,000 Hz比率 | 1.80% | 42.51% | 36.32% | 両候補は001より大幅に高い。 |
| 最大RMS上昇 | 0.45秒 | 1.85秒 | 1.35秒 | 004は2秒付近の遷移プロキシとして相対的に近い。 |
| Side/Mid比 | -42.68 dB | -9.61 dB | -8.12 dB | 両候補は001より空間的に広い可能性が高い。 |

## Fact/Hypothesisの分離

| 区分 | 内容 |
|---|---|
| FACT | 候補004・005の公開PromptとNegative指定は同一表示であり、音源SHA-256は異なる。 |
| FACT | 001 Masterは候補より遅く、低域中心かつ低レベルで導入する。 |
| FACT | 005は候補中で最も高いLow比率、004は候補中で最も遅い大きなRMS遷移を示す。 |
| HYPOTHESIS | 候補のLow-mid成分増加は、Bassの倍音、Piano等の早期成分、空間処理、またはMP3処理のいずれか、もしくは複合要因による。 |
| OPEN | 音色、クリック／金属音、個別楽器の実在、Piano／Drumsの厳密なOnset、Loop品質は人によるA/B聴取またはステム分離が必要。 |

## 次の一変数生成指示

> **Bass開始0:00・無音なしは固定する。** 0〜2秒のBass導入指定に、`single mono-centered low-register acoustic upright bass; keep the intro energy predominantly in 20–180 Hz; suppress bright upper harmonics and stereo reverb during the first 2.00 seconds` を加える。

0〜2秒のPiano／Drums／メロディ／他楽器なし、2.00秒の疎なPiano導入、後続minimal brush drums、既存のNegative指定は固定する。次候補が生成されたら、同じ測定スクリプトで0〜2秒のRMS、Low比率、Low-mid比率、持続信号開始、RMS遷移、Side/Mid比を比較し、Bass単独性の改善だけを評価する。

## 保存済み成果物

| 種別 | 保存先 |
|---|---|
| 正式比較報告 | `docs/momoka/reports/2026-08-15_project001_001_reproduction_candidates_004_005.md` |
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidate_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno004_005_intro.png` |
| 比較再現スクリプト | `tools/compare_cafe001_suno_candidates.py` |
| 更新前の入口報告 | `docs/momoka/reports/archive/2026-08-15_pre_candidate_004_005_comparison_latest_report.md` |

**Commit SHA:** この報告の更新コミット後に確定し、本ファイルへ追記する。
**Push先:** `origin/main`（反映後に結果を追記する）。

## References

[1]: https://suno.com/s/QhzmREKfyxAo6uyW "Suno — 004 by 「Runa」"
[2]: https://suno.com/s/ksoKv0j8BunFng6L "Suno — 005 by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json "FieldRise — 001 Master and Suno candidate measurement dataset"
[4]: https://github.com/FieldRiseJapan/FieldRise/blob/main/docs/momoka/instructions/2026-08-15_project001_numbering_and_bass_intro.md "FieldRise — Project-001 verification numbering and bass-intro instruction"
