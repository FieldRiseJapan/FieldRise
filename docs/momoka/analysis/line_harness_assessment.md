# LINE Harness 調査メモ

## 概要

LINE Harnessは、LINE公式アカウント向けのオープンソースCRMおよびマーケティング自動化プラットフォームである。単なるテスト用ユーティリティではなく、Webhook受信、友だち管理、個別チャット、ステップ配信、一斉配信、リッチメニュー、フォーム、条件分岐オートメーションなどを含む運用基盤として提供される。

公開リポジトリの説明によれば、TypeScript、Cloudflare Workers、Cloudflare D1、Next.jsを中心とする構成であり、Messaging APIチャネルとLINE公式アカウントが必要になる。導入にはCloudflareアカウント、Node.js 22以降、pnpmが必要とされる。

## Issue #18との関係

LINE HarnessはWebhookに届く友だち追加・メッセージイベントからユーザーをCRMへ登録できるため、将来的には社長のLINEユーザーIDを適切な受信イベント経由で保持・利用する運用基盤になり得る。

ただし、現行Issue #18の目的である単一の `LINE_TARGET_ID` をGitHub Actions Secretに設定して本番到達テストを行うことについて、LINE Harnessは最短経路ではない。導入には新たなCloudflare基盤、Webhook URL、データベース、LINE credentials、管理画面を追加で構成する必要があるため、既存のGitHub Actions通信経路を切り替える場合は社長の明示的な決定が必要である。

## 費用・運用上の位置付け

ソフトウェアはMITライセンスで公開され、Cloudflare無料枠で動作可能と説明されている。ただし、LINE公式アカウントの月間メッセージ上限・契約プランは別に適用される。OSSであることは、LINE Messaging APIの送信枠や外部サービスの利用条件を置き換えるものではない。

## FieldRise現状との比較

FieldRiseリポジトリには `LINE Harness` または `line-harness` の既存設定・実装は確認できなかった。現行構成は、GitHub Actionsワークフローと `LINE_CHANNEL_ACCESS_TOKEN` / `LINE_TARGET_ID` を参照する単発通知実装である。

## 推奨する判断順序

1. Issue #18は現行の固定経路を維持し、正しい `LINE_TARGET_ID` のSecret登録と送信前検証を完了する。
2. LINE Harness導入は、CRM・ステップ配信・Webhook受信・複数運用などを必要とする別プロジェクトとして評価する。
3. 現行通信経路をLINE Harnessへ移行する場合は、社長の「決定」後に設計・導入・検証を実施する。

## 参照

- [LINE Harness OSS Repository](https://github.com/Shudesu/line-harness-oss)
- [話題の LINE Harness を試してみた](https://note.com/dmywk/n/n687b6f5672f5)
- [LINE Messaging API pricing](https://developers.line.biz/en/docs/messaging-api/pricing/)
