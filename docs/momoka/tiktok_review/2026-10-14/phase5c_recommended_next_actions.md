# Phase 5-C 次工程・代替比較

確認日時2026-10-14 12:26 JST。H1〜H7、基準sourceと公式一般資料。代替方式の実装・設定変更なし。

|案|全旧版停止の条件|権限/費用/影響|inflight・rollback評価|結論|
|---|---|---|---|---|
|A ホスト共通アクセス制御|全origin/version/preview/例外を同じ拒否境界に置き、認可owner writerも停止|ownerはcustom/publicを選択可能。保守拒否の正式権限/無料条件は未確認。素材閲覧にも影響|既開始処理を取り消さない。別drain証拠とrollback時共通停止が必須|正規仕様回答を最初に求める候補。まだ採用不可|
|B 送信出口強制停止|旧directfetchにも適用するhost egress deny、全producer・既tokenを含む境界|Sitesに正規egress制御があるか未確認。新proxyだけなら旧版が迂回可能で不採用。Secret撤回/権限変更は今回対象外|開始済み外部受理を戻せない。出口再開と旧rollbackを独立制御する必要|旧版迂回不能の証拠がある場合だけ候補。現状未採用|
|C 新ホスト移行|旧host全URL無効化とdrain、旧producer停止、新hostを停止状態で起動|DB/R2/認証/URL所有権/OAuth redirect/データ移行に影響。無料実現・必要権限不明、新課金不可|旧hostを残すだけでは安全にならない。二重系統/戻し時の承認消費整合が必要|A/Bの正規能力で解決できない場合の設計候補のみ|

## 推奨する最短工程

1. 彩花CTOへ本8資料を提示。正規Sites提供元/管理者に、下記の仕様回答を求める。今回外部連絡はしていない。
2. 正式回答でAまたはBの全経路停止・drainが証明できるなら、公開変更を伴わない手順審査を行う。
3. 正規Migration履歴/backup/scheduler管理情報を確認する。SQL/DB接続が必要な時だけ、対象・非出力検証・権限・目的を具体化して社長の別承認を求める。
4. query_count保留は公開監査利用前に限定補修承認を検討。既139件を作り直さず該当回帰のみ追加。
5. 全ゲート解消後、停止操作・Migration・deploy・Cron・文面更新の個別承認を取得する。実送信/状態確認/審査提出は別承認。

## 正式仕様確認の質問案（送信していない）

- public/custom accessは旧version/preview/worker直通/管理例外へも効くか。全writerを拒否する保守modeと反映完了証拠はあるか。
- 新規受付停止後、inflight/外部fetch/queue/scheduleを列挙・静止する正式API/手順はあるか。
- migrationの適用履歴・checksum・transaction単位とfailed deploy後の部分状態を、公開DBへSQLせず確認できるか。
- D1backend/プラン/backup期限・ownerの復旧権限、削除済み情報/安全台帳を守る復旧経路は何か。
- Worker scheduled handlerの正規導入・pause/drain・無料budget・通知/ログ保持は何か。cloud task scheduleとの関係は何か。

社長のWindows操作は現時点不要。仕様回答が得られない間はBLOCKEDを維持し、無断のhost移行やSecret取消・旧URL変更を進めない。
