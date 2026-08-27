# Project-001｜001・002高性能再現解析システム 構築報告

**状態:** `system_ready` / `final_regression_scheduled`
**対象:** Cafe 001・002の再現検証
**更新日時:** 2026-08-27（GMT+9）

> **正式結論:** 001・002を別プロファイルで測定・比較し、候補の再現度を追跡する解析システムを構築した。001は導入0〜2秒の低域集中・Stereo幅、002は導入0〜8秒の密度遷移を別KPIとして扱う。全体ミックスの数値が示せる範囲と、ステムまたは聴取で確認すべき範囲を分離した。

## 構築済みの資産

| 資産 | 役割 | 検証状態 |
|---|---|---|
| [`fieldrise-cafe-reproduction-analysis`スキル](../../skills/fieldrise-cafe-reproduction-analysis/SKILL.md) | 001・002の正本保護、一変数検証、Fact/Hypothesis分離、Fender Studio引き渡しを標準化する。 | スキル検証合格 |
| [`cafe_reproduction_analyzer.py`](../../tools/cafe_reproduction_analyzer.py) | RMS、Peak、帯域比、スペクトル重心、Stereo、持続信号開始、50 ms Onset、時間軸再現度をJSON／CSV／PNGへ出力する。 | v1.1で001・002自己比較・軌跡距離0.0000を確認 |
| [`validate_cafe_reproduction_system.py`](../../tools/validate_cafe_reproduction_system.py) | 正本の自己比較でスコア100、構造化データ、図生成を回帰テストする。 | 001・002合格 |
| [`cafe_stem_assist.py`](../../tools/cafe_stem_assist.py) | Bass／Drums等の補助分離と出力ハッシュ記録を行う。 | 001の15秒クリップで実行合格 |
| [`cafe_candidate_intake.py`](../../tools/cafe_candidate_intake.py) | 候補ID、生成条件、音声仕様、SHA-256、変更変数、固定条件をmanifestへ正規化する。 | 001自己テストで実行合格 |
| [技術リサーチ記録](../../music_ai/research/Cafe_Lab/2026-08-27_reproduction_analysis_technology_research.md) | Essentia、Onset解析、Demucs分離の採用根拠・制約を記録する。 | 完了 |
| [初回回帰テスト](../../music_ai/analysis/cafe/2026-08-27_reproduction_analysis_system_validation.md) | 001・002の基準プロファイル、図の確認、Stem補助の制約を記録する。 | 完了 |
| [GitHub回帰検証](../../.github/workflows/cafe-reproduction-system-regression.yml) | 任意の時点でクラウド環境の自己比較を再実行する。 | 手動実行成功 |

## 001・002の基準KPI

| 指標 | 001：導入0〜2秒 | 002：導入0〜8秒 |
|---|---:|---:|
| RMS | -22.64 dBFS | -20.31 dBFS |
| Low比率（20〜180 Hz） | 96.68% | 18.98% |
| Low-mid比率（180〜2,000 Hz） | 3.04% | 80.97% |
| スペクトル重心 | 113.7 Hz | 477.9 Hz |
| Side/Mid比 | -32.40 dB | -7.19 dB |
| 持続信号開始 | 0.40秒 | 0.20秒 |
| 重点判断 | 低域優勢と中央定位 | 中低域の密度遷移 |

これらの値は本システムの50 ms窓・-55 dBFS・2窓連続の定義で測定した基準である。既存分析との数値差は、区間、窓、FFT処理の定義差により起こり得るため、候補は必ず同一システム内での相対比較を優先する。

## 検証結果

001・002の正本をそれぞれ同一ファイルと比較し、両方で再現スコア100.00、`trajectory_distance` 0.0000、JSON構文検査、CSV、PNGを生成した。001の図は0.40〜0.50秒付近の立上がりと低域優勢を、002の図は0〜8秒のLow／Low-mid配分変化を、一貫して表示した。v1.1では50 msごとのRMS・Low・Low-mid・Onset軌跡の距離を候補順位の補助指標に加え、002の時間的な密度遷移も評価可能にした。音源分離については、Hybrid Demucsを001正本の先頭15秒に適用し、Bass／no_bassとハッシュ付きmanifestを出力できた。ただし、分離結果にはbleeding・artifactがあり、特定楽器の不存在・クリック音・Loopの自然さを単独で確定する根拠にはしない。

クラウド回帰検証は[初回実行 #33083036072](https://github.com/FieldRiseJapan/FieldRise/actions/runs/33083036072)と、時間軸再現度を含む[最新版実行 #33084264887](https://github.com/FieldRiseJapan/FieldRise/actions/runs/33084264887)の両方で成功した。

## 明日6:00までの最終検証

2026-08-28 05:45 JSTに、001・002の最終自己比較回帰テストを一度だけ実行する予定を設定した。処理内容は、最新`origin/main`の取得、001・002自己比較、JSON／CSV／図生成、JSON構文・Git差分確認、詳細報告更新、GitHub反映である。候補曲や正本の変更、外部公開、認証情報、購入処理は対象外とする。

## 次の候補音源受領時の運用

候補WAV／FLACまたはSuno共有URLが届いたら、まず`cafe_candidate_intake.py`で候補manifestを作成し、その後001または002のプロファイルを指定して測定する。001は「Bass単独性→帯域／倍音→Stereo幅→Piano→Drums／空間→Loop」、002は「Bass→伴奏の密度遷移→Piano→Drums→空間→Loop」の順で、一回に一変数だけ変更する。Fender Studio書き出しは、48 kHz／24-bit／Stereo WAVとmanifestを優先する。

## 安全上の前提

正本音源は変更・削除しない。候補の公開URL・ハッシュ・生成条件を追跡し、候補音源のバイナリは原則Git追跡しない。パスワード、二段階認証コード、課金情報を扱わない。外部公開や購入は別途承認された操作として扱う。

**分析システムCommit SHA:** `9925badb0cd288db3b6888ce29c4864825ceab10`（解析器、Stem補助、回帰テスト、スキル、研究記録、GitHub回帰設定）
**構築報告Commit SHA:** `a14d7c0e3c8e1ad3ea6d6aed78781789a1a977b6`
**候補登録機能Commit SHA:** `c4c7fdf182061eb0d72081d0beaa9c9305c233fe`
**時間軸再現度Commit SHA:** `4bec35c45d0d364daf94dceef34f71e1fdded114`
**Push先:** `origin/main`。上記コミットはプッシュ済みで、反映時のローカルHEADとリモートHEADの一致を確認した。
