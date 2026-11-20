# Muse → GitHub 自動保存ブリッジ：検証仕様

状態：検証中（本番未導入）。2026-11-20。対象：MARKETのみ。

## 前提
Museは従来どおり調査する。GitHub ActionsがMuseの実行履歴・成果物を直接取得できることは未確認である。受け渡し経路の成立なしに「完全自動保存」と宣言しない。

## 受け渡し契約
Museの調査成果物を UTF-8 Markdown として受け取る。別途 JSON メタデータは次のキーを必須とする。
- report_id: 一意の報告ID（英数字、ハイフン、アンダースコア）
- stream: MARKET（固定）
- cadence: weekly または monthly
- period: weekly は YYYY-MM-DD、monthly は YYYY-MM
- content_sha256: MarkdownのSHA-256（小文字64桁）
- source: muse（固定）
受信側はメタデータ、ハッシュ、パス、本文のREPORT_IDと対象期間を検証する。weekly 保存先は docs/muse/research/weekly/YYYY-MM-DD_tiktok_jazz_weekly.md、monthly は docs/muse/research/monthly/YYYY-MM_tiktok_jazz_monthly.md とする。既存ファイルがある場合は無条件上書きしない。

## 受け渡し候補の判定
1. Museが外部HTTPSエンドポイントへ認証付きPOSTできるか：未確認。
2. Museが承認不要でGitHub Actionsのworkflow_dispatch/repository_dispatchを呼べるか：未確認。
3. Museの成果物を別の接続済みストレージからActionsが取得できるか：未確認。
上記のいずれも未成立。認証情報をMuseの会話・公開リポジトリへ貼らない。受信先の構築や資格情報発行は別途承認を要する。

## 検証段階
- 第1段階：テストデータでローカル検証器の正常系・異常系を実証する。
- 第2段階：Museから承認不要で送信できる合法・安全な経路の有無を実測する。
- 第3段階：受信機構を最小権限で実装し、非公開テストリポジトリで保存と読み戻しを実証する。
- 第4段階：CTO評価、社長承認後に本番へ移行する。

## 禁止
本番のmainへの自動書き込み、有料API、PAT/秘密鍵の公開、既存ジョブの変更、MARKETとFIELD TESTの混在。
