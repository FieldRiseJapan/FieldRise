# Phase 5-C 送信入口・writer一覧

確認日時：2026-10-14 12:26 JST。確認元H1〜H7は[ホスト能力](phase5c_host_stop_capability.md)。基準GitHub sourceの読取、実送信疎通なし。

|経路|判定|根拠と例外|
|---|---|---|
|https://fieldrise-creator-studio.wryrice16.chatgpt.site|VERIFIED（管理情報）|live URL、deployment succeeded。HTTP画面/実DBの今日の確認ではない|
|/studio → POST /api/jobs|VERIFIED（source）|catch-all route→handle→認証/所有者/同意/prepare/台帳/CAS→動画Inbox init。稼働版bundle全文との一致は未確認|
|Worker tiktok transport|VERIFIED（source）|open.tiktokapis.com /v2/post/publish/inbox/video/init/ へ直接fetch。外側proxyを迂回できる旧directfetchが残る危険|
|旧Version14 fixtureの写真処理|VERIFIED（保存source）|PHOTO時/v2/post/publish/content/init/、VIDEO時Inbox init。現在Phase5-BはVIDEO Sandboxに限定。旧稼働bundleの実有効性・権限は未確認|
|POST /api/jobs/{id}|VERIFIED（source）|status/fetch外部APIとchecked/state保存。新規送信でなくてもwriter、今回実行禁止|
|POST /api/tiktok/prepare-inbox|VERIFIED（source）|準備予約/URL発行。送信せずDB writer|
|OAuth connect/GET callback/disconnect|VERIFIED（source）|state作成、token交換・接続保存/削除。GETでもwriter。再認証していない|
|register/account DELETE/draft PUT/POST/DELETE/assets POST/DELETE/preflight|VERIFIED（source）|登録・削除・下書き・素材・予約等。送信だけ止めても全writer凍結ではない|
|GET履歴/プロフィール/素材pull|VERIFIED（source）|基本読取。基盤認証/session周辺の副作用は管理仕様で別途確認|
|保存Version1〜13|VERIFIED（存在）/到達NOT VERIFIED|履歴14件。旧version実行URLを推測・生成しない|
|current Preview|VERIFIED（null）|管理情報で現在未登録。過去Preview/版別URLの到達不能証明ではない|
|Cloudflare version URL/worker直通/override経路|NOT VERIFIED（当Site）|一般公式機能は存在するが、Sitesでの有効化・URL/権限不明。推測URLのprobeなし|
|scheduled/queue/alarm送信|tracked sourceでhandlerなし、実ホストNOT VERIFIED|build/sites-workerはfetchのみ。サイトautomation0もprovider内部全queue停止の証拠ではない|
|管理者専用送信API|基準sourceでなし、host内部NOT VERIFIED|grant/cleanup/migrationのpublic operator APIなし。管理者source deploy/env操作は送信を再有効化し得る|
|rollback旧code|VERIFIED（履歴・仕様）|旧serverは新台帳を理解しない。旧版100%再公開の安全性はNOT VERIFIED|

到達不能と確定した旧/代替経路は0件。確認していない経路を安全として除外しない。

公式参考：2026-10-14確認 [Cloudflare Version URLs](https://developers.cloudflare.com/workers/versions-and-deployments/version-urls/)、[Versions](https://developers.cloudflare.com/workers/versions-and-deployments/)。一般機能と当Site設定を区別する。
