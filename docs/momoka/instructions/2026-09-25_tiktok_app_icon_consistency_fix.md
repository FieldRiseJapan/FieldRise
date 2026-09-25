# GPT桃花 作業指示書 — TikTok App Icon 一致確認・実装修正

日付: 2026-09-25
担当: GPT桃花
指示元: 彩花CTO
対象: FieldRise Creator Studio / TikTok Production 再審査対応
優先度: 高

## 1. 背景

TikTok Production審査が再度 Not approved となった。
今回のReviewer Noteは以下の内容:

> The app icon submitted in the Basic Info does not match the icon displayed on the website. Please ensure the same icon is used consistently across both the TikTok, the website and Browser tab (favicon), then resubmit for review.

現在確認できている状態:
- TikTok Developer Portal / Basic information の App icon: 女性キャラクター画像
- FieldRise Creator Studio Web画面左上: 水色系の「FR」アイコン
- この不一致が今回の審査指摘対象
- TikTok側の登録済み女性キャラクターApp iconを正本候補とする
- ただし推測で画像を選ばず、実物を確認してから実装すること

## 2. 今回の目的

TikTok審査員が確認するすべての公開箇所で、同一のApp iconを一貫して表示する。

最低限の確認・実装対象:
1. TikTok Creator Studio Webページ
2. Browser tab favicon
3. Termsページ
4. Privacyページ
5. 上記ページから参照するアイコンファイル

TikTok Developer PortalのBasic informationに登録されている女性キャラクター画像と、Web側で使用する画像が視覚的に同一であることを最優先とする。

## 3. 作業手順 — 先に確認

### A. 現状調査
以下を確認すること。

- `automation/sns_auto_posting/tiktok/index.html`
- `terms.html`
- `privacy.html`
- TikTok関連のCSS / JS / assets
- favicon指定
- 現在Web左上の「FR」アイコンを生成・表示している箇所
- GitHub内に存在する女性キャラクターApp icon候補

既存の画像ファイルを検索し、TikTok Basic informationに登録されている画像と一致する可能性のあるファイルを特定する。

### B. 正本画像の確定
推測で差し替えないこと。

候補画像を特定したら、
- ファイルパス
- 画像サイズ
- 形式
- SHA-256（取得可能なら）
- どのページで現在使われているか

を確認する。

TikTok登録画像との一致をGitHub情報だけで断定できない場合は、実装前に「確認待ち」として彩花CTOへ報告すること。別の似た画像で代用しない。

## 4. 実装指示

正本画像が確認できた場合のみ、以下を実施する。

### Creator Studio
`automation/sns_auto_posting/tiktok/index.html`

現在の「FR」表示を正本App iconへ変更する。
アプリ名 `Creator Studio` / `FieldRise Creator Studio` の既存表示やTikTok投稿機能を壊さないこと。

### favicon
TikTok Creator Studioページのbrowser tab faviconを正本App iconに統一する。
古いfavicon参照が残らないよう確認する。

### Terms
`terms.html`

ページ上で表示するApp iconとfaviconを同じ正本画像に統一する。

### Privacy
`privacy.html`

ページ上で表示するApp iconとfaviconを同じ正本画像に統一する。

### 共通化
可能なら1つの正本画像ファイルを各ページから参照する。
ページごとに別画像を複製して管理しない。
ただしGitHub Pagesの相対パスに注意し、各公開URLから正常にロードできること。

## 5. 絶対に変更しないもの

今回の修正はApp icon整合性対応に限定する。

変更禁止:
- TikTok OAuth処理
- Supabase Edge Functions
- Client key / Client secret
- Access token / Refresh token
- Direct Post処理
- SELF_ONLY制御
- 動画アップロード処理
- Caption / Privacy / Interaction設定
- Music Usage Confirmation
- AI-generated content設定
- Terms / Privacy本文（アイコン・favicon参照以外）
- Instagram関連
- YouTube関連

秘密情報をGitHubへCommitしないこと。

## 6. 動作確認

実装後、GitHub Pagesで以下を確認する。

- Creator Studioを直接開いて正本アイコンが表示される
- ブラウザタブfaviconも同一アイコン
- Termsページで同一アイコン
- Termsのfaviconも同一アイコン
- Privacyページで同一アイコン
- Privacyのfaviconも同一アイコン
- 画像404なし
- Consoleに今回変更由来のエラーなし
- Creator Studio既存UIが崩れていない
- TikTok接続・投稿関連コードに不要な変更がない

キャッシュの影響を考慮し、必要ならハードリロード相当で確認する。

## 7. 完了条件

以下をすべて満たした時だけ完了とする。

- TikTok Basic InfoのApp iconとWeb表示用アイコンが同一であると確認できた
- Creator Studio表示アイコン統一
- favicon統一
- Terms統一
- Privacy統一
- 公開URLで表示確認
- 既存TikTok機能への影響なし
- mainへCommit / Push済み

## 8. 報告必須項目

作業完了後、正式報告先
`docs/momoka/reports/latest_report.md`
へ以下6項目を必ず記載する。

1. 完了状況
2. 変更ファイル一覧
3. Commit SHA
4. Push先（branch）
5. 未完・ブロッカー
6. 次に彩花CTOが確認すべきファイル / 公開URL

追加で今回のみ以下も報告すること。
- 正本App iconのファイルパス
- 画像サイズ / 形式
- SHA-256（取得可能なら）
- Creator Studio / Terms / Privacy / favicon の参照先
- TikTok Reviewer Noteへの対応内容
- 公開ページ確認結果

## 9. 注意

この作業完了だけでTikTokへ再申請しないこと。
再申請は彩花CTOと社長が公開ページを最終確認した後に行う。

以上。
