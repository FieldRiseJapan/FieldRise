# 審査フィードバック対応表と提出前チェック
新しいPortal原文はログイン必須で未取得。下表の原文・要約は過去証拠に限る。
参照: [README](README.md)。

## 対応表
| 指摘 | 出所 | 対応状態 | 次の証拠 |
|---|---|---|---|
| Scopes mismatch / demo does not clearly demonstrate each selected product and scope | 社長提供の過去Portal画面。最新フィードバックと同一か未確認 | 未解消。タイトル動画は操作を示さない | 各scopeの実操作・タイムコードとPortal選択の照合 |
| Demo video images were pixelated; use high-quality images | review_fix_2026-09-21.mdの記録（レビュー原文再取得ではない） | 録画設計済み、完成録画なし | 新MP4を全編再生し文字可読性を確認 |
| Privacy Policy / Termsのアイコン不表示 | 同上・既存報告 | 完了扱い | 1467d2192cbf33a0a56425c286879c9bbd82c366 |
| faviconの表示 | 同上・既存報告 | 完了扱い | c96b19de...、b56d87dc...、確認Commit 1467d219... |
| 社内専用用途 | 公式S1/S2の照合。現在の審査担当者の新指摘ではない | BLOCKED | 適用条件の公式回答、又は実態を伴う将来公開サービスで再評価 |

## 提出前チェックリスト
- [ ] ログイン済みPortalでProduction状態・更新日・対象版を読み取り確認。
- [ ] 製品、scope、app description、review narrative、feedback原文、登録動画を記録。Secretを含めない。
- [ ] 社内専用用途についてS1/S2との整合が確認できている。将来計画・形式的公開で代用しない。
- [ ] Upload-onlyの場合も内部用途の条件とCreator Info依存を解決済み。
- [ ] user.info.basicの独立した実利用を確認するか、承認後に未使用scopeを整理。
- [ ] 全申請製品・scopeを実際の現行アプリで収録。Sandbox根拠を確認。
- [ ] OAuth認可、アカウント表示、MP4選択、同意、対象APIの実応答/状態を確認。
- [ ] Inbox通知によるTikTok側編集とDirect Postを正しく区別。SEND_TO_USER_INBOXは公開完了ではない。
- [ ] MP4最大5本・各50MB以下、画面文字可読性、正しいドメイン、機密情報非表示。
- [ ] 全編再生、タイムコード・ファイルhash・撮影日・未実演項目を記録。
- [ ] 登録URL・redirect・必要なURL ownershipを確認（今回変更なし、アイコン再調査なし）。
- [ ] 申請文と現在提供する機能・利用者・デモ・スコープが一致。
- [ ] Supabase本番/既存投稿セット/既存OAuthに変更なし。
- [ ] 社長が完成資料・動画を確認して明示承認。
- [ ] 別途承認後にのみPortal保存/動画差し替え/Submit。受付状態を確認。

現時点のチェック未達は提出を止める根拠。資料作成済みをREADYと扱わない。Sandbox成功・モックPASSはProduction承認を意味しない。
