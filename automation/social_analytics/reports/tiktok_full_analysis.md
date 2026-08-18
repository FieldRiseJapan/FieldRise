# TikTokフル分析レポート（認可待ち）

**対象アカウント:** [@fieldrizejapan](https://www.tiktok.com/@fieldrizejapan)  
**分析基準日:** 2026-08-16

## 現在の状態

公開プロフィールはブラウザ上で安定して取得できず、所有者向けのTikTok API認可も未完了です。そのため、フォロワー数、累積いいね数、動画別視聴数、保存数、シェア数を推測・代入せず、初期レポートでは数値分析を保留します。

## 認可後に実行するフル分析

| 分析領域 | 取得・算出する指標 |
|---|---|
| アカウント成長 | フォロワー数、累計いいね数、動画本数、日次・週次増減 |
| 投稿パフォーマンス | 再生数、いいね、コメント、シェア、保存、完了率（取得可能な場合） |
| コンテンツ分析 | テーマ、尺、フック、音源、投稿時間、ハッシュタグ別の中央値比較 |
| クロスチャネル導線 | YouTube・Instagramへの誘導設計、シリーズ別の再利用率 |

## データ接続要件

TikTok Display APIでは、認可済みユーザーのプロフィールと公開動画を取得できます。動画詳細では`like_count`、`comment_count`、`share_count`、`view_count`を指定できます。[1] [2] アクセストークンは短期間で失効するため、公式のリフレッシュトークン運用が必要です。[3]

> **実測値と推測の区別:** このレポートには未取得のTikTok数値を含めません。認可が完了した最初の実行時に、実データのみで個別グラフを生成します。

## 参照

[1]: https://developers.tiktok.com/doc/display-api-overview "TikTok Display API overview"
[2]: https://developers.tiktok.com/doc/tiktok-api-v2-video-query "TikTok Video Query"
[3]: https://developers.tiktok.com/doc/oauth-user-access-token-management "TikTok OAuth Access Token Management"
