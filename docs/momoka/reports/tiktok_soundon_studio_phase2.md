# TikTok × SoundOn公式音源連携 Phase 2 開発報告

2026-10-10 / 実装担当 GPT桃花 / 技術監督 GPT彩花（CTO）

## 1. 完了状況・未完了事項

**Phase 2 開発完了候補。Production反映・main変更・実投稿は禁止のまま。**

- 日本語のTikTok Studio移行ガイドに、写真投入→楽曲選択→アーティスト名検索→タイトル／長さ／ジャケット／SoundOnリリース照合→本人選択→下書き保存→再編集保持確認を表示。
- 検索キーワードは選択楽曲のアーティスト名を初期値とし、Runa-Girl8215を優先。ワンクリックコピー、失敗時の手動コピー案内。
- 投稿セットに `studioSound` を追加。検索キーワード、想定タイトル・アーティスト・時間、ジャケット／リリース識別メモ、観察したタイトル・アーティスト・時間、状態、確認者、最終確認日時、本人照合、下書き再編集保持と日時、備考を保存。
- 状態を未確認／候補あり／確認済み／不一致／利用不可で区別。タイトル一致だけで自動確定しない。1〜3分割リリースと複数候補の本人選択をガイドへ明記。
- 確認済みには本人の実照合チェック、タイトル・アーティスト・秒数一致、ジャケット／リリース根拠、確認者／日時が必要。0:59と00:59は秒数比較で一致。根拠未取得・候補を区別できない場合は候補あり等で保持。
- 下書き保持は照合確認済み・再編集確認日時が必要。複製時は照合状態・確認者／日時・本人照合・下書き保持をリセットし、元セットを変更しない。
- 不一致／利用不可は準備完了と継続判定を拒否。未確認／候補ありも準備完了とは表示しない。確認済みを選択するだけでは不正・不足記録の検証に通らない。
- Studio本人照合は既存の配信識別照合 `music.match` と別記録。ISRC・SoundOn ID・TikTok ID・公式音源URLや音源根拠を自動補完／上書きしない。Studio照合のみで配信識別や印税を確認済みにしない。

未完了：新UIのWindows操作確認、全曲の利用可否、音源ID／ISRC等の実識別対応、収益計上、API音源指定。TikTok下書きAPI取得・自動投稿・収益計算は実装していない。

## 社長の実機検証事実（今回コードの自動テストとは別）

2026-10-10、PC版TikTok Studio、ビジネスアカウント Runa-Girl8215。写真投稿の楽曲選択を利用でき、アーティスト名検索で複数曲が表示された。cafe検索は同名・類似名が多く、アーティスト名優先が見つけやすいとの社長確認。

cafe / Runa-Girl8215 / 00:59 を選択し、写真投稿下書きを保存、再編集でも当該曲が表示された。社長の正式指示書では公式配信楽曲の選択・下書き再編集時の保持を実機確認済みとする。公開投稿なし。

この事実を他の全楽曲、音源ID／ISRC対応、一般的な商用利用許可、印税発生、API指定成功へ拡張しない。初期マスターは推測で確認済みへ変更していない。

既存ZIPのJPG3枚・展開・900×1200・正常表示・保存セット10件一覧／ID維持の社長PASS記録を維持。ただし今回の新UIを社長実機確認済みとはしていない。

## 2. 変更ファイル

- automation/sns_auto_posting/tiktok/photo/batch.mjs（任意照合記録の検証・保存）
- automation/sns_auto_posting/tiktok/photo/page.mjs（ガイド操作・保存／復元・安全判定・未保存変更検出）
- automation/sns_auto_posting/tiktok/photo/index.html（日本語ガイドと本人入力欄）
- automation/sns_auto_posting/tiktok/photo/workflow.mjs（複製の再確認）
- automation/sns_auto_posting/tiktok/photo/tools/local_tool.py（診断基準Commit更新）
- tests/test_tiktok_photo_studio_sound.mjs（9件追加）
- tests/test_tiktok_photo_ui.mjs（1件追加）
- docs/tiktok-photo/release_diagnostics.json（17診断・8静的ファイルSHA-256）
- docs/tiktok-photo/windows_validation.md（新UI確認手順）
- docs/momoka/reports/tiktok_soundon_studio_phase2.md（本報告）
- docs/momoka/reports/latest_report.md（入口更新）

## 3. データ・SHA-256整合性

JSON v6へ任意のstudioSoundフィールドを後方互換追加。v1〜v6読込を維持し、旧セットに架空の照合記録を追加しない。既存ID・写真メタデータ・投稿文・音源スナップショットを維持。マスターとStudio照合、Creator StudioセットとTikTok下書きは別管理。画像本体の永続保存なし。

読込は既存データに書き込まない。セットの新規／更新は既存の保存ガードとatomic保存を利用。失敗時やインポート競合時の保護テストを回帰実行。社長PCの10件そのものを操作・照合したとは報告しない。

release_diagnostics.jsonの8静的ファイルSHA-256を実ファイルと照合して全一致。HTMLはtextContentで入力を表示し、自由入力の型・長さ・秘密値パターン・日時・時間を検証。CSP／外部通信制限を維持。Git差分・構文・既知Secretパターン検査PASS。検査は完全な脆弱性不在の保証ではない。

## 4. Commit・Push

開始時Working Tree clean、最新基準HEAD `d0931ac38a79b3f5e871b9b13b45b86483cfa0c5`。他作業の追加差分なし、巻き戻しなし。

実装Commit: `8d660fd944619f9fbfdfc01a221c9471722a1f08`。専用ブランチ反映・fetch・Git tree一致を確認済み。報告／手順は後続Commitに保存し、最終SHAはGit履歴と最終回答で提示。

Push先: https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-global-english

## 5. テスト結果・ブロッカー

| テスト | 実行結果 | 区分 |
|---|---|---|
| Node写真・英語・データ・UI・音源照合／既存API・YouTube | 93/93 PASS、FAIL 0、SKIP 0 | Linux Node。写真84、YouTube画面8、MP4 APIラッパー1（内部9 Mockケース） |
| Python実画像・起動ツール・アイコン | 7/7 PASS、FAIL 0、SKIP 0 | Linux/Pillow実画像・ZIP、Windows操作ではない |
| 静的HTTP・CSP・MIME・Secret等診断 | 17/17 PASS | Linux loopback HTTP |
| 8静的ファイルSHA-256 | 全一致 | 実ファイル照合 |
| 新UIWindows／TikTok実操作 | NOT TESTED（担当） | Windows直接アクセスなし。社長の既確認事実のみ別記録 |

追加10件：アーティスト優先／5状態、同名分割・異アーティスト・異時間・根拠不足の拒否、下書き保持条件、保存再読込、旧v1〜v6、複製リセット、破損入力／秘密値拒否、ガイドと外部投稿通信なし、未確認等の準備完了拒否、検索コピーとUI保存復元。

Mockは実TikTokの商用音源許可や保持状態を証明しない。新UIのWindows確認と識別情報・全曲利用許可の未確認が残る。Production公開へは進まない。

## 6. 社長が次に確認する操作

1. 既存JSONを退避して修正版をローカル起動。既存セットの件数／ID／文章を確認。
2. 使用予定曲を選び、検索キーワードをコピー。TikTok Studioで本人が検索し、分割候補をタイトル・アーティスト・秒数・ジャケット・SoundOnリリースで比較。
3. まず候補ありでメモを保存→再読込→セットを開き復元確認。根拠未取得なら確認済みにしない。
4. 実照合した場合だけ確認者・ISO日時・ジャケット／リリース根拠と観察情報を入力し本人チェック。検証後に「変更を保存」。
5. TikTokの下書き保存・再編集は本人が操作し、保持を再確認した場合だけチェックと日時を入力。Creator Studioの保存とは別。
6. セット複製で照合／下書き確認が未確認へ戻り、元記録が維持されることを確認。

実投稿、下書き削除、main反映、Production／Pages変更、SoundOnリリース変更、課金なし。公開判断は社長の別途承認まで保留。
