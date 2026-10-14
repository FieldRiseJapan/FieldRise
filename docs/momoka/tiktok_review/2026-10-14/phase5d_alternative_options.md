# Phase 5-D 代替方式比較
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


Phase5-Cの3案を維持。新実装/移行なし。費用・権限未確認を無料で可能と断定しない。

|方式|採用に必要な保証|権限/費用/作業量|データ・inflight・rollbackリスク|
|---|---|---|---|
|A host共通アクセス|全旧版/Preview/直通/owner writerに作用し、drainを確認|Sites提供元正式権限、既契約内費用未確認。成立すれば最小変更候補|閲覧/素材取得にも影響。開始済みfetchは取消保証なし、rollbackでも外側拒否維持|
|B独立egress|旧directfetchも迂回不能、全producerに強制|正規egress制御権限/費用未確認。新proxyのみは候補から除外|既開始通信結果不明、再開と旧版有効化を別制御。Secret撤回を無断代替しない|
|C新host移行|旧host全送信経路停止/drainと新系停止起動|新host/URL/認証/DB/R2移行の作業量大、費用/権限未確認|二重稼働・安全台帳巻戻り・削除情報復活。旧host放置なら不採用|

Aの正規仕様照会を最初に実施する候補。Aが不足ならBのhost強制を確認し、どちらも成立しない場合のみCの設計承認を検討する。新hostに移れば旧host停止問題が消えるとは判断しない。提供元回答と社長の別承認なしに案を採用しない。

