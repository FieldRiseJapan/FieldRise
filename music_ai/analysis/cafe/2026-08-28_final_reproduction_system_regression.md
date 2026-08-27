# Project-001｜001・002再現解析システム 最終回帰検証

**実行日時:** 2026-08-28 05:45〜05:52 JST
**対象:** Cafe 001／002の正規Mainと再現解析システム v1.1
**実行者:** 桃花COO
**目的:** 解析器・回帰テスト・クラウド実行が、正本を変更せずに同じ結果を返すことを最終確認する。

## 結論

001・002の正本自己比較、JSON構文、CSV、比較図、Git差分検査、およびGitHub Actionsのクリーン環境での回帰検証にすべて合格した。001と002を同じKPIで混同せず、001は0〜2秒の低域集中・Stereo幅、002は0〜8秒の密度遷移を重点評価する構成は維持されている。

> **本検証は解析システムの一貫性を確認するものであり、候補曲が001・002を音楽的に再現できたことを示すものではない。** 候補の再現度は、次のSuno候補またはFender Studio書き出しを受領してから測定する。

## 実行結果

| 検証項目 | 001 | 002 | 判定 |
|---|---:|---:|---|
| 自己比較スコア | 100.00 | 100.00 | 合格 |
| 時間軸再現度 `trajectory_distance` | 0.0000 | 0.0000 | 合格 |
| 重点区間 | 0〜2秒 | 0〜8秒 | プロファイル整合 |
| JSON構文 | 有効 | 有効 | 合格 |
| CSV生成 | 有効 | 有効 | 合格 |
| PNG比較図 | 生成済み | 生成済み | 合格 |
| Git差分検査 | — | — | 合格 |

## 最終基準プロファイル

| 指標 | 001：導入0〜2秒 | 002：導入0〜8秒 |
|---|---:|---:|
| RMS | -22.64 dBFS | -20.31 dBFS |
| Low比率（20〜180 Hz） | 96.68% | 18.98% |
| Low-mid比率（180〜2,000 Hz） | 3.04% | 80.97% |
| スペクトル重心 | 113.7 Hz | 477.9 Hz |
| Side/Mid比 | -32.40 dB | -7.19 dB |
| 持続信号開始 | 0.40秒 | 0.20秒 |
| Low優勢窓割合 | 65.00% | 4.37% |

001は導入部の低域・中央定位、002は導入から8秒の帯域・RMS・Onset軌跡が、候補比較における主要な差分となる。絶対値ではなく、同じファイル形式・同じ解析条件での相対比較を優先する。

## クラウド回帰検証

GitHub Actionsの「Cafe Reproduction System Regression」を最新`main`に対して手動実行し、成功した。[1]

| 項目 | 結果 |
|---|---|
| 実行環境 | `ubuntu-latest` + Python 3.12 |
| 依存関係 | NumPy、SoundFile、Matplotlib |
| 実行内容 | 001・002自己比較、JSON構文確認、成果物保管 |
| 実行結果 | `success` |
| 実行URL | [#33115325713][1] |

## FACT / HYPOTHESIS / EVIDENCE / RESULT

| 区分 | 内容 |
|---|---|
| FACT | 001・002とも自己比較スコア100.00、`trajectory_distance` 0.0000を返し、JSON／CSV／PNGが生成された。クラウド回帰も成功した。 |
| HYPOTHESIS | 001・002を別プロファイルとして管理し、候補受領後に一変数だけ変更することで、再現差の原因特定が速くなる。 |
| EVIDENCE | `2026-08-28_final_regression_v1_*`のJSON／CSV／PNG、システムhealth JSON、GitHub Actions実行記録。[1] |
| RESULT | 解析基盤は運用開始可能。候補音源を受領すれば、登録manifest→解析→必要時stem補助→聴取確認→次の一変数提案を実行する。 |

## 未解決事項と次工程

| 未解決事項 | 影響 | 次の対応 |
|---|---|---|
| 新規候補のWAV／FLACまたは共有URLが未受領 | 実際の再現度をランキングできない。 | Suno候補またはFender Studio書き出しを受領後、候補manifestを作成して解析する。 |
| 楽器混入、クリック音、Loopの自然さ | 全体ミックス数値だけでは確定できない。 | 原DAWステム、音源分離補助、社長の聴取メモで追認する。 |
| MP3とWAV／FLACの差 | 絶対値の比較に影響する。 | 可能な限り48 kHz／24-bit／Stereo WAVで統一する。 |
| Fender Studioの直接操作環境 | 遠隔補助は未接続。 | ローカル制作・ファイル連携を優先し、遠隔方式はテスト後に限定する。 |

## 生成物

| 種別 | 保存先 |
|---|---|
| 001 JSON | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_001_analysis.json` |
| 001 CSV | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_001_ranking.csv` |
| 001 図 | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_001_focus.png` |
| 002 JSON | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_002_analysis.json` |
| 002 CSV | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_002_ranking.csv` |
| 002 図 | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_002_focus.png` |
| 統合health | `music_ai/analysis/cafe/system_runs/2026-08-28_final_regression_v1_system_health.json` |

## References

[1]: https://github.com/FieldRiseJapan/FieldRise/actions/runs/33115325713 "GitHub Actions — Cafe Reproduction System Regression #33115325713"
