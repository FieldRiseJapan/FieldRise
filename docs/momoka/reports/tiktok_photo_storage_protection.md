# Creator Studio 保存保護改修報告

## 原因・再現条件
基準 bcd0e375696fb70a5f5144055944ee370fe7717c。正常読込でも復旧ボタンが常時表示されるため、保護中との誤解が起きるUIでした。旧resumeStorageは保護を解除して画面内データをpersistするため、読込失敗後の初期値で元データを置換する危険がありました。旧storageWriteには別タブの更新比較がありませんでした。社長の実機で実際に読込エラーが起きた直接原因は未確定です。migrate成功・10件固有ID・12枚メタデータは社長報告として記録します。

## 修正
- 正常時は復旧ボタン非表示。書込失敗時は再試行、保護時は元データ退避・再検証を表示。
- 不正JSON、形式／バージョン不一致、保存領域アクセス拒否を安全な分類で表示。内部例外やデータを表示しません。
- 再検証は読み取りのみ。成功しても画面内の古いデータを書き戻さず、再読込を必要とします。不正な元データは保護を継続します。
- 各保存前に読込時の元文字列とlocalStorageを比較。変更があれば保存拒否。storageイベントで別タブ更新を警告。
- Chrome/EdgeのWeb Locksで同版の保存操作をタブ間直列化。ブラウザでロックが利用できない場合は保存を拒否。旧版タブはこのロックに参加しないため、適用時に必ず閉じます。
- セット・記録・JSON取込は端末書込成功後のみ採用。容量不足で元localStorageを維持。画像本体は保存しません。schemaVersion6・既存JSON仕様は変更しません。

## テストと制約
Node 104件、Python7件、静的診断18項目を実行。全件PASS、FAIL0、SKIP0。NodeはMockを含み、PythonはLinux実画像fixture検証を含みます。差分検査・Secretパターン検査PASS、静的9ファイルのSHA-256一致確認PASS。10セットは合成データのみ使用。実際の社長PC10件は取得・変更していません。提供バックアップSHA-256 C0AFF298394C17258F977F34364BC9341585F81ED67DD48738FDEB9C0D89FE97 は社長申告（実ファイルは未検査）。

Windows Chromeの今回版・実OS再起動・本物のWeb Locks二タブ競合は未検証。Mockテストを実機PASSにしません。旧タブ／拡張機能などロック非参加の書込に対する完全な排他保証はありません。

## 社長PCへ安全に適用
1. 既存バックアップ2本を保持。現在の未保存文章は退避。元画像は別保存。
2. Creator Studioの旧タブをすべて閉じ、ローカルサーバーを停止。新ブランチ版を別フォルダに展開（既存フォルダやChrome保存領域を削除しない）。
3. 同じChromeプロフィール、同じ http://127.0.0.1:8000/ と同じパスで新サーバーを起動。異なるOriginでは保存データは共有されません。
4. 強制再読込し、10セットの件数・ID・楽曲・メタデータと編集文章を確認。正常時は保存保護ボタン非表示。元画像を再選択。
5. 既存セットを開き、少量の変更を保存。ID・件数維持とF5復元を確認。
6. 二タブを開きAで更新後、Bで保存すると拒否されることを確認。Bの未保存内容を退避して再読込。実データで削除や初期化をしない。
7. 保護警告がある場合は元データを退避。再検証が失敗したら上書きせず停止し、警告分類を報告。JSON取込は形式確認・プレビュー・本人採用確認を経由。

## 変更ファイル・Git
page.mjs、index.html、storage.mjs、tools/local_tool.py、tests/test_tiktok_photo_storage_protection.mjs、tests/test_tiktok_photo_storage_ui.mjs、tests/test_tiktok_photo_release_tools.py、release_diagnostics.json、windows_validation.md、latest_report.md、本報告書。
専用ブランチ fix/tiktok-photo-storage-protection。Commit SHAはGit履歴と最終報告に記載します。

## 判定
開発完了候補／Windows再検証待ち。Production反映不可。main、Pages、Production、TikTok実投稿は変更していません。SoundOn情報の推測・変更、実データ削除、バックアップ削除はしていません。
