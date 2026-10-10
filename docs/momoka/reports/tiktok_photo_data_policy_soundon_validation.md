# 投稿データ管理方針・SoundOn公式音源検証報告

2026-10-10 / GPT桃花 / feature/tiktok-photo-global-english

## 1. 判定・方針反映

**今回の調査・開発工程は完了候補。公式音源識別・利用条件・収益対象は未確認。Production反映不可。**

[正式データ管理方針](../../tiktok-photo/data_management_policy.md)を作成。投稿完了を社長が確認した後のJSONバックアップは必須ではない。下書き・予定・失敗・状態不明・音源未照合は保持。投稿後の自動出力・自動削除・保存期間決定・データ初期化は行わない。

JSON出力欄へ任意運用を明記。既存の記録削除確認文から「バックアップ済み」の必須表現を除き、明示的な選択削除確認は維持。削除方式を新設したわけではなく、実データの削除操作も一切実施していない。

## 2. 投稿完了判定・必要最小限修正

調査で下書き音源保持が未確認でも準備完了になり得る不足を確認。UIの現在判定と準備完了／投稿予定への遷移で、本人の下書き再編集保持確認を必要とした。旧JSONは破壊的に移行せず、過去の保存記録は保持して再編集時に再確認する。

投稿済みセットの変更、および公開URL・日時付き投稿記録の保存／更新時は、社長本人がTikTok上の公開完了を確認したか明示ダイアログで確認。取消はデータ不変。下書き・予定・不明を完了としない。本人申告であってAPIによる投稿成功証明ではない。

既存のセット状態変更・複製、投稿記録保存／更新／確認付き削除、確認付きセット削除で、保存前に配列を変更して成功通知する経路を調査し、既存のatomic保存方式へ揃えた。保存成功後に画面内データを更新し、容量不足等は元データとID・確認記録を維持。新しい削除機能・自動整理・外部通信は追加していない。

既存楽曲マスター・識別情報は変更なし。正式投稿先はRuna-Girl8215と運用文書に明記し、URLと投稿先を本人が確認する。公開先アカウントのAPI自動検証は未実装。保存の失敗時は画面に未保存と再試行を表示。

## 3. 公式音源照合状況

| 独立確認項目 | 現状 |
|---|---|
| Runa-Girl8215検索で候補表示 | 社長実機確認済み |
| cafe / Runa-Girl8215 / 0:59選択 | 社長実機確認済み |
| TikTok下書き保存・再編集で当該音源保持 | 社長実機確認済み |
| 対象SoundOnリリース・ISRC・音源ID／公式URLとの識別一致 | 未確認 |
| ビジネスアカウントで当該用途・地域・掲載形態に利用可能 | 未確認 |
| 写真投稿によるSoundOn収益対象・計上 | 未確認 |

タイトル・アーティスト・時間・ジャケット・リリース・取得可能なIDと公式音源URLを比較し、1〜3分割の同名候補を社長が識別する。未取得情報は推測入力しない。検索・選択・保持から、配信一致や収益発生を自動確定しない。

## 4. 公式情報の調査（2026-10-10）

TikTokのビジネス公式ヘルプは、CMLを商用利用向けに事前処理した音楽ライブラリとして説明し、一般の音楽ライブラリと区別している。オーガニック投稿・広告・ブランドコンテンツでも用途に応じた権利確認が必要で、別のライセンス音源の利用では適切なライセンス確認を案内している。

SoundOn公式FAQの検索取得結果では、商用音楽ライセンスへの参加は任意登録で、対象資格・権利条件があると説明されている。このFAQページはブラウズopenで本文を抽出できず、検索取得範囲の確認である。SoundOn配信済みという事実だけで当該cafeのCML参加・利用条件を確定できない。地域・用途・対象リリースの登録条件を本人の管理画面で確認する必要がある。

一般の制度説明を、当該アカウントや楽曲の契約・権利の審査結果とは扱わない。設定変更・配信変更・サポート送信は実施していない。

公式参照（取得日2026-10-10）：

- [TikTok Business：About the Commercial Music Library](https://ads.tiktok.com/resources/help/article/commercial-music-library?lang=en) — 本文取得。
- [TikTok Support：Commercial use of music](https://support.tiktok.com/en/business-and-creator/creator-and-business-accounts/commercial-use-of-music-on-tiktok?lang=en) — 検索取得。openはリダイレクト先取得不可。
- [SoundOn公式FAQ：getting started](https://www.soundon.global/knowledge/faq?group=getting_started&lang=fr) — commercial music licensingの検索取得範囲。ページ本文抽出不可。

調査結論：選択できたcafeについて、CML／対象用途の条件・リリース識別対応・写真投稿の収益対象を実データで確認するまで未確認を維持。CMLの一般説明だけでSoundOn印税を保証しない。

## 5. ワークフロー・残存リスク

画像中心PC完結、アーティスト優先検索、本人音源選択、下書き再確認、別途公開判断を維持。JPEG／PNG／WebPの形式・容量・枚数検証、比率・順序・切抜・ZIP、5状態、照合根拠、複製リセット、旧JSON v1〜v6は既存回帰テストで確認。

社長実機PASS（過去の対象Commit）：ローカル起動、ブルー、STEP 2コピー、Runa-Girl8215正確コピー、cafe選択と下書き保持、JPG3枚ZIP／Windows展開／各900×1200／正常表示、10件一覧・ID維持。今回の修正版全操作を社長実機確認済みとするものではない。

未検証：今回の新しい完了確認・保存失敗表示のWindows操作、EXIF方向のブラウザ変換、出力EXIF／位置情報全削除、すべての形式・比率・切抜結果のWindows確認、既存10件全フィールドの実JSON一致、識別一致・商用条件・収益対象。写真本体は保存しないので再編集時に元写真が必要。

## 6. 実行テスト

| 対象 | 実測結果 | 範囲 |
|---|---|---|
| Node | 99/99 PASS、FAIL 0、SKIP 0 | 写真90、YouTube画面8、MP4 APIラッパー1（内部9 Mockケース） |
| Python | 7/7 PASS、FAIL 0、SKIP 0 | Linux実画像fixture・ZIP、起動診断、アイコン |
| 診断 | 17/17 PASS | Linux loopback HTTP・CSP・MIME・参照・構文・既知Secretパターン |
| SHA-256 | 8/8静的ファイル一致 | release_diagnostics.jsonと実ファイル照合 |
| 差分・文書 | PASS | whitespace・相対リンク・既知Secretパターン |
| 今回修正版Windows | NOT TESTED（担当） | 直接アクセスなし |

追加5件は、下書き保持なしの準備完了拒否、社長投稿完了確認の取消・容量失敗・自動出力なし、保持未確認警告、投稿記録の本人確認と保存失敗原子性、複製／既存確認付き削除の保存失敗保護。テストfixtureは業績・実投稿の証拠ではない。

## 7. 変更ファイル

- automation/sns_auto_posting/tiktok/photo/index.html
- automation/sns_auto_posting/tiktok/photo/page.mjs
- automation/sns_auto_posting/tiktok/photo/workflow.mjs
- automation/sns_auto_posting/tiktok/photo/tools/local_tool.py
- tests/test_tiktok_photo_ui.mjs
- tests/test_tiktok_photo_set_safety.mjs
- tests/test_tiktok_photo_studio_sound.mjs
- docs/tiktok-photo/release_diagnostics.json
- docs/tiktok-photo/data_management_policy.md
- docs/tiktok-photo/windows_validation.md
- docs/momoka/reports/tiktok_photo_data_policy_soundon_validation.md
- docs/momoka/reports/latest_report.md

## 8. Commit・Push

基準・開始HEAD `1e6d74b2c981c51a24035c17102e99897c295626`、Working Tree clean、リモートの追加変更なし。基準への巻き戻しなし。

実装Commit `7ef7c2fbfad98188a1053fbba21f2fb6331808f1` はブランチ反映・fetch・tree一致確認済み。文書は後続Commitに保存し、最終SHAはGit履歴・最終回答に記載。

Push先：https://github.com/FieldRiseJapan/FieldRise/tree/feature/tiktok-photo-global-english

## 9. 社長が次に確認する操作

1. 任意で作業データを退避し、同じOriginの修正版を起動。保存データを初期化しない。
2. 下書き保持が未確認なら準備完了にならず、画像ZIPは保存できることを確認。投稿済み変更の確認ダイアログを取消し、ID・件数不変を確認（実投稿不要）。
3. SoundOnの対象リリース画面で、正式名・バージョン／分割・ジャケット・ISRC／楽曲ID・TikTok配信先を確認。取得できた値だけ照合記録へ入力。
4. TikTok候補の公式音源URL・音源ID・時間・アーティスト等と比較し、対応を識別。対象用途・地域・CML等の利用条件を本人の管理画面で確認。不明ならSoundOn／TikTokへ本人が確認し、回答根拠を保存する（担当から送信しない）。
5. 当該写真投稿の収益対象は別途公式条件・実績で確認。今回の工程は実投稿を必要条件にせず、収益未確認を保持する。

Production・Pages・main変更、アカウント設定変更、SoundOnリリース変更、実投稿・予約投稿、実データ削除、課金なし。公開は社長の別途承認まで保留。
