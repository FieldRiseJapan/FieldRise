# FieldRise 海外市場向け英語投稿システム 統合改良報告

報告日：2026-10-10 / 実装：GPT桃花 Astra Work / 技術監督：GPT彩花CTO

## 1. 完了機能
開発版の新規投稿セットをEnglish標準へ変更。管理画面は日本語。日本語も選択可能で言語/スタイルをセット・記録に保存。6カテゴリは既存データの日本語キーを維持し、画面でFashion/Lifestyle/Cafe & Coffee/Travel/Interior/Otherと日本語説明を併記。
英語3候補はNatural/Emotional/Minimal。カテゴリ固有の表現、短め/標準/長め、英語内容入力、本人入力の雰囲気、投稿目的を反映。再生成は2種類のテンプレート群を切替。同一文面警告と文章履歴/再利用を維持。無限生成・AI分析・人気検索として表示しない。
タイトル、説明文単独、説明文+タグ、タグ単独、楽曲名をそれぞれコピー可能。生成で現在の文章を置き換える前に確認。言語切替は既存文章を保持し、旧言語候補のみ消去。新規開始は英語へ戻す。
楽曲名/アーティストを文章に含める任意設定を追加。通常の投稿目的では自動宣伝文を追加せず、楽曲紹介目的または明示チェック時に記載（短めは簡潔さを優先）。公式音源/人気/利用実績を未確認のまま主張しない。

## 2. 英語生成例
条件：Cafe & Coffee / 標準 / 内容 “Coffee by the window” / 日常を共有 / variant 0 / 楽曲記載OFF。
- Natural: Coffee by the window. Taking a little coffee break.
- Emotional: Coffee by the window. A warm cup and a moment to breathe.
- Minimal: Coffee by the window. Coffee. A quiet moment.
英語はローカルのテンプレート候補で、ネイティブ実読者による品質評価は未実施。写真内容に合わない表現は本人が編集する。短めでは入力の長い説明を省き、長めでは本人指定の雰囲気を補足する。
日本語自由入力は自動翻訳しない。日本語を英語本文へ直接混ぜず、英文内容が必要なら英文で入力するようUIに表示。日本語本文の元入力は保持。英語字幕に正式楽曲名が日本語の場合は正式表記を保持する。

## 3. ハッシュタグ例と規則
カテゴリ・限定入力キーワード（coffee/beach/forest/plants/outfit等）・雰囲気・紹介目的から最大6個。大文字小文字を無視して重複除去、英語タグに日本語タグを自動混在させない。
Cafe & Coffee / coffee / calm / ブランドONの例：
`#Cafe #CoffeeTime #Coffee #RelaxingMusic #FieldRise #RunaGirl8215`
アーティストタグは正式名からハッシュタグ用の英数字を抽出し、表示名そのものの置換はしない。ブランドは任意で、ON時はブランド/アーティストの枠を確保。無関係なトレンドタグ、人気保証なし。限定辞書で関連キーワードを選び、画像認識/意味解析ではない。

## 4. 変更ファイル
- automation/sns_auto_posting/tiktok/photo/workflow.mjs：英語候補/タグ、言語/スタイル/任意設定検証、CSV
- 同ディレクトリのpage.mjs / index.html：日本語UIと英語初期値、生成確認、コピー、保存/復元/再利用
- 同ディレクトリのdata.mjs / batch.mjs：JSON v6、旧言語既定、記録/セット項目
- 同ディレクトリのREADME.md、tools/local_tool.py：操作説明/診断基準更新
- docs/tiktok-photo/release_diagnostics.json / release_runbook.md / windows_validation.md：診断更新、社長実機報告の区別、v6復旧制約
- tests/test_tiktok_photo_english.mjs（新規）
- tests/test_tiktok_photo_ui.mjs / test_tiktok_photo_data.mjs / test_tiktok_photo_workflow.mjs / test_tiktok_photo_assist.mjs / test_tiktok_photo_storage_ui.mjs
- docs/momoka/reports/tiktok_photo_global_english_completion.md / latest_report.md

## 5. テスト結果
|範囲|結果|方式|
|---|---|---|
|写真/データ/英語/ワークフロー|55/55 PASS|Node単体・Mock UI/Clipboard/Image/Canvas/Storage|
|TikTok MP4 API|9/9 PASS|既存Mockサービス|
|YouTube画面|8/8 PASS|既存ローカルテスト|
|アイコン|2/2 PASS|Python unittest|
|Windows起動/診断ツール|2/2 PASS|Linux実HTTP、PowerShell静的検査|
|診断17項目|17/17 PASS|構文/CSP/HTML参照/静的資材HTTP/MIME等|
|Secret/差分|PASS|既知Secretパターン、git diff --check|
|英語版Windows実ブラウザ|NOT TESTED|ユーザーPCへの操作接続なし|
|ネイティブ読者での英語評価|NOT TESTED|テンプレートによる英文候補|

実行：node --test tests/test_tiktok_photo*.mjs tests/test_youtube_creator_studio.cjs supabase/functions/tiktok-creator-studio-api/api.test.mjs
Node集計64 PASS = 写真55+YouTube8+APIラッパー1（内部9件）。Python4 PASS = 診断2+アイコン2。
要件1–7：英語初期値/日本語切替、6カテゴリ/3スタイル/長さ/英語タグ/大小文字重複除去を確認。要件8–12：編集済み英語の単独/結合コピー、言語保存/復元、v1–v5の日本語文章保持、生成キャンセル、複製を確認。要件13–18：音源保護、ZIP成功/失敗案内、MP4/YouTube、診断、Secret/構文/差分の回帰PASS。

## 6. JSON互換性
JSON v6。v1/v2/v3/v4/v5読込を維持。言語未指定の旧セット/記録はja（日本語）として移行し、既存の文章/タイトル/タグ/音源根拠を変換しない。新しいセットはen。任意のブランド/楽曲記載設定、スタイルを保存。重複ID拒否/追加取込/破損保護/保存失敗復旧を維持。
言語を変えても既存文章はそのままなので、設定言語と手動文章が異なる場合がある。自動判定/翻訳しない。生成候補は選択言語、コピーは現在の編集欄をそのままコピー。旧アプリへのロールバック前にv6 JSONを退避しスキーマ互換性を確認する。

## 7. SoundOn公式音源保護
楽曲マスター、ISRC/SoundOn ID/TikTok ID、公式URL/根拠スナップショット、予定/履歴を維持。不一致/ビジネス利用不可の完了拒否、未確認理由、複製時の最終確認リセット、Studioで本人の音源選択を維持。英語生成は確認状態を変更しない。印税計算・予測・収益解析・グラフを追加していない。

## 8. Windows実機確認状況
社長提供の旧0838123系の実機確認：ローカルPythonサーバー起動、画面表示、写真3枚の読み込み/表示、投稿文コピー。GPT自身の実機操作ではない。PowerShellは実行ポリシーで拒否されPython直接実行で起動。
ZIPは保存ボタン位置確認済み、実ファイル保存/展開の正式記録は未確認。英語版での再検証・未確認の既存15項目を自動PASSへ変更していない。手順に英語版追加項目を記載済み。

## 9. Commit・Push
基準Commit：0838123cadbe43e2b948eb262fc33f2694dbf241
実装Commit：65ff006f7423cbd1995180aa0e66749314dea378
Push先：feature/tiktok-photo-global-english
https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-global-english
報告書は後続Commitに保存し、最終Commit SHAは完了返信に提示（自身のSHAを循環記入しない）。GitHub/ローカルツリー一致を確認。main/Production変更なし。

## 10. 未検証・残存リスク・次の確認
テンプレートと限定辞書のため、写真と文面の内容一致は本人が確認。候補は各スタイル2パターンで無限ではない。Native実読者評価、英語版のWindows/OSコピー/ZIP保存・展開、実音源一致/印税発生は未検証。
管理画面日本語と投稿言語を分離。既存日本語データを開いた際に英文へ自動変換しない。公開準備判定は引き続きCONDITIONAL。次の確認は英語版のWindows再起動・カテゴリ候補/コピー・言語保持・ZIP展開。
Production反映・外部公開・TikTok/YouTube実投稿/予約投稿なし。有料API/外部依存追加なし、OAuth/Supabase/既存YouTube Gateway/MP4 API変更なし。公開と実投稿は別途社長承認が必要。
