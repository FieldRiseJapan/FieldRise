# CTO→COO 正式指示受信フォルダ

このフォルダは、彩花（CTO）から桃花（COO）へ発行するCafeシリーズ関連の最新正式指示を管理する固定入口です。指示の受信先を一つに固定することで、会話中の参考情報と、実行すべき正式指示を混同しません。

| ファイル | 役割 | 確認者 |
|---|---|---|
| [`latest_cto_task.md`](latest_cto_task.md) | 現在有効なCTO正式指示。桃花は作業開始前に必ず最初に確認する | 桃花（COO） |
| [`../../reports/cafe/latest_report.md`](../../reports/cafe/latest_report.md) | 桃花の最新完了報告。彩花CTOは指示実行結果をここから確認する | 彩花（CTO）・社長 |

> **運用原則:** `latest_cto_task.md` は「何をするか」の固定入口、`latest_report.md` は「何を完了したか」の固定入口です。分析の根拠は `music_ai/analysis/cafe/` に保存します。
