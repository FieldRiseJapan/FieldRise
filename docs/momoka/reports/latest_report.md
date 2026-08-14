# 桃花｜最新正式作業報告

このファイルは、桃花（COO）による**受領・進捗・完了・停止・未完了・ブロッカー**の唯一の正本です。単独の質問・相談・判断依頼は `cto/inbox/momoka-comments.md` に分離し、本報告には混在させません。

## 最新状態

| 項目 | 内容 |
|---|---|
| 更新日時 | 2026-08-14T23:23:50Z |
| 指示ID | MOMOKA-20260815-ROUTING-REPAIR（指示書本文） |
| 関連Issue | #6【桃花指示・決定】AI Control Dashboard Web App 構築 |
| receipt_key | `8c7cdd049d8b5ee1b1a19f5247688795306a4b3f:docs/momoka/instructions/2026-08-15_momoka-instruction-routing-repair.md` |
| Claim状態 | claimed（Claim JSONと正式報告の照合を2026-08-14T23:23:10Zに確定） |
| 作業状態 | 完了：GitHub → 桃花 → Claim → 正式報告の正本経路を調査・確認し、今回の受領証跡を登録済み |
| 未完了 | Issue #6のダッシュボード実装は別の正式指示として未着手。今回の作業範囲は受領経路の調査・修正確認であり、実装の開始ではない。 |
| 次のアクション | 今後の新規正式指示は `docs/momoka/instructions/` への新規追加・`main` へのPushで自動受領対象とし、既存指示を遡及受領する場合は手動起動を用いる。 |

## 受領・進捗

本報告は、社長決定済みの「GitHub指示伝達・自動実行経路の調査／修正」を正式指示として受領した記録です。2026-08-14T23:19:12Z に指定のClaim JSONを `origin/main` へ反映しました。Claimには、受領キー、`claimed` 状態、Claim時刻、および本報告の正本パスを記録しています。対象の受領証跡は `automation/momoka-receipts/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f-c2449cec0135.json` に存在し、GitHub Actionsが同一の受領キーを `attempting` 状態で登録していることも確認しました。[1] [2]

## Issue #6を拾えなかった理由

Issue #6の正式な内容は `docs/momoka/instructions/web-dashboard-app.md` にあり、Issue自体は通信・進捗管理用として明示されています。修正前の自動受領ワークフローは監視対象、手動起動対象、差分探索対象をすべて `cto/outbox/**` に限定していました。そのため、`docs/momoka/instructions/` に置かれた正式指示書は、正本であっても自動受領候補になりませんでした。さらに、修正前の通知文とClaim照合先は `music_ai/reports/cafe/latest_report.md` を前提としており、指示・Claim・正式報告の経路が分離されていませんでした。[1] [3]

> **結論:** Issue #6を拾えなかった直接原因は、Issueの有無ではなく、正式指示書の保存先と自動受領・Claim照合の監視先が旧経路のままだったことです。

## 問題箇所と確認根拠

| 確認項目 | 修正前の問題 | 確認済みの現行状態・根拠 |
|---|---|---|
| 正式指示の取得先 | `cto/outbox/**` のみを対象としており、`docs/momoka/instructions/` を監視していなかった。 | `momoka-auto-notify.yml` は `main` へのPush時、`docs/momoka/instructions/**` を監視し、READMEと返信ファイルを除外して新規Markdownを候補化する。[3] |
| 正式報告先 | 通知・照合が `music_ai/reports/cafe/latest_report.md` を前提としていた。 | 通知文、Claimスキーマの照合、Claim Verifierのトリガーと検証先を `docs/momoka/reports/latest_report.md` に統一した。[3] [4] |
| Issueの役割 | Issueと正式指示の区別が運用上不明確で、Issueだけから着手しかねない状態だった。 | 指示書READMEは、Issueを通信・進捗管理、`docs/momoka/instructions/` を正式指示の唯一の正本と定義している。Issue #6本文も同じ分離を明記している。[2] [5] |
| Claim照合 | Claim JSONに正本レポートの一致を必須化していなかった。 | Claim Verifierは、`receipt_key`、`status=claimed`、`report_path` の一致、および正式報告本文内の受領キーを確認して受領証跡を確定する。[4] |
| 認証・権限・通知 | `MANUS_API_KEY` 未設定時は自動タスク生成が停止する設計である。 | 現在の対象受領証跡が `attempting` で作成済みであり、通知ジョブは起動済みであることを確認した。GitHub Actionsの`contents: write`権限も両ワークフローに設定されている。[3] [4] |

## 実施した修正と検証

`8c7cdd049d8b5ee1b1a19f5247688795306a4b3f` の経路修正では、自動受領対象を `cto/outbox/**` から `docs/momoka/instructions/**` へ変更し、手動起動時の検証パスと差分検知パスも同じ正本ディレクトリへ統一しました。併せて、通知で要求する正式報告先とClaim照合先を `docs/momoka/reports/latest_report.md` に変更し、Claim VerifierがClaim JSONの `report_path` と本文中の `receipt_key` を両方検証する形に修正しました。[1] [3] [4]

今回の受領では、その修正経路を実証するため、指定のClaim JSONを先行して作成・Pushしました。Claimコミットは `0253c562f730245ec8820f27d9a820020bf996f4`、正式報告コミットは `392ca7c95a38e8a277f796962d8fdd77eefd396d` です。Claim VerifierはClaim JSONと本報告の一致を照合し、2026-08-14T23:23:10Zに受領証跡を `claimed` へ確定しました。確定コミットは `08094d9e0bcd9a730f467afe6649771b35771043` です。

## 今後の自動受領・Claim・作業開始条件

| 段階 | 必須条件 | 実施内容・証跡 |
|---:|---|---|
| 1 | 社長の「決定」が正式指示書に明記されている。 | `docs/momoka/instructions/` の対象Markdownを確認する。 |
| 2 | 対象ファイルが同ディレクトリへ**新規追加**され、`main` へPushされる。 | 自動受領ワークフローが新規ファイルを検知し、`automation/momoka-receipts/` に受領証跡を作成する。 |
| 3 | 正式指示書本文を取得・確認する。 | 指示書の範囲、完了条件、関連Issue、正式報告先を確認する。Issueだけでは着手しない。 |
| 4 | Claim記録を作成できる。 | `automation/momoka-claims/` に `receipt_key`、`status=claimed`、`claimed_at`、`report_path` を含むJSONをPushする。 |
| 5 | 正式報告先を更新できる。 | `docs/momoka/reports/latest_report.md` に受領・進捗・完了・未完了・ブロッカーを記録する。 |
| 6 | Claimと報告の一致が確認できる。 | Claim VerifierがClaim JSONと正式報告の受領キーを照合し、受領証跡を確定する。 |

## Issue #6の正式指示書の認識結果

**認識済みです。** `docs/momoka/instructions/web-dashboard-app.md` を実際に取得し、社長決定済みの正式な開発指示であることを確認しました。内容は、GitHubを唯一の正本として、FieldRise AI Control Dashboardを実運用可能なWebアプリとして構築するものです。Issue #6本文はこのMarkdownを正本と指定しており、Issueは通信・進捗管理に限定されています。[5] [6]

ただし、この既存指示書は新しい正本経路の導入以前から存在していたため、現行ワークフローの「新規追加ファイルのみ」という自動検知条件では遡及的に自動受領されません。認識済みであることと、ダッシュボード実装用の個別受領・Claimが済んでいることは別です。Issue #6の実装を開始する際は、現行ワークフローの `workflow_dispatch` に当該パスを指定するか、社長決定済みの新規正式指示を正本ディレクトリへ追加して、個別の受領キー・Claim・報告を生成します。[3]

## 完了・未完了・ブロッカー

本指示の調査、正本経路の確認、Claim作成、正式報告の記録は**完了**です。GitHubへの書込みは成功しており、書込み権限によるブロッカーはありません。

残る制約は、現行の自動受領が `docs/momoka/instructions/` に**新規追加**された指示のみを対象にすることです。既存ファイルの移行、編集、または過去指示の再実行は、重複受領を防ぐため自動では開始されません。この場合は `workflow_dispatch` による対象パス指定で受領を起動します。また、Manus API用の `MANUS_API_KEY` が未設定・無効の場合は自動タスク生成が停止するため、GitHub Actions上の受領証跡を確認して手動対応へ切り替えます。[3]

## 参照

[1]: https://github.com/FieldRiseJapan/FieldRise/commit/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f "経路修正コミット"
[2]: https://github.com/FieldRiseJapan/FieldRise/blob/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f/docs/momoka/instructions/README.md "桃花向け正式指示の運用ルール"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f/.github/workflows/momoka-auto-notify.yml "桃花自動受領通知ワークフロー"
[4]: https://github.com/FieldRiseJapan/FieldRise/blob/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f/.github/workflows/momoka-claim-verifier.yml "Claim・報告照合ワークフロー"
[5]: https://github.com/FieldRiseJapan/FieldRise/issues/6 "Issue #6"
[6]: https://github.com/FieldRiseJapan/FieldRise/blob/8c7cdd049d8b5ee1b1a19f5247688795306a4b3f/docs/momoka/instructions/web-dashboard-app.md "Issue #6の正式指示書"
