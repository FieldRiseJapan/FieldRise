# Sonata Desk｜候補曲分析データ自動反映 修正報告

**正式報告区分:** 桃花（COO）の実作業  
**対象:** `dashboard/sonata-desk` およびGitHub Actionsの正本データ同期  
**報告日:** 2026-08-16（GMT+9）

## 結論

昨日追加されたCafe 001対Suno候補曲の比較分析（CAND-004／005、006／007、008／009A）は、修正前のSonata Deskへ**自動反映されていなかった**。原因は、表示用JSONの生成入力とGitHub Actionsの起動対象が、旧来の001・002正本・A1・Pattern DBだけに限定されていたためである。

今回、候補曲比較の測定JSONを自動検出して表示用JSONへ取り込み、測定JSON更新時に同期ワークフローが起動するよう修正した。既存の正本・分析ファイルは変更していない。画面には、Cafe 001の正本値と各候補の長さ、全体RMS、0〜2秒のRMS・低域比率・持続full-mix信号開始を並べる読み取り専用の「候補曲比較」セクションを追加した。

## 調査結果

| 確認項目 | 修正前の状態 | 判定 |
|---|---|---|
| 公開Sonata Desk | 001・002、A1、B1、Pattern DB、参照音源のみを表示 | 昨日の候補曲比較は未表示 |
| `dashboard-data.json`の入力 | 001・002正本、A1、Pattern DB、音源台帳、2026-08-14のexpert reviewに限定 | 候補曲測定JSONが対象外 |
| 自動同期の起動条件 | A1・Pattern DB・001／002正本等の指定パスに限定 | `2026-08-15_project001_001_vs_suno*.json`が対象外 |
| 直近の同期実行 | 昨日の候補分析コミット後にSonata Desk同期実行なし | 自動反映不成立 |

## 修正内容

| 対象 | 修正 | 効果 |
|---|---|---|
| `generate_dashboard_data.py` | `music_ai/analysis/cafe/measurements/*_project001_001_vs_suno*.json`を自動検出し、比較データを`candidateComparisons`として生成 | 新規候補の同形式JSONを追加すると、全件が表示用JSONへ入る |
| `sonata-desk-sync.yml` | 候補曲測定JSONを`push`トリガーへ追加 | 分析JSON更新時に同期処理が自動起動する |
| `Home.tsx` | 動的JSONから候補曲比較セクションを表示 | 公開画面で001正本とCAND-004〜009Aを比較できる |
| GitHub Pagesアセット | 現行の公開ディレクトリ`sonata-desk/`を再ビルド | UI変更を公開サイトへ反映できる |
| `SYNC.md` | 新しい同期対象・自動検出仕様を追記 | 運用時の監査可能性を確保 |

## 同期後に表示する候補曲データ

| 比較セット | 表示対象 |
|---|---|
| Cafe 001 vs CAND-004／005 | 正本001と候補004・005の測定値 |
| Cafe 001 vs CAND-006／007 | 正本001と候補006・007の測定値 |
| Cafe 001 vs CAND-008／009A | 正本001と候補008・009Aの測定値 |

> **解釈上の注意:** 候補曲はMP3、正本001はFLACであるため、絶対値にはコーデック差の影響があり得る。画面では比較根拠として表示するが、楽器の存在、音色、Key、ノイズ、Loopの自然さは、引き続き人の聴取・DAW確認で確定する。

## 検証結果

| 検証 | 結果 |
|---|---|
| 生成スクリプト実行 | 成功。`dashboard-data.json`と`sync-status.json`を更新 |
| 生成された比較セット | 3セット、候補6曲（004／005／006／007／008／009A）を確認 |
| 新しいsource digest | `1a14ca8997bbc26206c55893d8c9f32b1fe958df177678b92c9efcf855e0f674` |
| TypeScript型検証 | 成功 |
| 本番ビルド | 成功。公開用アセットを再生成 |
| 正本の改変 | なし。測定JSON・音源・既存分析は読み取り専用のまま |

## 今後の運用

今後は、`music_ai/analysis/cafe/measurements/`へ`*_project001_001_vs_suno*.json`形式の候補曲比較結果が`main`に追加・更新されると、GitHub Actionsが表示用JSONを生成する。公開画面はGitHub上の最新表示JSONを読み込むため、候補曲比較の内容は手動転記なしで更新される。

本修正はCafe 001を基準にしたProject-001候補曲比較のスキーマに限定している。他シリーズまたは異なる比較構造を追加する場合は、正本形式を混在させず、対応する明示的な入力スキーマと表示設計を別途追加する。

## 保存先

| 種別 | パス |
|---|---|
| 詳細報告 | `music_ai/reports/cafe/2026-08-16_sonata_desk_candidate_sync_repair.md` |
| 正式入口 | `music_ai/reports/cafe/latest_report.md` |
| 更新前の入口 | `music_ai/reports/cafe/archive/2026-08-16_pre_sonata_desk_candidate_sync_repair_latest_report.md` |

## 参照

[1]: ../../analysis/cafe/measurements/2026-08-15_project001_001_vs_suno004_005.json "Cafe 001対候補004／005 測定データ"
[2]: ../../analysis/cafe/measurements/2026-08-15_project001_001_vs_suno006_007.json "Cafe 001対候補006／007 測定データ"
[3]: ../../analysis/cafe/measurements/2026-08-15_project001_001_vs_suno008_009a.json "Cafe 001対候補008／009A 測定データ"
[4]: ../../../dashboard/sonata-desk/SYNC.md "Sonata Desk 同期仕様"
