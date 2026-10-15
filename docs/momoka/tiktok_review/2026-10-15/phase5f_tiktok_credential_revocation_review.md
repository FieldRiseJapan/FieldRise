# Phase 5-F TikTok資格失効
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


## 確認できた公式仕様
2026-10-15取得：https://developers.tiktok.com/docs/en/oauth-user-access-token-management
OAuth v2にrevokeとrefreshの正式経路がある。revokeはPOST /v2/oauth/revoke/、form形式、client_key/client_secret/access tokenが必要。成功応答は空の構造。資格はserver側で管理する。
初期accessは24h、refreshは365日という仕様だが、refreshで新資格を得られ、refresh tokenも変化し得る。時間経過だけで資格消滅を証明しない。

|論点|分類・結論|
|---|---|
|revoke存在|DOC VERIFIED|
|全系列access/refreshへの厳密範囲|NOT VERIFIED：説明はtokensの取消だが並行発行/旧系列までの詳細不明|
|反映遅延/TTL/同時refresh競合|NOT VERIFIED|
|既送信の取消|確認なし。revokeで過去UNKNOWNをFAILEDとしない|
|新OAuth認可|失効が将来再認可を永久拒否する保証なし。旧callback/clientの能力管理別|
|Secret変更/削除|既accessの失効保証とは別、無害化として単独採用不可|
|Sandbox/Production/同app他接続の影響|対象Token/app/accountを正式照合する必要、今回実値を読まない|

## 既存コードとの照合
SRC apps/tiktok-public/lib/server.ts（基準ref）にrefreshとtoken暗号化保存がある。tiktok/disconnect POSTはconnectionsのlocal DELETEのみで、確認したhandlerにrevoke呼出なし。**画面の接続解除をTikTok資格失効と扱えない。** これは基準sourceの所見であり、稼働Version14の実挙動証明ではない。実行・修正しない。

## B採用の前提
対象app/全account/全Token系列を非出力で特定→正式失効範囲/反映・並行refresh保証取得→旧OAuth再取得経路停止→別承認で実行/非送信の事後確認→未知通信保持。旧host停止/drainとデータ保全が別途必要。revokeそのものもTikTok API通信・接続変更のため今回禁止。
新hostへSecretをコピー/新鍵生成しただけで旧hostを無害化したとしない。資格失効方式はPARTIAL、全体BLOCKED。

