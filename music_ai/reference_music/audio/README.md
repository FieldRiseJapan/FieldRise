# 001・002 参照音源台帳

> **用途**: Issue #2のA1およびB1以降で、001・002の同一参照音源を再生・検証するためのGitHub登録台帳。ユーザーの指示により、公開リポジトリでの参照用に登録する。

## 登録音源

| 参照ID | GitHub登録音源 | 由来 | 形式 | 長さ | サンプルレート | ファイルSHA-256 |
|---|---|---|---|---:|---:|---|
| 001 | [`001_reference_main.flac`](001_reference_main.flac) | 受領した`001.wav`を可逆圧縮 | FLAC、Stereo | 222.400秒 | 48 kHz | `d18f30ea90b8a1117c93d8c7615544101f867a25a21011c833a0fce44822a880` |
| 002 Main | [`002_reference_main.flac`](002_reference_main.flac) | ユーザー提供の002完成版WAVを可逆圧縮して登録 | FLAC、Stereo | 212.920秒 | 48 kHz | `18e810d57eeedf6153e2da41670f4456b300e04473b93b7c740d00607d7c403b` |
| 002 Stem Mix | [`002_reference_stem_mix.flac`](002_reference_stem_mix.flac) | 受領したBass／Drums／その他／ボーカルの4ステムを`amix normalize=0`で合成した比較用履歴 | FLAC、Stereo | 212.920秒 | 44.1 kHz | `7c1a2eb95260d3e947810d146b89ff242f6800c0aff720ba7b7f3e80515878ad` |

## 検証結果

| 項目 | 結果 |
|---|---|
| 001の可逆性 | 元WAV PCMとFLAC復号PCMのMD5はともに`4773793fd148d74f64c9d08ea8496c64`で一致。 |
| 001の音圧 | 平均-16.8 dB、最大-2.5 dB。 |
| 002の音圧 | 平均-16.7 dB、最大-2.2 dB。 |
| 002のMain | ユーザー提供WAVは平均RMS -18.00 dBFSで無音ではない。既存Stem Mixとの波形相関は左右`0.99814227`／`0.99860335`であり、正式Mainとして登録した。 |

## 002の合成方法

```text
Bass + Drums + その他 + ボーカル
→ FFmpeg amix (inputs=4, normalize=0, duration=longest)
→ 002_reference_stem_mix.flac
```

`normalize=0`により、4ステムのゲインを正規化せずに合成している。各ステムは同一の212.920秒・44.1 kHz・Stereoであり、時間軸を変更していない。

## 運用上の注意

- B1以降は、001と`002_reference_main.flac`を再生基準として使用する。
- 分析結果には参照ID、ファイルSHA-256、解析日を必ず記録する。
- `002_reference_stem_mix.flac`は、Mainとの整合確認・分析来歴のために保持する比較用履歴であり、削除しない。
- FLACはWAVより容量を抑えながら、音源データを不可逆圧縮しない。

## 関連資料

[A1 — 001・002 正解データ取得](../../experiments/A1_001-002-ground-truth-capture.md)
[001・002 ステム実測レポート](../../analysis/cafe/2026-08-12_001-002-stem-measurement.md)
[002 ユーザー提供Main検証記録](../../analysis/cafe/2026-08-14_002-user-supplied-main-validation.md)
