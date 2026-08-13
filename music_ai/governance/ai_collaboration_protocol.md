# FieldRise AI協働通信規約

**承認者:** 社長／彩花（CTO）
**目的:** 001・002再現精度の向上からCafeシリーズの継続投稿まで、AI間の指示・報告・根拠資料を一つの往復経路で追跡可能にする。
**変更権限:** 本規約、正本の保存先、必須項目を変更する場合は、必ず社長の承認を得る。

## 正本の往復ルート

| 通信 | 唯一の正本 | 役割 |
|---|---|---|
| 彩花CTO → 桃花COO | `music_ai/inbox/cto_to_coo/latest_instruction.md` | 最新の正式指示。桃花は作業開始前に必ず確認する |
| 桃花COO → 彩花CTO | `music_ai/reports/cafe/latest_report.md` | 最新の正式報告。彩花CTOは最初に必ず確認する |

過去の指示は `music_ai/inbox/cto_to_coo/archive/`、過去の詳細報告は `music_ai/reports/cafe/archive/` に保存する。詳細分析、音源、実験仕様は各フォルダへ保存するが、必ず `latest_report.md` から相対リンクで辿れるようにする。

## `latest_instruction.md` の必須項目

1. 更新日時
2. 対象Project
3. タスクID
4. 目的
5. 実行内容
6. 優先順位
7. 完了条件
8. 関連ファイル

## `latest_report.md` の必須項目

1. 完了状況
2. 作成・更新ファイル
3. Commit SHA
4. Push先
5. 未完了・ブロッカー
6. 彩花CTOが次に確認するファイル

桃花は、完了・途中・停止・未完了のいずれであっても `latest_report.md` を更新する。「未完了だから報告しない」は禁止する。

## Issueの位置付け

GitHub Issueは、長期タスク管理、議論、作業履歴、トラブル管理に使用する。正式な指示書・報告書の正本にはしない。
