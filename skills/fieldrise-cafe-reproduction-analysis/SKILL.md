---
name: fieldrise-cafe-reproduction-analysis
description: "Analyze and improve FieldRise Cafe 001 and 002 music recreations. Use when evaluating Suno or DAW candidate audio against 001/002 masters, designing a one-variable reproduction experiment, checking bass-only intros, evaluating piano/drum transitions, comparing stereo and dynamics, or preparing Fender Studio edit instructions."
---

# FieldRise Cafe 001・002 再現解析

001・002の正本を変更せず、候補曲またはDAW書き出しを客観測定・聴取確認・一変数検証で比較する。出力は再利用可能な測定データ、順位、Fact/Hypothesis分離レポート、次の検証条件とする。

## 正本と保存先

- 001正本: `music_ai/reference_music/audio/001_reference_main.flac`
- 002正本: `music_ai/reference_music/audio/002_reference_main.flac`
- 分析データ: `music_ai/analysis/cafe/measurements/`
- 図: `music_ai/analysis/cafe/figures/`
- 正式報告: `docs/momoka/reports/latest_report.md` と日付付き詳細報告
- 候補音源は原則Git追跡しない。ハッシュ、公開URL、形式、曲尺、生成条件だけを記録する。

## 必須ガードレール

1. 正本を編集・上書き・削除しない。候補と作業版は別フォルダに置く。
2. 1回の実験で変える変数は1つだけにする。変更前後のPrompt／DAW設定と固定条件をmanifestへ記録する。
3. 全体ミックスの測定だけで「特定楽器が存在しない」「クリック音がない」と断定しない。個別楽器、ノイズ、Loop感はステムまたは人の聴取で追認する。
4. MP3とFLAC／WAVを比較するときはコーデック差を制約として明記する。判定は主に相対比較に使う。
5. 外部公開、アップロード、購入、認証画面操作は自動化対象に含めない。

## 手順

### 1. 入力を固定する

候補ファイル、共有URL、タイトル、生成条件、音源ハッシュ、書き出し仕様をmanifestへ記録する。同梱の`scripts/cafe_candidate_intake.py`で候補manifestを作成し、変更変数と固定条件を必ず記録する。WAV 48 kHz／24-bit／Stereoを測定正本として優先する。Suno等のMP3はスクリーニング用として扱う。

### 2. 同一条件で測定する

同梱の`scripts/cafe_reproduction_analyzer.py`を実行し、001／002正本と候補の以下を測定する。

- 全体と導入区間のRMS、Peak、Crest factor
- Low（20–180 Hz）、Low-mid（180–2,000 Hz）、High（2,000–10,000 Hz）の比率
- スペクトル重心、Stereoの左右相関・Side/Mid比
- 50 ms窓の持続信号開始、RMS上昇、Onset強度
- 001は0〜2秒、002は0〜8秒を重点区間として評価する

必要なときだけ、音源分離でBass／Drums／otherを補助確認する。分離結果にはbleedingやartifactの可能性があるため、絶対的な事実として扱わない。

### 3. 001の判定

001では導入0〜2秒の低域集中、音量、空間を最初に評価する。正本の目安は、導入RMS -22.64 dBFS、Low比率98.04%、Low-mid比率1.80%、Side/Mid比-32.40 dBである。候補スコアは、これらへの距離を示す補助指標に使い、合否を機械的に断定しない。

導入を改善する順序は、Bass単独性→帯域／倍音→Stereo幅→Piano導入→Drums／空間→全体→Loopとする。

### 4. 002の判定

002では0〜8秒の密度遷移を最優先する。Bass、Piano、Drums、空間を一度に変えない。まず持続信号、RMS、Low／Low-mid比率、Onsetを時間軸で比較し、次にPiano導入とDrumsの有無をステムまたは聴取で確認する。テンポ解釈が複数ある場合は、DAWグリッドと社長の拍感確認をmanifestへ残す。

### 5. Fact/Hypothesisを分離して報告する

必ず次の表を含める。

| 区分 | 記載内容 |
|---|---|
| FACT | 測定値、ファイル形式、ハッシュ、公開Prompt上の条件、確認できた操作。 |
| HYPOTHESIS | 原因推定、楽器・音色・空間の解釈。 |
| EVIDENCE | JSON、CSV、図、ステム、聴取メモ、URL。 |
| RESULT | 最良候補、未達事項、次に変える一変数。 |

## Fender Studioへの引き渡し

Fender Studio用には、`docs/momoka/projects/project001_fender_studio_readiness_checklist.md`の引き渡し票を用いる。001は導入0〜2秒、002は0〜8秒を対象にし、書き出し後のWAVとmanifestを再測定へ戻す。

## 検証完了条件

- 正本・候補・比較条件が追跡可能である。
- JSON／CSVと比較図が生成され、JSON構文とGit差分検査に通る。
- 最良候補と未完了事項を混同していない。
- 次の変更が一変数として明示されている。
- `latest_report.md`、詳細報告、Gitコミットに反映されている。
