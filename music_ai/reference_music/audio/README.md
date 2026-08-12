# 001・002 参照音源台帳

> **用途**: Issue #2のA1およびB1以降で、001・002の同一参照音源を再生・検証するためのGitHub登録台帳。ユーザーの指示により、公開リポジトリでの参照用に登録する。

## 登録音源

| 参照ID | GitHub登録音源 | 由来 | 形式 | 長さ | サンプルレート | ファイルSHA-256 |
|---|---|---|---|---:|---:|---|
| 001 | [`001_reference_main.flac`](001_reference_main.flac) | 受領した`001.wav`を可逆圧縮 | FLAC、Stereo | 222.400秒 | 48 kHz | `d18f30ea90b8a1117c93d8c7615544101f867a25a21011c833a0fce44822a880` |
| 002 | [`002_reference_stem_mix.flac`](002_reference_stem_mix.flac) | 受領したBass／Drums／その他／ボーカルの4ステムを`amix normalize=0`で合成 | FLAC、Stereo | 212.920秒 | 44.1 kHz | `7c1a2eb95260d3e947810d146b89ff242f6800c0aff720ba7b7f3e80515878ad` |

## 検証結果

| 項目 | 結果 |
|---|---|
| 001の可逆性 | 元WAV PCMとFLAC復号PCMのMD5はともに`4773793fd148d74f64c9d08ea8496c64`で一致。 |
| 001の音圧 | 平均-16.8 dB、最大-2.5 dB。 |
| 002の音圧 | 平均-16.7 dB、最大-2.2 dB。 |
| 002のMain | 受領したMainはRMS -240.00 dBFSの無音であり、参照用には使用しない。 |

## 002の合成方法

```text
Bass + Drums + その他 + ボーカル
→ FFmpeg amix (inputs=4, normalize=0, duration=longest)
→ 002_reference_stem_mix.flac
```

`normalize=0`により、4ステムのゲインを正規化せずに合成している。各ステムは同一の212.920秒・44.1 kHz・Stereoであり、時間軸を変更していない。

## 運用上の注意

- B1以降は、本ディレクトリのFLACを再生基準として使用する。
- 分析結果には参照ID、ファイルSHA-256、解析日を必ず記録する。
- 002の正式Mainを後日受領した場合は、`002_reference_stem_mix.flac`を削除せず、別バージョンとして登録し、A1の比較結果を更新する。
- FLACはWAVより容量を抑えながら、音源データを不可逆圧縮しない。

## 関連資料

[A1 — 001・002 正解データ取得](../../experiments/A1_001-002-ground-truth-capture.md)  
[001・002 ステム実測レポート](../../analysis/cafe/2026-08-12_001-002-stem-measurement.md)
