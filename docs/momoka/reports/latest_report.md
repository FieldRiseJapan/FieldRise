# Project-001｜Cafe 001再現検証｜途中経過報告

**状態:** `in_progress`
**正式指示:** [`2026-08-15_project001_reproduction_verification.md`](../instructions/2026-08-15_project001_reproduction_verification.md)
**詳細作業台帳:** [`2026-08-15_project001_001_reproduction_verification_worklog.md`](2026-08-15_project001_001_reproduction_verification_worklog.md)
**作業開始時のmain SHA:** `ff80b0299ad4302e7e6fc91246c5dfc72b7ab391`（`origin/main`と一致確認済み）

> **途中結論:** 001を固定Masterとして、0〜2秒のBass導入、Bass、伴奏導入、Drums／Vocalの相対水準に関する既存Factを再確認した。001との差分を測るべき候補曲音源と、生成Prompt・SUNO設定・Negative指定の対応組がGitHub上で確認できないため、現時点では再現合否を主張せず、Phase 2以降を`blocked`として管理する。

## 完了状況

| 項目 | 状態 | 結果 |
|---|---|---|
| 正式指示書の確認 | 完了 | 001をMaster固定、Fact/Hypothesis分離、一変数検証、途中経過報告、更新前SHA確認の要件を確認した。 |
| mainの最新化 | 完了 | 書込み前に`origin/main`を取得し、ローカルHEADとの一致を確認した。 |
| 001 Master正本の確認 | 完了 | `001_reference_main.flac`、48 kHz／Stereo、222.400秒、および4ステム再構成整合を確認した。 |
| Phase 1：0〜2秒 Bass基準の固定 | 完了 | Bass stem onset 0.464秒、Bass低域比率98.73%、Bass RMS -26.85 dBFS、伴奏onset 2.299秒をFactとして固定した。加えて、001正規Mainの50ミリ秒窓再測定で、フルミックス持続信号開始0.400秒を記録した。 |
| Phase 2〜5：候補曲との再現比較 | 未着手・`blocked` | 比較対象となる候補曲、生成条件、実験IDの対応が不足している。 |

## 作成・更新ファイル

| 種別 | 保存先 | 内容 |
|---|---|---|
| 詳細作業台帳 | `docs/momoka/reports/2026-08-15_project001_001_reproduction_verification_worklog.md` | 001 MasterのFact、Hypothesis、A1/B1整合、Phase設計、ブロッカー、必要入力、Phase 1再測定を記録。 |
| Phase 1測定資産 | `music_ai/analysis/cafe/measurements/2026-08-15_cafe001_intro_0_2s_windows.csv`、`music_ai/analysis/cafe/measurements/2026-08-15_cafe001_intro_0_2s_summary.json`、`music_ai/analysis/cafe/figures/2026-08-15_cafe001_intro_0_2s.png` | 001 Masterの0〜2秒フルミックス補助測定、台帳、可視化。 |
| 最新正式報告 | `docs/momoka/reports/latest_report.md` | 本ファイル。未完了・停止状態を含む正式入口。 |
| 履歴保全 | `docs/momoka/reports/archive/2026-08-15_pre_project001_001_reproduction_verification_latest_report.md` | 更新前の正式報告を保存。 |

## 重要Factと検証上の扱い

| 001の観測値 | 状態 | 再現検証での扱い |
|---|---|---|
| Bass初回Onset 0.464秒 | FACT | 候補曲にBassが0.5秒未満で存在するかを測定する。 |
| 0〜2秒Bass低域比率 98.73% | FACT | 001型Introの低域主導の基準とする。 |
| その他／伴奏初回Onset 2.299秒 | FACT | 001型の伴奏遅延。002型0.255秒と混在させず、B1の単独変数として扱う。 |
| Intro Drums RMS -58.70 dBFS | FACT | Drumsを導入で前面化しない。 |
| Vocal全体RMS -108.55 dBFS | FACT | Lead vocalを主成分にしない。ただし分離残差の可能性を残す。 |
| 「Bassが実生成に存在しない」既知事象 | FACT（正式指示書記載） | Prompt文言の強化だけで解消したと仮定せず、候補音源ごとに実測する。 |

## 未完了・ブロッカー

| 項目 | 状態 | 影響 | 必要な対応 |
|---|---|---|---|
| 001再現候補音源 | `blocked` | Bass実在、開始時刻、ノイズ、全体再現差分を測れない。 | WAVまたはFLACを実験IDとともに登録する。 |
| 生成Prompt・SUNO設定・Negative指定 | `blocked` | 一変数検証を保証できない。 | 候補音源に完全本文・設定・Negative指定を一対一で紐付ける。 |
| 001の人による聴取レビュー | `open` | Bass質感、Pianoの音数／休符、ノイズ、Loop感は自動測定だけで確定できない。 | 指定区間のタイムコード付き聴取記録を作成する。 |

## 彩花CTOが次に確認するファイル

1. [`001再現検証 作業台帳`](2026-08-15_project001_001_reproduction_verification_worklog.md)で、001の固定Factと候補曲不足によるブロッカーを確認する。
2. 候補曲が登録される際は、同じ実験IDに音源、生成Prompt、SUNO設定、Negative指定を紐付け、Phase 2へ進める。
3. 以後のPrompt設計では、001型のBass条件を固定し、伴奏導入時刻だけを最初の変更変数とする。

**基準報告Commit SHA:** `c01456b735f7508f91029395c1272bf8f70e835e`（途中報告・作業台帳）
**Phase 1測定Commit SHA:** `33c210aa4f00a99aeac2eac5feea8e9ba1cc4abe`（0〜2秒測定資産・可視化・再現用スクリプト）
**Push先:** `origin/main`。各コミットはプッシュ済みで、測定反映時点のローカルHEADとリモートHEADの一致を確認した。
