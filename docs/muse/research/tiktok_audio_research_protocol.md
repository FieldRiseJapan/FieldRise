# TikTok音源分析・蓄積プロトコル v1
更新: 2026-11-09 JST / 所管: Muse・彩花CTO

## 毎回の収集順
1. 接続状態・最終同期日時・利用可能期間を確認する。
2. SoundOnの音源IDごとに期間と単位を固定して動画使用数・動画再生数を比較する。
3. Metricoolから自社TikTokのフォロワー、投稿別再生数、いいね、シェア、完視聴率、平均視聴時間、おすすめ経由流入を取得する。YouTubeは登録者、投稿別視聴、平均視聴時間を取得する。取得不能は null として扱う。
4. 第三者の音源使用動画は公開URLをサンプリングし、投稿日・ジャンル・地域の確認可能性・使用区間・動画反応を別途記録する。
5. 変化の要因は競合仮説（季節性、投稿者規模、プラットフォーム施策、外部トレンド）と比較する。
6. 制作変更は一度に一変数。Sunoのプロンプト、設定、音源バージョン、制作日、比較条件を記録する。

## データ辞書（非公開の集計保管先用）
| カラム | 意味 |
|---|---|
| observed_at_jst | 取得日時 |
| window_start, window_end | 集計期間 |
| platform, source | TikTok / YouTube / SoundOn / Metricool |
| account_or_track_id | 投稿者または音源の識別子 |
| content_id | 投稿ID（該当時） |
| metric_name, value, unit | 指標名、数値、単位 |
| data_scope | own_posts / third_party_sample / audio_usage / streaming |
| region_basis | クリエイター所在地・視聴者所在地・配信地域の区別 |
| provenance_url | 根拠URL |
| access_level | public / internal / restricted |
| quality_flag | verified / provisional / missing / inconsistent |
| hypothesis_id | 対応する検証仮説 |
| notes | 限界、欠損、収集条件 |

## 公開リポジトリ運用
- 公開可: 方法論、検証済み公開URL、集計定義、仮説、制作実験の匿名化された結果。
- 非公開: アカウントトークン、ログイン情報、内部の詳細売上、所有者限定分析の生データ、個人情報。CSVを公開GitHubへ直接投入しない。
- 週次報告の形式: 日付 / 対象音源ID / 新事実 / 前週比較 / サンプル数 / 反証 / 制作への示唆 / 次の検証 / 出典。
- 欠損値は0に置換しない。定義の異なる指標を合算しない。
- 初回Metricool同期前のゼロ応答は未取得として扱う。

## 関連文書
- [アルゴリズム分析の初版](../analysis/tiktok_audio_reuse_algorithm_2026-11-09.md)
- [Muse運用ガイド](../README.md)
- [Cafe再現解析基盤](../../../skills/fieldrise-cafe-reproduction-analysis/SKILL.md)

## 更新履歴
- 2026-11-09: 初版作成。音源再利用とおすすめ推薦を分離し、証拠・仮説・欠損の扱いを定義。
