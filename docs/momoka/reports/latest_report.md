# Project-001｜001・002再現解析システム 最終回帰検証 完了報告

**状態:** `final_regression_passed` / `ready_for_candidate_evaluation`
**対象:** Cafe 001・002の再現解析システム v1.1
**更新日時:** 2026-08-28（GMT+9）

> **正式結論:** 001・002の正本自己比較、構造化データ、比較図、Git差分、クラウド実行にすべて合格した。解析基盤は候補評価へ移行可能である。ただし、これは解析システムの一貫性の確認であり、候補曲の音楽的再現を証明するものではない。

## 最終回帰結果

| 項目 | 001 | 002 | 判定 |
|---|---:|---:|---|
| 重点区間 | 0〜2秒 | 0〜8秒 | プロファイル整合 |
| 自己比較スコア | 100.00 | 100.00 | 合格 |
| 時間軸再現度 `trajectory_distance` | 0.0000 | 0.0000 | 合格 |
| JSON／CSV／PNG | 生成・構文確認済み | 生成・構文確認済み | 合格 |
| クラウド回帰 | — | — | [成功][1] |

## 現在利用できる資産

| 資産 | 役割 | 状態 |
|---|---|---|
| [`fieldrise-cafe-reproduction-analysis`スキル](../../../skills/fieldrise-cafe-reproduction-analysis/SKILL.md) | 正本保護、候補登録、一変数検証、Fact/Hypothesis分離、Fender Studio引き渡しを標準化する。 | 利用可能 |
| [`cafe_reproduction_analyzer.py`](../../../tools/cafe_reproduction_analyzer.py) | 001・002別プロファイルで、帯域・Stereo・Onset・時間軸再現度を比較する。 | v1.1で検証済み |
| [`cafe_candidate_intake.py`](../../../tools/cafe_candidate_intake.py) | 候補音源・Suno設定・ハッシュ・変更変数をmanifest化する。 | 検証済み |
| [`cafe_stem_assist.py`](../../../tools/cafe_stem_assist.py) | Bass／Drums等の補助分離を行い、出力ハッシュを追跡する。 | 検証済み |
| [`Suno実験テンプレート`](../../../skills/fieldrise-cafe-reproduction-analysis/templates/suno_single_variable_experiment_manifest.md) | Prompt、Negative指定、Weirdness、Safe Zone、Style Influence、Strong、Durationを一変数実験として残す。 | 利用可能 |
| [最終検証詳細](../../../music_ai/analysis/cafe/2026-08-28_final_reproduction_system_regression.md) | 結果、証跡、未解決事項、次工程を記録する。 | 完了 |
| [彩花CTO向け引き継ぎ](../../ayaka/handover/2026-08-28_cafe_001_002_reproduction_handover.md) | 001／002別プロファイル、最初の一変数実験、候補提出条件を示す。 | 設計開始可能 |

## 001・002の運用判断

001は、Bass単独性、低域・倍音、Stereo幅、Piano、Drums・空間、全体、Loopの順に評価する。002は、Bass、伴奏の密度遷移、Piano、Drums、空間、全体、Loopの順に評価する。一回に変更する変数は一つだけとし、候補は必ず同じファイル形式・同じ解析条件で正本と比較する。

全体ミックスの数値だけで、特定楽器の不存在、クリック音の不存在、Loopの自然さを断定しない。これらは原DAWステム、音源分離補助、社長の聴取メモを組み合わせて追認する。

## 次の処理

次のSuno候補またはFender Studio書き出しを受領したら、`cafe_candidate_intake.py`で候補manifestを作成してから、001または002のプロファイルで解析する。WAV 48 kHz／24-bit／Stereoを優先し、MP3はスクリーニング用として扱う。候補設計は[彩花CTO向け引き継ぎ](../../ayaka/handover/2026-08-28_cafe_001_002_reproduction_handover.md)の`001-E01`／`002-E01`から開始する。

## 検証用010（001-E01）解析完了報告

**状態:** `evaluation_completed` / **最良候補:** 011

彩花CTOの検証指示（001-E01）に基づき、社長より受領したSuno候補曲2件（011, 012）の解析を完了しました。001正本の「0〜2秒のBass主体・中央定位」において、011が極めて高い再現性を示しました。

| 項目 | 011 (FofW7czy...) | 012 (7S7MZn4W...) | 001正本（参照値） |
|---|---|---|---|
| **0〜2秒構成** | **Bassのみ (成功)** | Bass + 微かなPiano | Bassのみ |
| **定位 (Stereo)** | **完全中央 (成功)** | やや広がりあり | 中央固定 (-32.40 dB) |
| **Piano導入** | 2.0s (正確) | 1.8s (先行) | 2.0s |

詳細な比較データ、FACT/HYPOTHESIS、および音響特性の評価は[011・012解析レポート](../../../music_ai/analysis/cafe/2026-09-06_011_012_001-E01_analysis_report.md)を参照してください。

## 彩花CTOへの次回提案（011/001-E02）

011で導入部の「構造（定位とタイミング）」が確立されたため、次の一変数検証では**「音色（倍音）」**の追い込みを提案します。

- **実験ID:** `001-E02`
- **目的:** Bassの低域重心をさらに深め、高域の倍音成分を抑制する。
- **変更点:** Promptに `sub-bass frequency focus`, `warm rounded tone` を追加。
- **固定点:** 011で成功した定位指定、タイミング指定、楽器構成、Negative指定をすべて継承。

彩花CTOは本報告を確認後、次回の検証用Promptを決定し、`latest_verification_prompt.md`を更新してください。


## GitHub反映

**解析基盤Commit SHA:** `9925badb0cd288db3b6888ce29c4864825ceab10`
**候補登録Commit SHA:** `c4c7fdf182061eb0d72081d0beaa9c9305c233fe`
**時間軸再現度Commit SHA:** `4bec35c45d0d364daf94dceef34f71e1fdded114`
**SunoテンプレートCommit SHA:** `8d810230b4df9ef566cb55a8aa5a77893fcc2dba`
**最終回帰成果Commit SHA:** `2f9b01dd64edf716c16d1f220a16ff9e141c58c9`（回帰証跡、詳細報告、入口更新、履歴バックアップ）
**Push先:** `origin/main`

## References

[1]: https://github.com/FieldRiseJapan/FieldRise/actions/runs/33115325713 "GitHub Actions — Cafe Reproduction System Regression #33115325713"

## LINE通知運用更新（2026-08-28）

### 完了状況

社長の指定どおり、必要な通知を毎朝7:00 JSTの「定時報告書」に限定しました。タスク完了時に個別LINEを送る `桃花 - タスク完了LINE自動通知` は停止し、同ワークフローの `LINE_TARGET_ID` 未設定による失敗実行およびGitHubからの失敗メールが新たに発生しない状態にしました。

### 原因と判断

`桃花 - タスク完了LINE自動通知` の直近失敗実行では、`LINE_CHANNEL_ACCESS_TOKEN` は参照されていましたが、`LINE_TARGET_ID` が空で、送信先を確定できず `send_failed` となっていました。送信先IDを推測してSecretへ登録することはせず、タスク完了通知そのものを停止する社長判断を適用しました。

### 維持する定時報告

`FieldRise AI秘書 - 定時報告` は有効なまま維持し、スケジュールを `0 22 * * *`（UTC）へ修正しました。これは毎朝 **7:00 JST** に相当します。定時報告ワークフローは `LINE_CHANNEL_ACCESS_TOKEN` を使用する既存のBroadcast方式で、毎朝の定時報告書をLINEへ送信します。RunaGirl8215ページURLも定時報告本文へ継続掲載します。

### 検証

`python3 automation/scripts/test_send_line_notification.py` と `python3 -m unittest tests/test_momoka_task_completion_notify.py` は成功しました。定時報告ワークフローの7:00 JST設定はmain上で確認済みです。タスク完了通知ワークフローはGitHub上で `disabled_manually` になっており、定時報告ワークフローは `active` です。

### Commit / Push

運用更新Commit SHAは `0e46c15dd801fec8cb34fe51f7e37a701a126a42` です。7:00 JST設定と正式報告を `origin/main` へPush済みです。GitHub上のタスク完了LINE通知ワークフロー停止は、GitHub Actions設定として `disabled_manually` を確認済みです。

### 未完了・ブロッカー

7:00 JSTの次回定時実行は、GitHub Actionsのスケジュール実行結果と社長のLINE受信端末で確認する必要があります。タスク完了時の個別LINE通知を将来再開する場合は、社長の明示承認と、送信先IDの安全な取得・Secret設定・1通の到達確認が必要です。

### 彩花CTOが次に確認するファイル

- `.github/workflows/daily-briefing.yml`
- `.github/workflows/momoka-task-completion-line-notify.yml`（停止済み）
- `docs/momoka/reports/latest_report.md`
- `automation/scripts/send_line_notification.py`


## yutakaeng GitHub実装資産調査（2026-09-08）

**状態:** `research_completed / integration_not_yet_started`

今回、yutakaengのオフラインOCR・図面レイアウト解析・Excel出力に関連するGitHub資産を調査した。推奨候補は、PaddleOCR/PP-Structureを警告セル専用の比較OCRとして評価すること、ocr_ensembleの複数前処理・複数OCR合意方式を候補確定ロジックへ応用すること、engineering-drawing-extractorとimg2tableから工業図面の罫線除去・セル境界・Excel出力の実装パターンを参照することである。LayoutParserとdocTRは将来の図面種類拡張用の比較候補、HURIDOCS PDF layout analysisは一般文書向けでDocker・重量級依存のためWindowsポータブル本体には非推奨とした。

詳細報告は[`yutakaeng_windows_validation/github_ocr_assets_research_20260908.md`](../../../../yutakaeng_windows_validation/github_ocr_assets_research_20260908.md)に保存した。導入前には各リポジトリおよびモデルのLICENSE、配布条件、依存モデルの利用条件を個別確認する。現時点では既存のRapidOCR・Tesseract・OpenCV・PyMuPDF・openpyxl構成を維持し、PaddleOCRを警告セル限定のベンチマークとして追加評価するのが安全である。

彩花CTO確認事項: ①PaddleOCR候補をオフライン評価するか、②追加モデル容量と処理時間を許容するか、③実図面の正解付きゴールドセットを追加提供できるか。

## yutakaeng GitHub実装資産統合（2026-09-08）

**状態:** `integration_verified / windows_build_pending`

PaddleOCR 3.7.0 / PaddlePaddle 3.3.1を警告セル専用のローカル候補として組み込み、RapidOCR・Tesseract・PaddleOCRの候補合意を追加した。PaddleOCRモデルが同梱されていない場合は初期化せず、ネットワークへ接続しない。CPU推論は`enable_mkldnn=False`で実行する。ocr_ensembleの考え方を候補合意へ、img2tableの考え方をZT/Tブロックの罫線検出・除去へ反映した。

全回帰テスト、構文検査、GitHub資産アダプターテストに合格。実図面4ページでは、ZTブロック13行の主文字空欄が0行となり、主文字存在率13/13を確認した。ZT行の状態は読取済み8行、警告あり1行、セクション行等4行。生成Excelのシート構成は`概要, 0.5, 2, 3, 5, ZTブロック, 線サイズ判別不明, 線サイズ未記載`。

Windows CIにはPaddleOCR依存、モデル取得、PyInstaller同梱、モデル存在検査、GitHub資産テストを追加した。次の作業は差分確認、コミット、GitHub Actions Windowsビルド、成果物ZIPの整合性検査である。


## APIキー／認証情報調査報告（2026-09-12）

**状態:** `investigation_completed / no_plaintext_keys_detected`

FieldRiseリポジトリの現行ファイルおよびGit履歴を調査し、APIキー・認証情報の実値がコミットされていないか確認した。

### 調査結果

- 現行ファイルおよびGit履歴から、既知形式のOpenAI、GitHub、AWS、Google、Slackの実キーは検出されなかった。
- PEM形式の秘密鍵も検出されなかった。
- GitHub Actionsのワークフローから、以下のSecret名が参照されていることを確認した。実値はGitHub側で非表示のため、取得・掲載していない。
  - `OPENAI_API_KEY`
  - `MANUS_API_KEY`
  - `TIKTOK_CLIENT_KEY`
  - `TIKTOK_CLIENT_SECRET`
  - `TIKTOK_REFRESH_TOKEN`
  - `INSTAGRAM_ACCESS_TOKEN`
  - `INSTAGRAM_USER_ID`
  - `META_ACCESS_TOKEN`
  - `YOUTUBE_API_KEY`
  - `YOUTUBE_CLIENT_ID`
  - `YOUTUBE_CLIENT_SECRET`
  - `YOUTUBE_REFRESH_TOKEN`
  - `LINE_CHANNEL_ACCESS_TOKEN`
  - `LINE_TARGET_ID`
- GitHub Secret ScanningアラートのAPI取得は、現在のGitHub連携権限では403となり、アラートの有無を独立には確認できなかった。
- GitHub Actions Secretの実値一覧も、現在の権限では取得できなかった。

### 彩花CTOへの結論

リポジトリへAPIキーの実値を直接コミットした形跡は、今回の調査範囲では確認されなかった。一方、GitHub Actionsには外部サービス用の認証情報がSecretとして参照される構成がある。Secretの有効性・ローテーション要否・Secret Scanningアラートの最終確認は、GitHub管理権限で実施する必要がある。

### 調査対象・制約

- 対象: `FieldRiseJapan/FieldRise` の現行追跡ファイル、Git履歴、`.github/workflows/`
- 非対象: GitHub Actions Secretの実値、GitHub管理画面上のSecret Scanningアラート詳細
- キー値・トークン値は安全上、報告ファイルおよびGitHub Issueへ記載していない。

### GitHub反映

コミットSHA: `3d7b22f39b7a98ea6eb6671e33ec8d8fcf8564a9`

Push先: `origin/main`（Push成功）


## SNS API・Secret・権限 現状調査報告（2026-09-12）

**完了ステータス:** `investigation_completed / no_plaintext_keys_detected / posting_not_implemented`

彩花CTOの指示書 [`docs/momoka/instructions/2026-09-12_sns_api_investigation.md`](../../instructions/2026-09-12_sns_api_investigation.md) に基づき、現行の `origin/main` を取得して、リポジトリ内のAPIキー実値、Git履歴、GitHub ActionsのSecret参照、SNS分析・投稿関連コードを確認した。SNSへの実投稿、OAuth認証、Secret変更は実施していない。

### 1. APIキー実値の調査結果

現行追跡ファイルとGit履歴を既知形式で検索した結果、OpenAI、GitHub、AWS、Google、Slackの実キー、およびPEM形式の秘密鍵は検出されなかった。APIキー、アクセストークン、Refresh Tokenの実値は報告書にも記載していない。GitHub Secret ScanningアラートとActions Secretの実値一覧は、現在のGitHub連携権限では403となり、独立確認できない。このため、実値が存在しないことを保証するものではなく、今回の結論は「確認可能なリポジトリ範囲では平文キーを検出しなかった」である。

### 2. Secret名と参照箇所

| サービス | 現在確認できるSecret／設定名 | 主な参照箇所 | 用途・現状 |
|---|---|---|---|
| OpenAI | `OPENAI_API_KEY` | `.github/workflows/ayaka-production-prompt.yml`, `.github/workflows/openai-api-key-test.yml`, `tools/momoka_execution_name.py` | API呼び出し・疎通確認。実投稿とは無関係。 |
| TikTok | `TIKTOK_CLIENT_KEY`, `TIKTOK_CLIENT_SECRET`, `TIKTOK_REFRESH_TOKEN` | `.github/workflows/daily-briefing.yml`, `automation/social_analytics/scripts/collect_tiktok.py` | OAuthトークン更新と分析取得。投稿処理は確認できない。 |
| Instagram / Meta | `INSTAGRAM_ACCESS_TOKEN`, `INSTAGRAM_USER_ID`, `META_ACCESS_TOKEN` | `.github/workflows/daily-briefing.yml`, `automation/social_analytics/scripts/collect_instagram.py` | Instagram Graph APIの分析取得。Content Publishing処理は確認できない。 |
| YouTube | `YOUTUBE_API_KEY`, `YOUTUBE_CLIENT_ID`, `YOUTUBE_CLIENT_SECRET`, `YOUTUBE_REFRESH_TOKEN` | `.github/workflows/daily-briefing.yml`, `automation/social_analytics/scripts/collect_youtube.py` | YouTube Data API／Analytics APIのチャンネル・動画分析取得。動画アップロード処理は確認できない。 |
| LINE | `LINE_CHANNEL_ACCESS_TOKEN`、`LINE_TARGET_ID` | `.github/workflows/daily-briefing.yml`, `automation/scripts/send_line_notification.py` | 定時報告通知。SNS投稿APIではない。タスク完了個別通知ワークフローは停止済み。 |
| Manus | `MANUS_API_KEY` | `.github/workflows/momoka-auto-notify.yml` | Manus受領・通知連携。SNS投稿APIではない。 |

`YOUTUBE_CHANNEL_ID` はSecretではなく、ワークフロー内の公開チャンネル識別子として設定されている。その他、`TIKTOK_API_KEY`、`INSTAGRAM_API_KEY` などを参照する旧来の分析コードも存在するが、現行の `daily-briefing.yml` が注入する主要Secret名とは一致しないため、整理または廃止判断が必要である。

### 3. 各SNSの実装・権限・不足項目

| SNS | 実装状況 | 必要API・権限の整理 | 現在の実装ファイル | 不足項目・申請 |
|---|---|---|---|---|
| TikTok | 一部実装（OAuth更新・分析取得） | TikTok Content Posting API。投稿には投稿権限、ユーザー認可、審査・アプリ設定が必要。 | `automation/social_analytics/scripts/collect_tiktok.py`, `.github/workflows/daily-briefing.yml` | Content Posting APIの投稿エンドポイント、動画アップロード・公開フロー、投稿結果保存、審査・認可確認が未実装。 |
| YouTube | 一部実装（Data／Analyticsの分析取得） | YouTube Data API v3。動画アップロードにはOAuth 2.0の適切なスコープ（通常 `youtube.upload`）とチャンネル認可が必要。 | `automation/social_analytics/scripts/collect_youtube.py`, `.github/workflows/daily-briefing.yml` | 動画アップロード、タイトル・説明・タグ・公開設定、投稿ID保存、再試行・重複防止が未実装。APIプロジェクト設定とOAuth同意画面の確認が必要。 |
| Instagram | 一部実装（Graph APIの分析取得） | Instagram Graph API / Content Publishing。Professionalアカウント、Facebook連携、投稿権限、メディアコンテナ作成・公開の認可が必要。 | `automation/social_analytics/scripts/collect_instagram.py`, `.github/workflows/daily-briefing.yml` | Reels／画像／動画のメディアコンテナ作成・公開、公開結果保存、アカウント種別・権限確認が未実装。 |

### 4. 現在の関連ファイル

調査対象の中心は、`.github/workflows/daily-briefing.yml`、`.github/workflows/api-health-check.yml`、`.github/workflows/openai-api-key-test.yml`、`automation/social_analytics/scripts/collect_tiktok.py`、`collect_youtube.py`、`collect_instagram.py`、`automation/social_analytics/scripts/generate_report.py`、`automation/social_analytics/scripts/send_line.py`、および `automation/scripts/send_line_notification.py` である。既存成果物は主としてSNS分析レポートとLINE定時報告であり、自動投稿の本体ではない。

### 5. 推奨アーキテクチャ

`曲完成 → 動画生成 → キャプション／ハッシュタグ生成 → GitHub Actions → SNS API投稿 → 投稿結果保存 → GitHub記録` の順に分離する。投稿ジョブはプラットフォーム別アダプター、共通メディアメタデータ、冪等キー、Secret注入、失敗時の再試行、投稿ID・URL・時刻・レスポンス要約の非機密ログを持つ構成にする。アクセストークンやRefresh Tokenはログ・Artifacts・レポートへ出力しない。

ChatGPT／Astraは投稿文、キャプション、ハッシュタグ、審査要件の整理を担当し、桃花はGitHub Actions、Secret参照、投稿ジョブ、結果記録、監査証跡を担当する。実投稿とOAuth認証の開始は、社長の明示承認後に限定する。

### 6. 次の優先順位

1. 投稿対象のSNS、アカウント種別、動画形式、公開設定を確定する。
2. 各SNSの開発者アプリ、OAuth同意、審査、必要権限を管理画面で確認する。
3. 投稿処理を実装する前に、dry-run、入力検証、冪等性、Secret非出力テストを追加する。
4. 最初は非公開または限定テスト用の1本で投稿フローを検証し、結果保存とGitHub記録を確認する。
5. 承認後にのみ本番スケジュールと自動公開を有効化する。

### 7. ブロッカーと次に必要なもの

ブロッカーは、GitHub Secretの実値・Secret Scanningアラートへの権限不足、各SNS開発者アプリの審査・OAuth設定情報、投稿対象アカウントと公開ポリシーの未確定である。次に必要なのは、各SNSのアプリ設定・承認済み権限、テスト用アカウントまたは非公開投稿方針、動画保存先とメタデータ仕様、社長によるOAuth認証・実投稿の明示承認である。これらが揃うまで、投稿機能の実装・有効化・実投稿は行わない。

### 8. GitHub反映

この調査結果を本ファイルへ追記した。

調査報告追加コミットSHA: `d5e38f21d7abc86bfd1bf15086c105b708a4f0f5`

SHA確定更新コミットSHA: `eee20efd4164ffd0140ce5f5b8bd684dcd2cefb2`

Push先: `origin/main`（Push成功）
