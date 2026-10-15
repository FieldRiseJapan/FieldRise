# Phase 5-F 旧Sites実行経路
確認日：2026-10-15 JST。基準Commit：ea7c24f99e7018f8e187c0106c50f29bc2a1c55c。
資料調査のみ。F01/B04・F02総合・公開適用・移行実行：BLOCKED。公開環境未実測。


情報分類：SRC＝指定Commit既存コード、REC＝過去報告/139隔離試験、DOC＝公式資料、AI＝社長共有Support要約、INF＝技術推論。どれも現在の稼働bundle/DBを実測した証拠ではない。

|経路|証拠・範囲|現在判定|
|---|---|---|
|公開Site URL|REC：既知URL、Version14/env19の管理記録|過去確認、今日未実測|
|保存済み旧Version|REC：1〜14保存|保存存在≠各版実行可能、到達NOT VERIFIED|
|Preview|REC：current preview null|過去/全Preview不存在NOT VERIFIED|
|旧Deployment|REC：V14 deployment記録|他旧URL/実行継続NOT VERIFIED|
|Worker直通|一般CF仕様はあるがSites公開経路未取得|NOT VERIFIED、推測URL probeなし|
|認証利用者/admin|SRC：jobs/prepare/status/callback/CRUD writer。正規host管理権限も別|経路分類済み、全認可者停止NOT VERIFIED|
|Scheduled/Automations|REC：tracked worker fetchのみ、過去Site automation0。AIは条件付きautomation|現設定/実行中task NOT VERIFIED|
|Service Binding等内部呼出|当Site固有の証拠なし|NOT VERIFIED、存在を断定しない|
|TikTok外向き|SRC server.ts：open.tiktokapis.comへ直接fetch、inbox init、token交換/refresh、user info|コード上VERIFIED、稼働/通信は未実測|
|deploy/rollback再有効化|REC保存旧版、SRC旧版に新台帳なし|安全側再公開制御NOT VERIFIED|

SRC：apps/tiktok-public/lib/server.ts をGitHub基準refから再読取。tiktok transport、exchange、refresh、callback、disconnect、jobsを照合。追加候補lib/tiktok.tsは取得エラーで根拠に使わない。旧Version14は既存fixture/報告を再利用、今のGitHub安全実装と公開版を同一視しない。
POST以外でもGET OAuth callbackはwriter。UI非表示/POSTだけの拒否/新コードhaltでは全writer停止にならない。管理者再deploy/oldversion/サービス経路を除外する証拠がない。
参照：Phase5-C endpoint inventory、Phase5-E B04 matrix。URL/内部ID/secretを追加収集していない。

