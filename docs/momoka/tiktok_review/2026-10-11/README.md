# FieldRise TikTok Production審査準備パッケージ
作成日: 2026-10-11 JST
担当: GPT桃花 Astra Work（Codex）／監督: GPT彩花 CTO
App ID: 7664531024089532432
基準Commit: 1467d2192cbf33a0a56425c286879c9bbd82c366
専用ブランチ: docs/tiktok-production-review-prep-20261011

**最終判定: BLOCKED。** 資料草案は完成したが、現行の社内専用方針はS1のprivate/personal use禁止と衝突する。Direct PostはS2でも自社・チーム管理アカウントへの投稿ツールが不適切な例に挙げられる。動画改善やスコープ削減だけで、この利用目的の問題は解消しない。一般公開・有料化の将来計画を現在のサービス実態として記載しない。

## 成果物
- [撮影台本](demo_script.md)
- [日本語申請草案](application_ja.md)
- [英語申請草案](application_en.md)
- [スコープ別用途・変更案](scopes_and_changes.md)
- [フィードバック対応表・提出前チェックリスト](feedback_and_checklist.md)
- [社長の最小操作手順](owner_steps.md)

## 証拠の状態
| 項目 | 状態・根拠 |
|---|---|
| 現在のProduction状態 | 未確認。今回ブラウザで対象App URLへアクセスし「No access You need to login to access this page」を確認。現行スコープ・説明文・レビュー原文・動画登録もアクセス不可 |
| Draft | 記録上。基準Commitのlatest_reportは社長提供画面のDraftを記録。今回のライブ状態とは断定しない |
| アイコン | 社長指示と既存報告により完了扱い。再調査・追加修正なし |
| 動画実ファイル | 実測・映像サンプリング確認済み。下記参照 |
| APIコード | 基準Commitのmain由来コードを読み取り確認。デプロイされたSupabase版との一致は未確認 |
| APIテスト | 既存9件PASS。モックのみ、実OAuth・TikTok送信・Production成功の証明ではない |
| Sandbox成功 | 過去記録の実績。今回の実演・再確認ではない |
| TikTok Studio写真＋cafe 0:59 | 社長による公式Studio実機確認の記録。FieldRise APIの証明に流用しない |

## デモ実ファイル
指定名 fieldrise_tiktok_test.mp4 はLibraryの /TikTok承認/ で解決し、実ファイルを取得した。
- H.264 MP4、8.000秒、1080×1920、38,648 bytes
- SHA-256: 6e02c5bb1177c2153199fa2141a827745960a5183917171ca20d2790c0cf7892
- 0〜7秒を1秒間隔で抽出した8フレームと3秒の原寸画像を確認。タイトル「FieldRise / TikTok AUTO POST / SANDBOX TEST / 2026.09.13」のみ。操作場面を確認できない。
- Portalで現在登録されている動画と同じファイルかは未確認。今回全フレームの目視再生はしていない。
- 別名の2026-09-21画面録画もローカルに存在し、68.586833秒・2560×1392・24,435,446 bytesと実測。既存の接触シートでは旧UI・Direct Post操作を確認できるが、現行UI、OAuth認可、Inbox、全スコープを証明する完成動画としては採用しない。

## 中断からの復旧
再開時のGitHub検索で専用ブランチは存在せず、指定latest_reportに今回資料の追記もなかった。中断直前の履歴にも申請資料書込み・Commit・Push成功はない。ローカルには以前のAPI検証用ファイル、画面録画、動画確認画像、取得補助ファイルが残っていた。これらを既存成果として保持し、新規資料だけを専用ブランチに保存した。

## 将来の一般公開移行（今回実装しない）
外部クリエイターが実際に登録・認可・利用できるサービス、機能説明サイトとサポート、適切なPrivacy/Terms・データ削除・認可取り消し、利用者別データ分離・権限検証・容量/回数制御が必要。共通素材プレビュー/同意/投稿状態と、FieldRise内部の楽曲・投稿セット・業務ロジックを分離する。完成した実態と全スコープのライブ検証が揃った段階で審査条件を再照合する。形式的な公開・開発中画面だけの公開でS1を満たすとは扱わない。決済導入は審査適合の代替にならない。

## 公式資料
確認日: 2026-10-11 JST。各要件はこの日取得した公式資料に基づく。
- [S1 App Review Guidelines](https://developers.tiktok.com/docs/en/app-review-guidelines)（表示更新日2026-08-04）
- [S2 Content Sharing Guidelines](https://developers.tiktok.com/docs/en/content-sharing-guidelines)（表示更新日2026-08-04）
- [S3 Login Kit Web](https://developers.tiktok.com/docs/en/login-kit-web)
- [S4 Content Posting API](https://developers.tiktok.com/products/content-posting-api/)
- [S5 Get Started Upload](https://developers.tiktok.com/docs/en/content-posting-api-get-started-upload-content)
- [S6 Upload Reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-upload-video)
- [S7 Direct Post Reference](https://developers.tiktok.com/docs/en/content-posting-api-reference-direct-post)
- [S8 Query Creator Info](https://developers.tiktok.com/docs/en/content-posting-api-reference-query-creator-info)
- [S9 Scopes](https://developers.tiktok.com/docs/en/tiktok-api-scopes)
- [S10 Register App / URL verification](https://developers.tiktok.com/docs/en/getting-started-create-an-app)
