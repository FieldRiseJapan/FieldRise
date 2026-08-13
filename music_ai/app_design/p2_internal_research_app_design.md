# P2｜内部研究Webアプリ設計

**目的:** 社長、彩花CTO、桃花COOが、001・002再現の同じ正本・同じブロッカー・同じ次の一変数を確認するための研究コックピットを設計する。

## 最小画面構成

| 画面 | 主な情報 | 参照する正本 | 人の操作 |
|---|---|---|---|
| Overview | 001／002のMaster状態、最新候補、未解決ブロッカー | Metrics、Registry、Report | 次のCTO指示へのリンク |
| A/B Compare | Intro、RMS、Centroid、密度、Score、Evidence | Difference JSON、Metrics、分析資料 | 採否メモの下書き |
| Evidence Board | Fact、Hypothesis、Blocked、Pattern | Fact/Hypothesis台帳、Pattern DB | Hypothesisの検証完了を承認依頼 |
| Experiment Register | Prompt版、SUNO設定、音源証跡、評価、次の一変数 | Generation Registry | 新候補の下書き登録 |
| Report Center | 最新報告、アーカイブ、CTO正式指示 | `latest_report.md`、`latest_instruction.md` | 報告確認のみ |

## データと権限の原則

アプリの表示用DBを作る場合も、GitHub上の正本をコピー元として扱い、アプリDBを唯一の正本にしません。音源のアップロード、SUNO設定の保存、Knowledge昇格、外部投稿は、社長またはCTOの明示承認を必要とします。音源の公開URL、個人情報、認証情報を画面へ表示しません。

## 実装順序

最初にGitHub正本と決定論的ツールを運用し、入力フォーマットが安定してからWebアプリ化します。アプリの初期版は読み取り専用の研究ダッシュボードとし、台帳更新・AI要約・音源解析起動は人が確認してから実行する段階的設計とします。
