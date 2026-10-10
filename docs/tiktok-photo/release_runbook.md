# TikTok写真準備システム 公開準備・復旧手順

**実行許可ではない。Production反映、mainへのPush、Pages設定変更、外部公開は社長の別途承認後のみ。現在の判定：CONDITIONAL。**

## 公開対象
既存サイト配下 `automation/sns_auto_posting/tiktok/photo/` に以下8ファイルのみを公開候補とする。
index.html / style.css / page.mjs / core.mjs / batch.mjs / data.mjs / workflow.mjs / assist.mjs
診断ツール・PowerShell・テスト・実写真・ユーザーJSON・Secret/Tokenを公開資材へ含めない。各ファイルSHA-256は診断JSONで記録する。

URL案（未公開・動作未確認）：
https://fieldrisejapan.github.io/FieldRise/automation/sns_auto_posting/tiktok/photo/
これは設計上の候補。開発ブランチをPushしただけでは公開しない。GitHubツリーURLは実行画面URLではない。

## 方式と適合性
HTML/CSS/ES modulesだけでビルド・バックエンド・新規認証不要。相対参照を使い、プロジェクトサイトの/FieldRise/配下に適合する設計。Pythonはローカル診断用で公開時不要。
GitHub公式資料：
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/creating-a-github-pages-site
- https://docs.github.com/en/pages/getting-started-with-github-pages/securing-your-github-pages-site-with-https
参照日：2026-10-10。Pagesはブランチ/フォルダ公開またはActions公開を選択可能。公開元変更は既存サイト全体に影響するため、写真ツールのために切替えない。
現在のPages設定（公開元branch/folder/Actions・HTTPS・カスタムドメイン）は管理画面で未確認。リポジトリ内の明示的Pagesデプロイworkflowは今回の検索で見つからず、設定不存在を断定しない。
既存公開元を確認し、既存デプロイ方式に8ファイルを追加する最小差分案を採用。公開元がmain以外や/docsならコピー先は再評価する。サイト全体への.nojekyll追加/ビルド変更/Pagesソース変更は今回行わない。

## 本番設定・境界
- 環境変数、Secret、OAuth、Supabase追加設定は不要。
- CSP default-src self、script/style self、connect-src none、object/base/form noneを維持。blob画像を許可、inline script/CDNなし。
- 実画像とJSONは端末のみ。Studio/公式音源URLは本人が開く外部ナビゲーションで、画像や文章を自動送信しない。
- HTTPSを確認、.mjsがJavaScript MIMEで配信されることを公開候補環境で確認。メタCSPだけでは全HTTPヘッダーを制御できない。
- localStorageはOrigin/プロファイル依存。ローカルから本番へはJSON追加取込で移すが既存IDとの重複は拒否。初期楽曲も重複対象。破壊的な上書き復元・データ消去を行わない。安全な移行ができない場合は公開前ブロッカーとして扱う。
- 同じGitHub Pages Origin上の他アプリとlocalStorage名前空間は共有される。専用キーを使用するが他同Originスクリプトからのアクセス隔離はない。Secret/Tokenを入れない。既存サイトスクリプトの第三者通信等の変更は対象外。

## 公開前（社長承認のための準備）
1. Windowsガイド15項目の結果、検証SHA、未確認を確定。重大FAILを解消し回帰テスト/Secret検査を再実施。
2. 現在のPagesソース・HTTPS・本番Commitを記録。公開前8ファイルの有無/ハッシュと公式トップページ・既存MP4/YouTubeの確認結果を退避。
3. 他の開発差分を含むブランチ全体のmainマージは避け、8ファイルに限定したレビュー可能な公開差分を用意。トップナビ追加は別の承認項目とし、必須ではない。
4. URL、公開対象SHA、移行制約、復旧対象を社長へ提示して承認を得る。現時点はまだ実行しない。

## 承認後の公開と確認
承認された担当者が既存方式で対象ファイルのみ反映。公開元設定を不用意に変更しない。
- 公開URL/全8ファイルのHTTP200、.mjs MIME、文字化け、ブラウザコンソール/CSPエラーを確認。
- Windowsで検証用画像2～3枚、ZIP保存/展開、クリップボード、セット保存/再読込、JSON、音源警告を再確認。
- 公式トップ、既存SNS画面、YouTube画面に差分による影響がないことを確認。実投稿や予約投稿はこの公開承認に含めない。
- 既存ユーザーJSONを退避し、Origin変更時の移行は追加取込/重複拒否を確認。実データが欠落する場合は作業停止。

## ロールバック（実行は承認対象）
1. 障害が写真機能に限られる場合、新しい公開リンクを止め、対象8ファイルのみ公開前Commitの内容へ戻す。以前存在しないファイルはその8ファイルだけを削除対象とする。
2. 公式トップ/他開発の変更を巻戻すリポジトリ全体のreset/force pushを行わない。対象パスのrevert/復旧Commitをレビューし既存デプロイで反映。
3. ユーザーのlocalStorageとJSONは削除しない。v5データを古い版が読めない可能性があるので、旧アプリへ戻す前にJSON退避・スキーマ確認。ファイルを戻せばデータも戻るとは扱わない。
4. 対象URL/公式トップ/MP4/YouTubeの再確認、復旧SHA/日時/結果を報告。公開前Pages設定は変更しない設計なので設定の巻戻しを不要にする。

## 判定
CONDITIONAL：ローカルのコード/HTTP/回帰検証と手順は準備済み、Windows実ブラウザと実OS保存・現在のPages設定・実公開配信は未確認。無条件READYにはしない。
Windows重大FAIL/データ消失/Secret混入/音源完了拒否の不具合が出たらNOT READY。Windowsと公開方式の必須確認を完了し重大問題なしの場合にREADY候補を再判定する。READYでも公開・実投稿の社長承認は別。

## 英語版に伴う更新
公開対象は引き続き8静的ファイル。英語投稿が標準となりJSONはv6（v1～v5読込）。旧日本語の文章は翻訳せず保持。旧アプリへ戻す前にv6バックアップとスキーマ互換性を確認する。旧版の社長実機確認は英語版の動作保証に転用しない。Production公開判定は引き続きCONDITIONAL。

## 英語版Windows結果反映（2026-10-10）
社長確認11項目はwindows_validation.mdに記録。ZIP展開・3枚存在はPASSだが各JPEG表示は未確認。Pages公開APIの認証なしGETはHTTP 404で、現在設定・公開元は確認不能。不存在とは判定しない。設定変更は未実施。公開判定はCONDITIONAL。公開前にはWindows保存復元/実画像正常性、実JSONバックアップの重複安全移行、既存Pages公開元と8ファイルの配信先を確認する。移行が安全に確定しなければ公開を停止する。

## 最終品質保証版（2026-10-10）
- 初期の未編集・未参照楽曲はプレビュー/明示確認でバックアップ情報へ採用可能。完全一致楽曲共用は全項目比較。その他競合は全体拒否。保存成功まで画面状態も変更しない。JSON v6のまま旧v1～v6互換を維持。移行手順はwindows_validation.md。
- 読取HTTP確認：公式トップ `https://fieldrisejapan.github.io/FieldRise/` は200。写真ツール候補URLは404で、現時点で稼働確認できない。Pages公開APIは404のため公開元/設定は不明。現行トップ稼働はCreator Studio公開済みを意味しない。
- 判定CONDITIONAL。公開前に実Windowsで移行・保存復元・JPEG表示/EXIFを確認し、管理者がPages公開元を確認。旧判定のJSON問題はコード修正済みだが実ユーザーバックアップでの検証は残る。
