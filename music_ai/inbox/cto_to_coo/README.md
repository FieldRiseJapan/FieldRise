# CTO→COO 正式指示受信フォルダ

このフォルダは、彩花（CTO）から桃花（COO）へ発行するCafeシリーズ関連の最新正式指示を管理する固定入口です。指示の受信先を一つに固定することで、会話中の参考情報と、実行すべき正式指示を混同しません。

| ファイル | 役割 | 確認者 |
|---|---|---|
| [`latest_instruction.md`](latest_instruction.md) | 現在有効なCTO正式指示の唯一の正本。桃花は作業開始前に必ず最初に確認する | 桃花（COO） |
| [`archive/`](archive/) | 過去の正式指示。現在の実行判断には使わない | 彩花（CTO）・桃花（COO） |
| [`../../reports/cafe/latest_report.md`](../../reports/cafe/latest_report.md) | 桃花の最新報告。彩花CTOは完了・途中・停止・未完了をここから確認する | 彩花（CTO）・社長 |

> **運用原則:** `latest_instruction.md` は「何をするか」の唯一の固定入口、`latest_report.md` は「何を完了したか・途中か・停止中か」の唯一の固定入口です。分析の根拠は `music_ai/analysis/cafe/` に保存します。

## 完全な正式往復ルート

Cafeシリーズの長時間タスクは、次の往復ルートを通る時だけ正式に実行します。社長からの依頼は重要な起点ですが、実施範囲を安全に固定するため、彩花CTOが `latest_instruction.md` へ指示ID・制約・完了条件を記録して初めて桃花の正式タスクになります。桃花は開始・途中・停止・完了の全状態を `latest_report.md` へ返し、彩花CTOがそこで成果とブロッカーを確認します。

| 順序 | 固定ファイル | 担当 | 役割 |
|---|---|---|---|
| 1 | `music_ai/inbox/cto_to_coo/latest_instruction.md` | 彩花（CTO） | 社長の依頼を、実行可能な正式指示へ構造化する |
| 2 | 同ファイルを最初に確認 | 桃花（COO） | 指示ID・範囲・制約・完了条件を確認して実行する |
| 3 | `music_ai/analysis/cafe/` | 桃花（COO） | 実測・比較・Fact/Hypothesis等の分析根拠を保存する |
| 4 | `music_ai/reports/cafe/latest_report.md` | 桃花（COO） | 結論、保存先、コミットID、Push結果、次の判断を正式に返信する |
| 5 | 同ファイルを確認 | 彩花（CTO）・社長 | 結果を受けて、次の正式指示を発行する |

> **長時間タスクの条件:** Issue、会話、メールは参考情報として保管できますが、`latest_instruction.md` に記録されるまで桃花は長時間タスクを正式な彩花指示として着手しません。本運用の変更は社長承認を必要とします。
