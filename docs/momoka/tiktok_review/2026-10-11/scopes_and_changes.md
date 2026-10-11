# 製品・スコープ用途と変更案
基準Commitのコード確認。Portal要求状態・本番デプロイ・最新ライブ結果は未確認。
参照: [公式資料](README.md)。

| 製品/スコープ | 公式用途 | 現行コードとの対応 | 証拠不足 |
|---|---|---|---|
| Login Kit | 利用者のTikTok認可（S3） | Connect TikTokが既存OAuth開始URLへ遷移する | OAuth start/callbackソースは想定リポジトリpathで取得不可。デプロイ・redirect/state・現在認可の確認未実施 |
| user.info.basic | 基本プロフィール（S9） | 過去記録では認可・情報取得実績あり | 現行HTML/APIにはUser Info取得経路がなく、接続表示はCreator Info。独立した用途の証明が必要 |
| video.upload | TikTok inboxへの動画下書き共有（S6） | action=upload→inbox/video/init、MP4転送、状態取得 | モックテストPASS。今回ライブSEND_TO_USER_INBOX未確認。最終公開・SoundOn選択を保証しない |
| video.publish | Direct Post（S7）＋Creator Info（S8） | creator表示、privacy/interaction取得、publish/video/init | モックPASS、過去Sandbox実績。内部用途がS2と衝突。今回ライブ未実施 |

## Upload専用案の技術課題
フロントエンドはsession取得後にapiCreatorを呼び、creatorが存在しなければInboxボタンも有効にしない。API GET action=creatorはQuery Creator Infoを呼ぶ。S8はvideo.publish必須。
従ってvideo.publishをPortalから削除するだけでは、video.uploadだけの利用者はcreator取得に失敗しInbox操作が止まる可能性がある。これはコードと仕様からの判断で、実際のscope拒否を今回送信して確認した結果ではない。

変更案（実装禁止・社長承認待ち）:
1. Upload用のアカウント表示とDirect Post Creator Infoを分離し、既存OAuth側で確認できた基本プロフィール取得を再利用する。新しい権限を勝手に追加しない。
2. Upload用UIからDirect Post依存を分離。Inbox側でcaption/privacyを送らない現行動作を維持しTikTokで最終編集する旨を明示する。
3. user.info.basicのみの表示とvideo.uploadのみのInbox経路、video.publishなしの起動、scope不足時の失敗をモック・承認済みSandboxで検証する。
4. Portalスコープ変更・OAuth再認可・Sandbox送信は別承認。成功済み本番コードへ上書きしない。専用開発ブランチでレビュー後に判断。

## 審査適合性
- Direct Post固有: S2の社内・自社管理アカウントの用途制限に抵触。
- Uploadのみ: Direct Post固有の制限をそのまま適用するとは断定しない。ただしS1のアプリ全体のprivate/personal use制限は残る。Production利用の審査要件から免除されるとは確認できない。
- S1は必要な権限だけを要求する。社長の写真・SoundOn重視フローをMP4 API実装済みとして申告しない。
- user.info.basicの未使用が判明した場合も、削除は社長承認後。Creator Infoとの役割を混同しない。

## 公式問い合わせ草案（未送信）
FieldRise currently uses Creator Studio only within our own business to prepare original MP4 content for our own TikTok account. We do not offer a public service. We understand that Direct Post guidance excludes internal/team account uploader tools and that App Review Guidelines state apps must not be for private or personal use. Is a Login Kit plus video.upload-only application eligible for Production review under this internal use case? If so, please identify the applicable eligibility conditions and required evidence. We will not describe the application as public or submit Direct Post without resolving these conditions.
