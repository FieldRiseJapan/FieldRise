# Project-001｜001再現検証：Suno候補004・005 比較報告

**作成日:** 2026-08-15（GMT+9）
**作成者:** Manus AI（COO）
**検証対象:** 001 Master、Suno候補004、Suno候補005
**判定範囲:** 公開Prompt／Negative指定と、全体ミックスの客観的な音響プロキシによる比較。個別楽器の有無、主観的音色、クリック音の知覚、Loop自然さは、この測定だけで確定しない。

![001 Masterと候補004・005の0〜2秒比較](../../music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno004_005_intro.png)

*図1：50ミリ秒窓におけるRMSと帯域エネルギー比。濃線はRMS、背景はLow（20–180 Hz）・Low-mid（180–2,000 Hz）・High（2,000–10,000 Hz）の相対比である。*

## 結論

候補004・005は、公開ページ上で同一のPromptとNegative指定を使う生成出力ペアであり、比較対象として有効である。[1] [2] しかし、**001 Masterの導入0〜2秒には現時点で到達していない。** 両候補は001 Masterより導入RMSが約7 dB高く、Low帯域の占有率が低く、Low-mid帯域が大きい。これは001 Masterの「遅く・低域中心・非常に狭い空間」という導入像と異なる全体ミックス上の観測である。[3]

候補間では、**CAND-005はLow帯域比率が高く、導入の帯域構成は候補004より001 Masterに近い。** 一方、**CAND-004は最大RMS上昇が1.85秒に現れ、目標である2.00秒の伴奏導入に候補005より近い。** ただし、RMS変化はPianoやDrumsのOnsetを直接証明しないため、この差分は「全体ミックスの遷移時刻プロキシ」として扱う。

最優先の修正は、公開Promptにある`The upright bass is clearly present from the first instant`および`no silence`を、001 Masterに合わせた**開始時刻条件だけ**へ置換することである。001 Masterはフルミックス持続信号が約0.400秒、既存BassステムOnsetが0.464秒であり、候補の「0.00秒から即時・無音なし」という指定とは構造的に矛盾している。[3]

## 検証入力と再現性

| 項目 | 001 Master | CAND-004 | CAND-005 |
|---|---|---|---|
| 入力ファイル | `001_reference_main.flac` | 公開Suno MP3 | 公開Suno MP3 |
| 形式 | FLAC、48 kHz、Stereo | MP3、48 kHz、Stereo | MP3、48 kHz、Stereo |
| 曲尺 | 222.400秒 | 180.400秒 | 180.680秒 |
| 公開Prompt／Negative | 基準曲のため該当なし | 共有ページで確認 | 共有ページで確認 |
| Prompt同一性 | — | 同一表示 | 同一表示 |
| 取得時SHA-256 | 既存正本に従う | `242bd0c43f919...e0fe017da` | `36536c073b5c...e393f60cc` |

候補004・005の公開Promptは、0〜2秒を「warm acoustic upright bassのみ」とし、2.00秒にPiano、後続で最小限のbrush drumsを指定する。また、初期Piano・Drums・メロディ・無音、硬いBassアタック、クリック／金属的ノイズ等を除外する指定を含む。[1] [2] ただし、seedおよびSunoで非表示の内部パラメータは確認できない。従って本比較は「公開PromptとNegative指定が同じ生成出力の比較」であり、**完全な一変数実験を証明するものではない。**

## 0〜2秒Bass導入の比較

| 指標 | 001 Master | CAND-004 | CAND-005 | 001との差分・読み方 |
|---|---:|---:|---:|---|
| 持続信号開始（全体ミックス） | 0.400秒 | 0.000秒 | 0.000秒 | 両候補は即時開始。001 Masterの遅い立ち上がりと異なる。 |
| 導入RMS | -22.64 dBFS | -15.13 dBFS | -15.62 dBFS | 候補004は+7.51 dB、005は+7.02 dB高い。 |
| Low 20–180 Hz比率 | 98.04% | 57.32% | 63.56% | 005が候補中では近いが、001より34.48ポイント低い。 |
| Low-mid 180–2,000 Hz比率 | 1.80% | 42.51% | 36.32% | 両候補とも001より大幅に高い。個別楽器の同定には使わない。 |
| スペクトル重心 | 97.7 Hz | 215.8 Hz | 217.4 Hz | 両候補の導入は001より明るい帯域重心を示す。 |
| Low比率80%以上の窓割合 | 45.0% | 15.0% | 27.5% | 005が候補中では高いが、001の導入状態には未到達。 |
| 最大RMS上昇（0〜2秒） | 0.45秒：+27.56 dB | 1.85秒：+28.28 dB | 1.35秒：+10.36 dB | 004の大きな遷移は2秒指定により近い。楽器Onsetの断定はしない。 |

> **判定:** 両候補とも、「全体ミックス上の0〜2秒がBassだけである」ことは、この分析だけでは証明できない。一方で、001 Masterに比べて候補は即時かつ高レベルで始まり、導入のLow-mid成分が多いことは客観的に確認できた。Bass中心の001型導入を再現するには、まず**開始時刻と導入ゲイン**を制御する必要がある。

## Bass、Piano、Drums・空間、全体再現の評価

| 検証軸 | FACT（測定・公開情報） | HYPOTHESIS／未確定事項 | 現時点の判定 |
|---|---|---|---|
| Bass | 公開Promptは0〜2秒Bassのみを要求。候補005は候補004よりLow比率が6.24ポイント高い。 | Low-mid差がBass倍音か、他要素混入かは全体ミックスだけでは区別不能。 | 005が帯域上は相対的に良いが、001再現は未達。 |
| Piano導入 | 公開Promptは2.00秒導入を指定。004の最大RMS上昇は1.85秒、005は1.35秒。 | RMS変化がPiano開始そのものかは未確定。実聴とステム分離で再確認が必要。 | 004の時刻プロキシが相対的に良い。 |
| Drums・空間 | 候補は001よりSide/Mid比が高い（004: -9.61 dB、005: -8.12 dB、001: -42.68 dB）。 | 差の原因がreverb、stereo処理、他楽器、MP3処理のいずれかは未確定。 | 両候補は001より空間的に広い可能性が高い。 |
| 全体ダイナミクス | 全体RMSは001 -16.82 dBFS、004 -16.30 dBFS、005 -15.86 dBFS。Crest factorも14.32／14.94／14.73 dBで近い。 | 曲構成・和声・Loop自然さ・主観的なcafe感は数値だけで確定できない。 | 全曲のダイナミクスは近いが、導入構造と空間は未達。 |
| 曲尺 | 001は222.400秒、候補は約180秒。 | 曲尺差が運用上の問題かは要件確認が必要。 | 001完全再現としては不一致。 |

## 次の一変数検証

次の生成では、候補004・005の公開PromptとNegative指定を基準に、**開始時刻条件だけ**を変更する。Pianoの時刻、Drums、空間、楽器構成、Negative指定は変更しない。これにより、まず001 Masterとの差が最も大きい「即時開始」を単独で検証できる。

> **変更対象（1変数）:** `The upright bass is clearly present from the first instant, ... no silence` を、`From 0.00 to 0.40 seconds, preserve near-silence; at 0.40 seconds, introduce only the warm acoustic upright bass with an extremely soft, rounded, natural finger-plucked tone.` に置換する。

| 固定する条件 | 理由 |
|---|---|
| 0〜2秒のPiano／Drums／メロディ／他楽器なし | Bass導入のみを評価するため。 |
| 2.00秒の疎なPiano導入 | 先にBass開始条件だけを検証するため。 |
| 後続minimal brush drums、少音数・長休符、空間・ダイナミクス指定 | 同時変更を避け、評価不能な差分を増やさないため。 |
| Negative指定一式 | クリック、硬いアタック、早期伴奏等の不要要因を固定するため。 |

次の候補では、同じ測定手法により「0〜2秒RMS」「Low比率」「持続信号開始」「最大RMS上昇」を比較する。開始条件の一致後にのみ、第二実験として2.00秒のPiano遷移、第三実験としてDrums・空間を順に扱う。

## 制約とリスク

候補音源はMP3、001 MasterはFLACのため、絶対値はコーデック差の影響を受け得る。よって、候補004と005の相対比較には同一条件で使えるが、001との差は帯域・時間・ダイナミクスの方向性判断を中心とする。また、公開Promptは確認できる一方、非表示seed等を取得できないため、生成差を単一の原因に帰属させない。クリック、金属音、楽器の聴感上の有無、Loop品質については、必要に応じてステム分離または人によるA/Bリスニングで追認する。

## 保存データ

| 種別 | 保存先 |
|---|---|
| 候補取得記録・公開Prompt | `docs/momoka/reports/2026-08-15_project001_suno_candidate_intake.md` |
| 詳細測定JSON | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json` |
| 比較サマリーCSV | `music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005_summary.csv` |
| 導入比較図 | `music_ai/analysis/cafe/figures/2026-08-15_project001_001_vs_suno004_005_intro.png` |
| 再現用スクリプト | `tools/compare_cafe001_suno_candidates.py` |

## References

[1]: https://suno.com/s/QhzmREKfyxAo6uyW "Suno — 004 by 「Runa」"
[2]: https://suno.com/s/ksoKv0j8BunFng6L "Suno — 005 by 「Runa」"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json "FieldRise — 001 Master and Suno candidate measurement dataset"
