# FieldRise AI Control Dashboard 実装報告

| 項目 | 内容 |
|---|---|
| 受領時刻 | 2026-08-14T23:33:22Z |
| Receipt key | `a95a0cf8d6b460931ba40bf392ffa26a8f1d133f:docs/momoka/instructions/web-dashboard-app.md` |
| 正式指示 | `docs/momoka/instructions/web-dashboard-app.md` |
| Claim | `automation/momoka-claims/a95a0cf8d6b460931ba40bf392ffa26a8f1d133f-90dc38e4927f.json` |
| Claim反映コミット | `01948e39f235f573976b75bb45cd46bca1df37f6` |
| 作業状態 | **実装・ビルド検証完了** |

## 受領

本件は上記Receipt keyで正式に受領し、Claim JSONへ `receipt_key`、`status: claimed`、`claimed_at`、`report_path` を記録しました。Claimは `origin/main` へのプッシュに成功しており、GitHubへの書込み権限によるブロッカーはありません。[1]

## 完了内容

社長向けの新規Webアプリを `dashboard/ai-control-dashboard/` に実装しました。これは既存の `dashboard/sonata-desk/` を削除・置換せず、Sonata Deskの「表示・比較・参照層」と並存する**経営判断用の管制画面**です。Sonata Deskの正本参照方針を踏襲し、アプリ自身はGitHubのデータを保存・更新しません。[2]

画面は完全ダークUI、Signal Blueを状態・同期・現在位置に限定使用するControl-Room Ledger方針で構成しました。デスクトップのSignal rail、GitHub同期状態、最新コミット、001/002の正本・検証済み情報、A1のG01〜G09評価項目、桃花の最新通信、現在の問題、次アクション、最新正式報告を一画面に集約しています。G01〜G09の意味はアプリ側で推測・再定義せず、正本のラベルと根拠を表示します。[3]

| 機能 | 実装内容 | 正本 |
|---|---|---|
| 001/002の現在値 | 正本性、BPM、Bass onset、Intro Bass、要約を表示 | `dashboard/sonata-desk/src/generated/dashboard-data.json` |
| 検証点数 | G01〜G09の計測済み・確認待ちを集計し、進捗ゲージで表示 | 同上 |
| 項目別根拠 | Bass、Piano、BPM、構成、不要ノイズ、Loop感などの根拠を表示 | 同上 |
| 桃花の最新通信 | 日時、種別、関連タスク、コメント、ステータス、次アクションを表示 | `cto/inbox/momoka-comments.md` |
| 現在の問題・次アクション | レビューキューとDecision Briefを表示 | `dashboard-data.json` |
| GitHub同期 | GitHub Raw/APIを60秒ごとに再取得し、再同期ボタン、最終同期時刻、エラー状態を表示 | `main` ブランチ |

> GitHub取得に失敗した場合、画面は明確なエラーと最終同期時刻を表示し、既に取得済みの値を保持します。取得不能な値を推測して表示せず、アプリから正本へ書込みもしません。

## 自動更新の仕組み

ブラウザは公開GitHubの `main` ブランチから、検証データ、桃花通信、最新正式報告、および最新コミットを直接取得します。初回取得後は60秒間隔で再照合し、手動の「再同期」操作でも即時取得を行います。GitHub正本が更新されれば、再デプロイを待たず次の照合時に表示へ反映されます。取得失敗時の状態・時刻を常時表示することで、同期遅延を隠しません。

アクセス先は `dashboard/ai-control-dashboard/` です。ローカルまたはCIで `pnpm install && pnpm dev` により起動し、静的ホスティングでは `pnpm build` で生成する `dist/` を配信します。実装・同期仕様・正本パスは同ディレクトリのREADMEへ記録しました。[4]

## 動作確認

`dashboard/ai-control-dashboard` で `pnpm build` を実行し、TypeScript型検査とVite本番ビルドが成功しました。ビルド生成物は `dist/index.html`、`dist/assets/` に出力され、外部画像URLやバックエンド依存を含みません。ブラウザ表示ではGitHub正本の実データを取得し、検証点 `7/9`、001/002の正本情報、桃花通信、レビューキュー、および最新コミットを確認しました。

## 未完了・残課題

**総合再現度スコアおよび前回差分は未登録**です。現行のGitHub正本には、これらを算出できる正式な数値履歴が存在しないため、画面では「未登録」と表示しています。これは推測値を表示しないという正式指示に従うものです。将来、総合点・対象時刻・前回値を含む正本データが追加されれば、画面は次回同期から表示できます。[3]

公開URLへのデプロイは実施していません。理由は、静的ホスティング先および公開権限が本指示で指定されておらず、未承認の公開操作を避けるためです。GitHubへのコード・報告の書込みは完了しており、この点は実装ブロッカーではありません。未認証のGitHub API利用には公開APIのレート制限があるため、非常に頻繁な手動再同期を行う運用では、将来の認証付きプロキシまたはGitHub Actionsによる配信確認を検討してください。

## ブロッカー

**なし。** Claim、アプリ実装、ビルド検証、正本レポートの作成、および `origin/main` への反映を実施しました。

## 参照

[1]: https://github.com/FieldRiseJapan/FieldRise/commit/01948e39f235f573976b75bb45cd46bca1df37f6 "Claim反映コミット"
[2]: https://github.com/FieldRiseJapan/FieldRise/blob/main/dashboard/sonata-desk/README.md "Sonata Deskの正本参照・共存方針"
[3]: https://github.com/FieldRiseJapan/FieldRise/blob/a95a0cf8d6b460931ba40bf392ffa26a8f1d133f/docs/momoka/instructions/web-dashboard-app.md "正式指示書"
[4]: https://github.com/FieldRiseJapan/FieldRise/tree/main/dashboard/ai-control-dashboard "AI Control Dashboard 実装先"
