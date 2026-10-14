# OpenAI Supportへの照会文（日本語）
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


以下の本文だけが送信候補です。社長承認前に送信しないでください。

---
件名：ChatGPT Sites — 全Version停止・実行中処理静止と安全なDB移行の正式仕様確認

OpenAI Support ご担当者様

ChatGPT Sitesで公開Webアプリを運用しています。既存データを保護したDB移行を計画するため、Sites固有の保証と正式手順を確認したく、技術担当への案内をお願いします。現在変更・外部送信を停止しており、この問い合わせは操作依頼ではありません。

最優先は、旧コードが新しいアプリ内停止設定を認識しなくても、全経路をホスト側で停止できるかです。各項目について「対応可否、対象範囲、例外、必要権限/プラン、反映完了の証拠、公式資料」をお教えください。

**B04：停止・静止・切替**
1. 公開Version、保存済み旧Version、Preview、旧Deployment、Worker直通URLを共通に拒否する正規保守機能はありますか。認証済み利用者/管理者や内部経路の例外は残りますか。旧版の実行可能経路を確認する手段はありますか。
2. 新規HTTP受付を止めた後、実行中Worker・外部fetch・Queue/Scheduledを含む全writerはどう扱われますか。静止完了を確認する正式API/状態表示、反映遅延や最大待機条件はありますか。結果不明の外部通信を取消済みと扱わないための指針もお願いします。
3. 停止はDB Migration、新Version公開、失敗時の旧版自動復帰、rollback後も維持できますか。旧版の再有効化を禁止/制御できますか。

**Migration・復旧**
4. 公開DBの適用履歴/checksum/Drizzle journalを正規に確認する方法と、SQL適用/Worker uploadの順序・transaction単位は何ですか。途中失敗/failed deploy後のDB状態の判定と安全な再実行/roll-forward手順を教えてください。
5. Sitesで利用できるbackup、保持期間、復元権限・停止要件を教えてください。復元で消費済み承認や削除済み情報が巻き戻る場合の整合性確認・対策はありますか。

**Scheduler・監視**
6. Worker scheduled handler/Cron相当の正式導入経路はありますか。ChatGPT cloud taskとの関係、停止/再開、同時実行、時間/回数制限、現契約内で追加課金なしに運用可能か、失敗通知/heartbeat/ログ保持を教えてください。

未対応・保証対象外の項目も明記し、必要なら代替の正規運用方法をご案内ください。個別サイト識別子が必要な場合は、必要性と安全な提供経路をご説明ください。Token、Secret、Cookie、実利用者データ、DB内容は提供しません。
よろしくお願いいたします。
---

