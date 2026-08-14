# FieldRise AI Control Dashboard

社長向けの**AI・音楽R&D管制画面**です。`dashboard/sonata-desk/` を置換せず、同アプリの表示・比較・参照層と並存します。本アプリは、経営判断に必要な要点を短時間で確認できるよう、001/002の検証状況、評価項目、桃花の最新通信、現在の問題、次アクション、およびGitHub同期状態を集約表示します。

## 正本と同期方式

ブラウザはGitHubの `main` ブランチを唯一の正本として、以下のファイルを**60秒ごと**に直接読み取ります。再同期ボタンを使用すると即時に取得を再試行します。アプリはGitHubのデータを保存・変更せず、取得に失敗した場合はエラー、最終同期時刻、および既に取得済みの値を明示します。正本に存在しない総合再現度・前回差分は、推測で補完せず「未登録」と表示します。

| 表示内容 | GitHub正本 |
|---|---|
| 001/002、A1、G01〜G09 | `dashboard/sonata-desk/src/generated/dashboard-data.json` |
| 桃花の最新通信 | `cto/inbox/momoka-comments.md` |
| 最新正式報告 | `docs/momoka/reports/latest_report.md` |
| 最新コミットと同期状態 | GitHub Contents/Commits API |

> 本アプリがWeb上の表示に失敗しても、GitHub正本のデータは変更・削除されません。

## 起動と確認

```bash
cd dashboard/ai-control-dashboard
pnpm install
pnpm dev
```

本番ビルドは `pnpm build` で確認できます。GitHub Pagesなどの静的ホスティングへ `dist/` を配信すれば、サーバー側の秘密情報なしで更新検知を継続できます。GitHub APIは未認証のため、頻繁な手動再同期にはGitHubの公開APIレート制限が適用されます。

## 運用上の注意

1. 再現度の総合点・前回差分を表示するには、正本へ履歴を伴う正式な数値を追加してください。
2. G01〜G09の意味は本アプリで定義せず、`dashboard-data.json` の正本ラベルをそのまま表示します。
3. Sonata Deskに表示値の変更が必要な場合は、従来どおり正本を先に更新します。本アプリは正本の更新後、次回同期で反映します。
