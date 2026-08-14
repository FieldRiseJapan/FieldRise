# 桃花への正式指示書｜GitHub指示伝達・自動実行経路の調査／修正

## 決定状態

**社長決定済み。** 本書は、桃花が実施する正式な調査・修正指示です。

**指示ID:** `MOMOKA-20260815-ROUTING-REPAIR`

**優先度:** 最優先

| 項目 | 内容 |
|---|---|
| 関連Issue | [#6【桃花指示・決定】AI Control Dashboard Web App 構築](https://github.com/FieldRiseJapan/FieldRise/issues/6) |
| 正式報告先 | `docs/momoka/reports/latest_report.md` |
| 単独コメント・相談先 | `cto/inbox/momoka-comments.md` |

## 目的

GitHubに登録された正式指示が桃花に届かず、着手されない原因を特定し、**GitHub → 桃花 → 作業 → 正式報告**の経路を正常化します。

## 必ず確認する対象

1. 桃花が監視・取得する正式指示書のディレクトリ、GitHub Issue、関連する自動処理を確認すること。
2. `docs/momoka/instructions/` が正式指示書の正本として認識されることを確認すること。
3. GitHub Issueの役割が通信・進捗管理であり、正式指示の正本と混在していないことを確認すること。
4. 社長の「決定」を含む正式指示書が、受領・Claim・作業開始のトリガーになることを確認すること。
5. `docs/momoka/reports/latest_report.md` と `cto/inbox/momoka-comments.md` の役割が分離されていることを確認すること。
6. GitHub Actions、認証、権限、通知、Claim照合、エラー記録の状態を確認すること。

## Issue #6の必須確認

Issue #6が参照する正式指示書 `docs/momoka/instructions/web-dashboard-app.md` を実際に取得し、**正式指示として認識したか**を明示してください。認識できていなかった場合は、監視対象・トリガー・設定・権限・通知のどこで遮断されたかを根拠とともに記載してください。

## 修正後の必須フロー

1. 社長が「決定」する。
2. 正式指示書が `docs/momoka/instructions/` に保存され、`main` へPushされる。
3. 桃花向けの自動受領処理が新規指示書を検知する。
4. 桃花が指示書を取得し、Claimを登録する。
5. 桃花が作業を開始し、受領・進捗・完了・停止・ブロッカーを `docs/momoka/reports/latest_report.md` に記録する。
6. 単独コメント・相談・判断依頼は `cto/inbox/momoka-comments.md` に分離する。
7. GitHub上のClaimと正式報告を照合し、証跡として確定する。

## 重要ルール

- 社長の「決定」前に実行を開始しないこと。
- Issueや単独コメントだけを根拠に、正式指示と判断しないこと。
- 指示と正式報告と単独コメントを混在させないこと。
- 推測で「実行済み」「受領済み」と判断せず、GitHub上の証跡で確認すること。
- 既存資産・既存指示を勝手に削除または置換しないこと。

## 完了条件

桃花は `docs/momoka/reports/latest_report.md` に、次のすべてを記録してください。

1. Issue #6を拾えなかった理由。
2. 問題箇所と確認した根拠。
3. 実施した修正。
4. 今後、どの条件で自動受領・Claim・作業開始するか。
5. Issue #6の正式指示書を実際に認識したか。
6. 今後の処理に残るブロッカーまたは制約（ある場合）。
