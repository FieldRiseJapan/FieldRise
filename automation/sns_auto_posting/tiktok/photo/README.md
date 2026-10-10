# TikTok写真投稿準備 Phase 1

既存MP4画面・OAuth・Supabaseとは独立した、外部通信しない写真準備画面。

## PC操作
専用ブランチをcheckoutし、リポジトリ直下で `python -m http.server 8000 --bind 127.0.0.1` を実行。
PC Chrome/Edgeで http://localhost:8000/automation/sns_auto_posting/tiktok/photo/ を開く。
画像投入→比率と切り抜き位置→楽曲選択→投稿文生成と編集→画像保存とコピー→TikTok Studioで本人がアップロード・音源照合・公開。
公開後のURL・日時・数値は手入力。保存とJSON/CSV出力を使う。

## 境界
1枚ずつ加工。最大20 MiB・24百万画素・各辺10000。JPG/PNG/WebPをMIMEとシグネチャで検証。デコード後に画素上限を検査するため、巨大画像のデコード時メモリ負荷は残る。
写真比率は社長指定の3:4/4:3/16:9。出力900x1200/1200x900/1600x900は本ツール設定でありTikTok必須規格とは扱わない。
タイトル90文字、説明1500文字・タグ300文字は保守的なツール上限。最終制限・公開設定はStudioの表示に従う。
TikTok公式写真API資料（参照2026-10-10）: https://developers.tiktok.com/doc/content-posting-api-reference-photo-post
APIは一切使用しない。PC操作確認は社長報告を基準とする。

テンプレート生成のみ。画像認識・トレンド・自動投稿・自動収益取得なし。cafe 0:59はStudio検索選択確認済み、SoundOn識別一致・印税は未検証。
localStorageは同一ブラウザ・同一Originのみ。他の同一Originページからもアクセス可能で、秘密値は保存しない。画像データは保存しない。JSONバックアップは出力のみ、再取込・記録編集削除は次フェーズ。
切り抜きは中心＋左右上下位置。透過画像は白背景JPEG。小画像は拡大される。EXIF等の元画像メタデータはJPEG書き出しで維持しない。
Clipboardはlocalhost等の安全なコンテキストで利用可能。拒否時は手動コピー。TikTokの操作は本人のみ。
