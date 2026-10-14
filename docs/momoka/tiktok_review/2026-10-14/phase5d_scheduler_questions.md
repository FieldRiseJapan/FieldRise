# Phase 5-D Scheduler・監視詳細質問
確認日：2026-10-14（21:29〜21:32 JST）。基準Commit：710233fe80899374a210e47c34ecf9623d67f662。
状態：DRAFT / NOT SENT。PROVIDER ANSWER NOT RECEIVED。公開適用BLOCKED。


既存cleanup runnerは隔離試験記録のみ。公開Cronを作らず、以下を主照会Q6の補足とする。

|ID|質問|回答評価条件|
|---|---|---|
|C01|scheduled handler/Cronの正規導入経路は|manifest/管理UI/API、権限、supported runtime|
|C02|ChatGPT cloud taskとの関係は|build更新とWorker定期実行を分離|
|C03|停止・再開と反映確認は|実行中/滞留/retryを含む|
|C04|重複実行/Queue再実行の契約は|アプリlockとの責任境界|
|C05|実行時間/CPU/DB呼出/起動回数制限は|当Siteプラン、失敗時挙動|
|C06|追加課金なしの適用可否は|変更可能なbeta制限と費用を明示|
|C07|失敗通知/heartbeatを正規に取得できるか|通知先権限、遅延・到達失敗検知|
|C08|ログの保持/閲覧/非機密化設定は|URL query/body/header等の遮断と期限|
|C09|migration/maintenance時の全producer停止は|旧Versionを含む共通制御|

監視の保存query_countが返却件数より1少ない既知問題は内部評価保留。上限管理と監査の正確性を混同しない。照会で内部実装詳細を開示せず、公開監査利用前の限定補修承認を別途整理する。Scheduler回答があってもコード接続・公開試験・監視採用は別承認。

