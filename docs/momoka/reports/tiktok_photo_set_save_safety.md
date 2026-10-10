# FieldRise 投稿セット重複防止・保存操作安全化 改修報告

2026-10-10 / GPT桃花 / **改修完了候補・Windows確認待ち**

## 完了状況・原因分析

基準 `d63d747eca1f595062d029e8d66bb5316fa8de4f` から改修。旧新規保存は毎回新UUIDを作りsets.push(s)を実行し、同名確認や処理再入ガードがありませんでした。既存更新はID検索で別処理です。似た保存ボタン、編集対象IDの表示不足、古い通知が残る点も操作判断を難しくしていました。
**9件が作られた全操作経路は未確定で、社長の誤操作とは断定していません。** 共有JSONは9個の異なるID/作成日時を含みますが、クリック回数やイベント発生元を証明するログではありません。ユーザー申告「新規保存は1回」と区別して記録します。

## 修正内容

- 新規保存は名称の前後空白を除去。空名は拒否、同名なら件数を表示して保存保留。既存を自動上書きしません。
- 同名候補ごとに枚数/最終更新/ID付き「開く」操作を表示。別名保存または既存IDを選択できます。
- ボタンを「新規セットとして保存」「選択したセットを開く」「開いているセットの変更を保存」に変更。作業中保存ボタンは新規/既存に応じて表示変更。
- 編集対象名/保存済みID/更新日時、新規作成中、未保存変更、端末未保存を表示。既存一覧にもIDと更新日時を追加。
- 新規/更新は処理ロックで再入を拒否し、実行中の保存ボタンを無効化。新規の連続操作は同名ガードで二重追加せず、既存の変更なし再更新は書込しません。単なるボタン無効化だけに依存しません。
- 検証済みの次状態をlocalStorageへ書込成功してから画面内セットへ反映。失敗時は既存端末/画面内データ不変、編集欄は保持。新規/更新ボタンから明示再試行。
- 操作別通知をセット管理の近くにも表示。新規完了、読み込み完了（保存なし）、対象更新、同名保留、変更なし、保存失敗/端末未保存を区別。
- セット名だけの未保存変更でも別セット移動/ページ終了時に保護確認。名称だけで同一セット扱いせずID維持。

## 実データ保護の確認

共有 `fieldrise-photo-records.json` を非公開で読み取り、Linux Mockとデータ関数で検証しました。実データ原文/実ID/画像ファイル名をGitHubへCommitしていません。
1楽曲・0投稿記録・9セット、写真0枚5件/3枚4件、全下書き、同名称/異なるIDという指示書の事実と一致。
実JSONの正規化は全項目一致。新規初期状態への移行結果も全項目一致。改修UIの起動・同名保存保留・既存を開く操作は書込なし。JSON出力は元データと全項目一致。非公開メモリ上で写真3枚セット1件の説明を変更し更新、同ID/写真情報保持、残8件は全項目不変でした。原本ファイルはバイト不変です。
これは担当者のLinux検証であり、社長Windowsのストレージを書き換えたり整理した結果ではありません。9件の自動削除/統合/ID再採番なし。JSON v6・v1～v6読込、既存音源根拠・スナップショット・参照保持を維持。写真本体の非保存/再選択案内も維持。

## テスト結果

| 検証 | 結果 | 種類 |
|---|---|---|
| Node全体 | 81/81 PASS、FAIL0、SKIP0 | 写真/UI/英語/データ72 + YouTube8 + APIラッパー1 |
| MP4 API内部 | 9/9 PASS | 上のラッパー内、Mock、二重加算なし |
| Python | 6/6 PASS、FAIL0、SKIP0 | Linux画像/ZIP、起動診断、アイコン |
| 診断 | 17/17 PASS | loopback HTTP/MIME/CSP/構文/参照/Secret |
| 差分/Secret/実データID混入 | PASS | git diff --check、変更ファイル既知パターン/非公開ID検査 |
| 実JSON非公開検証 | PASS | 上記のデータ移行/9件保護/出力/対象更新、Linux Mock |
| 改修版Windows F5・Chrome再起動 | NOT TESTED | Windows直接アクセスなし |

新規6件の安全化テスト：既存9件の無変更/JSON互換、同名空白比較/候補表示、1操作1件/再入・連続クリック、読み込み書込なし/対象ID更新、容量失敗不変/再試行、新ページインスタンスの復元。処理中ボタン無効化と内部再入ガードも検査。
以前の容量失敗テストは「画面内セットへ先に追加して後から保存」期待を、今回の「保存成功前は追加しない・保存操作で再試行」へ更新。破損保護解除だけでは失敗した新規セットを勝手に作らず、再保存が必要です。
実行：node --test photo*.mjs / YouTube / MP4指定テスト、Python release_tools/real_fixtures/icon_consistency、local_tool.py diagnose。コード変更後の全回帰PASS、テスト強化後の安全化6件もPASS。

### 指示書12項目との対応

1 新規1操作1件、2 同名無警告追加なし、3 連続/再入防止、4 開くと件数不変、5 対象ID更新、8 JSON全保持、9 JSON互換、10 9件保護、11 保存失敗保護、12 写真3枚のメタデータ/文章保持：自動または非公開Linux検証PASS。
6 F5と7 Chrome再起動：Mock新ページ復元はPASS、改修版の実WindowsではNOT TESTED。旧版のF5保持は社長実機確認済みとして引き継ぎ、改修版保証へ転用しません。

## 変更ファイル

- automation/sns_auto_posting/tiktok/photo/index.html
- automation/sns_auto_posting/tiktok/photo/page.mjs
- automation/sns_auto_posting/tiktok/photo/tools/local_tool.py
- automation/sns_auto_posting/tiktok/photo/README.md
- tests/test_tiktok_photo_set_safety.mjs
- tests/test_tiktok_photo_storage_ui.mjs
- tests/test_tiktok_photo_ui.mjs
- docs/tiktok-photo/release_diagnostics.json
- docs/tiktok-photo/windows_validation.md
- docs/momoka/reports/tiktok_photo_set_save_safety.md
- docs/momoka/reports/latest_report.md

実装Commit：`9a8a3ecd317d20c226df4db10b1419d29be57894`。
Push先：`feature/tiktok-photo-global-english`。
https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-global-english
本報告追加後の最終Commitは最終応答とGitHub履歴へ記載します（自身のSHAはファイル内へ自己参照できないため）。

## 社長の最終確認・未解決事項

windows_validation.md先頭に改修専用の7操作を追加。バックアップ→9件のID付き一覧→写真3枚セットを開く（保存なし）→文章を更新（ID/件数維持）→同名保存保留→意図した別名1件保存/連続クリック→F5/Chrome再起動→JSON全保持を一括確認してください。確認中に既存9件を削除しないでください。問題時は非公開JSONと画面を保管して停止。
今回の9件生成の全経路は未確定。改修版Windows確認も残るため完成候補で、Production反映不可・公開判定CONDITIONALを維持します。Pages公開元/実音源利用可否等の前報告残条件も未解消です。
SoundOn公式音源情報と拒否条件を維持し、音源利用/印税を未確認のまま保証しません。
main Push・Production・Pages設定変更・TikTok/YouTube実投稿・課金・認証変更・既存データ無断整理：すべてなし。
