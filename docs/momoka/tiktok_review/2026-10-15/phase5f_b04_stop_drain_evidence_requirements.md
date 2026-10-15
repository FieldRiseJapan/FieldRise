# Phase 5-F 無害化証拠要件
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


|ID|別々に確定する事実|必要な証拠|現在|
|---|---|---|---|
|E01|新規実行受付停止|全経路一覧＋正規host拒否範囲/反映完了、認可owner例外も含む|NOT VERIFIED|
|E02|新規TikTok送信拒否|全Token系列/全外向き経路を覆うhost/連携先の正式保証|NOT VERIFIED|
|E03|実行中完了/安全終了|全producer/DB writerの列挙・drain/終了状態と欠落範囲|NOT VERIFIED|
|E04|外部通信不明を保持|UNKNOWN/消費済み承認の非破壊完全比較と不明扱い方針|設計のみ、実DB未確認|
|E05|旧資格再利用不能|access/refresh/cached/rotated系列の失効範囲・反映・残存権限|NOT VERIFIED|
|E06|旧版再有効化防止|rollback/deploy/CI/admin権限制御、停止の版非依存性|NOT VERIFIED|
|E07|保存data保全|正規export/backup＋復旧権限＋field/size/hash照合|NOT VERIFIED|
|E08|rollback後停止維持|code/DB戻しでもhalt/消費/削除請求を巻戻さない手順と証拠|MODEL記録のみ|

E02単独でB04全項目PASSにはしない。host全停止/外部拒否/DB静止は異なる保証。各証拠は公式仕様→対象Site適用条件→別承認の非破壊実測の順に分類。AI回答や隔離139PASSは実ホスト保証でない。
Workers HTTPは接続中一律wall期限なし。abort/timeoutは既外部受理取消を意味しない。一定待機・CPU上限・ログ0件・公開URL403/404・UI無効・DNS変更をE03へ転用しない。
承認後の検証案は非送信/非破壊から開始し、外部拒否の確認にTikTok実送信やstatus APIが必要なら先に停止して別承認。認証Tokenを取得して試す運用を今回提案実行しない。
参照：Phase5-C/5-E drain matrix、https://developers.cloudflare.com/workers/platform/limits/ （2026-10-15本文）。CF一般のwall仕様はSites契約へ自動転用しない。

