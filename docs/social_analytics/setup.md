# 初回設定ガイド

このガイドは、毎朝07:00 JSTの自動分析とLINE通知を有効にするための一回限りの設定です。すべてのトークン、クライアントシークレット、送信先IDはGitHubの**Repository secrets**に保存し、チャット・Markdown・ソースコード・コミットに記載しません。

## 選択肢

| 方式 | 利点 | 留意点 | 推奨場面 |
|---|---|---|---|
| 公式APIによる自動取得 | 所有者向けの詳細指標を日次で収集し、全グラフを自動更新できる | 各プラットフォームで開発者アプリとOAuth認可が必要 | 継続的なフル分析 |
| 分析画面のCSV/JSONエクスポート | 長期トークンを持たずに同じレポート形式へ反映できる | 新しい所有者指標を自動収集できない | 最小構成またはAPI審査待ち |

> 推奨は、Instagramから公式APIを有効化し、TikTok・YouTubeは開発者アプリの認可が完了するまで公開データ・エクスポートを使う段階的運用です。

## GitHubの共通設定

リポジトリの **Settings → Secrets and variables → Actions** を開き、下表のシークレットを追加します。値をファイルに書かないでください。

| Secret | 必須媒体 | 取得元 |
|---|---|---|
| `META_ACCESS_TOKEN` | Instagram | 既存Metaトークン。Instagram Loginに対応するトークンであれば`/me`からProfessional Accountを解決して使用 |
| `INSTAGRAM_USER_ID` | Instagram | 任意。Metaトークンから解決できない場合に対象Instagram Professional Account IDを登録 |
| `TIKTOK_CLIENT_KEY` | TikTok | 登録済み。TikTok for DevelopersアプリのClient key |
| `TIKTOK_CLIENT_SECRET` | TikTok | 登録済み。TikTok for DevelopersアプリのClient secret |
| `TIKTOK_REFRESH_TOKEN` | TikTok | 追加が必要。OAuth認可後に受け取るrefresh token |
| `YOUTUBE_API_KEY` | YouTube | 登録済み。公開チャンネル統計を日次更新するAPI key |
| `YOUTUBE_CLIENT_ID` | YouTube | 任意。所有者分析を有効化するGoogle OAuth 2.0 client ID |
| `YOUTUBE_CLIENT_SECRET` | YouTube | 任意。所有者分析を有効化するGoogle OAuth 2.0 client secret |
| `YOUTUBE_REFRESH_TOKEN` | YouTube | 任意。YouTube Analytics APIのOAuth認可後に受け取るrefresh token |
| `LINE_CHANNEL_ACCESS_TOKEN` | LINE | 登録済み。LINE Messaging APIのチャネルアクセストークン |

## Instagram

Meta for DevelopersでInstagram APIを使うアプリを作成し、対象のProfessional Accountへ`instagram_business_basic`および`instagram_business_manage_insights`の権限を付与します。公式ドキュメントによると、メディアインサイトにはリーチ、再生、保存、シェア、平均視聴時間などの指標が含まれます。ただし、データは最大48時間遅延することがあります。[1]

既存の`META_ACCESS_TOKEN`は、Instagram Loginに対応する場合、対象アカウントIDなしで`/me`からProfessional Accountを解決できます。解決できない場合のみ`INSTAGRAM_USER_ID`を追加してください。長期トークンの有効期限・更新方法はMetaの公式仕様に従って管理します。[2]

## TikTok

TikTok for Developersでアプリを作成し、Login KitとTikTok APIを承認対象に追加します。OAuth同意では、少なくとも`user.info.basic`、`user.info.profile`、`user.info.stats`、`video.list`を要求してください。Display APIでは、認可済みユーザーのプロフィールと公開動画を取得し、動画詳細に`view_count`、`like_count`、`comment_count`、`share_count`を指定できます。[3] [4]

認可後に得た`client_key`、`client_secret`、`refresh_token`を対応するGitHub secretへ登録します。アクセストークンは短期間で失効するため、ワークフローがrefresh tokenから実行時トークンを更新します。[5]

## YouTube

Google Cloud ConsoleでOAuth同意画面とOAuth 2.0 clientを作成し、YouTube Data API v3とYouTube Analytics APIを有効にします。所有者分析のため、少なくとも`https://www.googleapis.com/auth/youtube.readonly`および`https://www.googleapis.com/auth/yt-analytics.readonly`のスコープを認可します。YouTube Analytics APIのレポート取得にはOAuth 2.0認可が必要です。[6]

既存の`YOUTUBE_API_KEY`では公開チャンネル統計と動画別公開再生数を更新できます。所有者向けの視聴時間、維持率、CTR、流入元、登録者増減を追加する場合は、OAuth同意後に取得したclient ID、client secret、refresh tokenを3つの`YOUTUBE_*` secretへ登録します。初期対象は [Runa-Girl8215](https://www.youtube.com/@Runa-Girl8215) です。

## LINE

LINE Developers ConsoleでMessaging APIチャネルを準備し、送信先の利用者またはグループが公式アカウントの通知を受け取れる状態にします。LINE Messaging APIはユーザー、グループ、複数人トークへのPush messageをサポートします。[7]

FieldRiseの既存定時報告はBroadcast APIを利用するため、登録済みの`LINE_CHANNEL_ACCESS_TOKEN`だけで通知できます。送信先IDの`LINE_TARGET_ID`は不要です。アクセストークンが漏えいした場合は直ちに無効化・再発行してください。[8]

## 実行確認

Secrets登録後、GitHubの **Actions → FieldRise AI秘書 - 定時報告 → Run workflow** を手動で一度実行します。手動検証では`send_line`をfalseにして送信を抑止できます。成功時は、`automation/social_analytics/data/*_latest.json`、`automation/social_analytics/reports/*.md`、`automation/social_analytics/reports/charts/*.png`が更新され、毎朝07:00 JSTの定時報告には更新済みGitHub URLが自動掲載されます。

## 参考文献

[1]: https://developers.facebook.com/documentation/instagram-platform/reference/instagram-media/insights "Instagram Media Insights"
[2]: https://developers.facebook.com/documentation/instagram-platform/reference/access_token "Instagram Access Token"
[3]: https://developers.tiktok.com/doc/display-api-overview "TikTok Display API"
[4]: https://developers.tiktok.com/doc/tiktok-api-v2-video-query "TikTok Video Query"
[5]: https://developers.tiktok.com/doc/oauth-user-access-token-management "TikTok OAuth User Access Token Management"
[6]: https://developers.google.com/youtube/analytics/reference/reports/query "YouTube Analytics API reports.query"
[7]: https://developers.line.biz/en/docs/messaging-api/sending-messages/ "LINE Messaging API: Send messages"
[8]: https://developers.line.biz/en/docs/basics/channel-access-token/ "LINE Channel Access Token"
