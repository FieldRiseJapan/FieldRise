# Project-001｜Suno一変数検証 manifest

**実験ID:** `YYYY-MM-DD_001_or_002_CAND-XXX`
**対象:** `001` または `002`
**担当:** 社長（生成）／桃花COO（解析・記録）
**正本:** `001_reference_main.flac` または `002_reference_main.flac`
**前回の最良候補:** `CAND-XXX`

## 実験目的

| 項目 | 記録内容 |
|---|---|
| 今回の仮説 | 例：導入0〜2秒のBassをdual-mono指定にすると、001のSide/Mid比との差が縮まる。 |
| 変更する変数 | **一つだけ記入する。** 例：Bassの定位指定。 |
| 固定条件 | 前回最良候補と同じPrompt本文、テンポ帯、尺、楽器編成、Negative指定、その他の生成設定。 |
| 成功指標 | 001：Low比率、Side/Mid比、0〜2秒の軌跡距離。002：0〜8秒の軌跡距離、RMS・帯域・Onsetの推移。 |
| 判定方法 | `cafe_candidate_intake.py` → `cafe_reproduction_analyzer.py` → 必要時`cafe_stem_assist.py` → 聴取確認。 |

## Suno設定の記録

| 設定 | 値 |
|---|---|
| 生成日時（JST） |  |
| 曲名／候補ID |  |
| 共有URL |  |
| Prompt全文 |  |
| Negative指定全文 |  |
| Weirdness |  |
| Safe Zone |  |
| Style Influence |  |
| Strong |  |
| Duration |  |
| BPMまたはテンポ帯 |  |
| Seed／version（表示される場合） |  |

## 001用の固定順序

0〜2秒のBass単独性を最初に検証する。改善順序は、**Bass単独性 → 帯域・倍音 → Stereo幅 → Piano導入 → Drums・空間 → 全体 → Loop** とする。Bass開始0:00・無音なしを固定条件にするときは、実測上の持続信号開始と区別して記録する。

## 002用の固定順序

0〜8秒の密度遷移を最初に検証する。改善順序は、**Bass → 伴奏の密度遷移 → Piano → Drums → 空間 → 全体 → Loop** とする。テンポ解釈が分かれる場合は、DAWグリッドと聴取の拍感を別々に記録する。

## 書き出しと引き渡し

候補音源はWAV 48 kHz／24-bit／Stereoを優先する。Suno等のMP3を用いる場合は、形式差を明記する。Gitには原則としてバイナリを保存せず、音源SHA-256、共有URL、設定、解析JSON／CSV／PNG、聴取メモを保存する。

## 結果記入

| 区分 | 記録内容 |
|---|---|
| FACT | 測定値、ファイル仕様、ハッシュ、確認済み設定。 |
| HYPOTHESIS | 再現差が残る原因の推定。 |
| EVIDENCE | manifest、JSON、CSV、図、stem、聴取メモ、共有URL。 |
| RESULT | 最良候補、未達項目、次に変更する一変数。 |
