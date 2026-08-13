# Cafe004｜001・002 DNA引継ぎブリーフ Ver.1

**状態:** 制作前。Cafe004の音源・歌詞・生成ログは未登録。
**目的:** Cafe004を001・002の単純な複製にせず、観測済みの再現ガードレールと一変数実験の原則を引き継ぐ。

## 採用する固定条件

| 項目 | Cafe004への指示 | 根拠・状態 |
|---|---|---|
| 導入 | Bass主導の開始を0.5秒未満に置く | 001・002ともBass onset 0.464秒。固定候補。 |
| Drums | Intro 0–2秒はDrumsを前面化しない | 実測上、Drumsは低いRMS。固定候補。 |
| Vocal | Lead vocalを前面化しない | 分離Vocalは主成分ではない。固定候補。 |
| 伴奏導入 | 0.255秒近傍または2.299秒近傍のどちらか**一方**を選ぶ | B1の唯一の比較変数。 |
| 周波数バランス | 導入はLow／Low-midを土台にし、高域過多を避ける | 001・002の導入部実測。楽器名の指定ではない。 |
| Loop | 生成後に終端→冒頭のDAW連結聴取を行う | 数値プロキシだけで合格にしない。 |

## 生成時に固定してはいけないもの

002のテンポは80.75、83.35、123.05 BPMの推定値が不一致であり、正式Mainも未確定である。そのため、Cafe004では002由来のテンポを完成値として固定しない。テンポ、調性、伴奏の楽器種、音色名、歌詞・ストーリーは、本DNAだけから断定しない。

## Cafe004生成用の安全なプロンプト骨格

```text
Cafe background instrumental, minimal arrangement, no lead vocal.
Start within the first 0.5 seconds with a low bass-led opening.
Keep drums very understated during the first 2 seconds.
Use sparse low-mid accompaniment [choose one experiment: enters near 0.25 seconds OR near 2.3 seconds].
Avoid heavy build-ups, dense arrangement, strong drums, and excessive high-frequency effects.
Create a loop-aware ending, then validate the end-to-start transition by listening after generation.
```

この骨格は音響観測に基づく制作要件であり、特定の既存曲、特定のアーティスト、またはその固有の表現を模倣する指示として使わない。

## Cafe004の生成後に必ず残す記録

| 記録項目 | 内容 |
|---|---|
| 生成設定 | 選択Model、プロンプト、Style Influence、Weirdness、曲尺、生成日時 |
| 変数 | 伴奏導入時刻以外に変更した項目がないか |
| 音源整合 | SHA-256、曲尺、sample rate、channels、Mainが無音でないこと |
| 自動測定 | Bass onset、RMS、crest factor、Low／Low-mid／High比、spectral centroid、Loop proxy |
| 聴取レビュー | IntroのDrums、Vocal、音数、ノイズ、終端→冒頭接続をタイムコード付きで記録 |
| 判定 | 001・002 DNAとの一致／逸脱、次に変える一変数、採否 |

## 参照

- [001・002 DNA設計図](../analysis/cafe/2026-08-14_001-002_dna_design_blueprint.md)
- [完全音響分析・独立ピアレビュー](../analysis/cafe/2026-08-14_001-002_expert_peer_review.md)
- [Cafeシリーズ作成ルール](../rules/cafe_series_creation_rule_v1.1.md)
