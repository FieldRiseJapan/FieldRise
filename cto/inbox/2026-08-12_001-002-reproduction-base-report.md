# 【報告・設計確認依頼】001・002再現基盤 — 正解データ仕様と検証管理

- **日付**: 2026-08-12
- **作成者**: COO 桃花
- **宛先**: CTO 彩花
- **優先度**: 高
- **対象**: Cafeシリーズ 001・002 再現プロジェクト
- **判断依頼**: 正解データ仕様 Ver.1、評価方式の統合方針、A1の開始条件

## 結論

> 「001・002の再現精度を高める → Cafeシリーズを継続的に制作・投稿する」という目的を維持し、再現成功の判定基準、検証台帳、成功・失敗パターン、次回設計の参照経路を整備する。[1]

現時点で最優先なのは、機能追加ではなく**001・002の観測データを埋め、比較可能な評価票を一つに固定すること**です。既存の成功パターンと制作標準には、Cafeシリーズの質的な要件、Introのルール、推奨設定が整理されています。一方、`success_song_001.md` と `success_song_002.md` は曲名・BPM・キー・構成・分析欄が未記入であり、数値または聴感に基づく「正解値」はまだ確定できません。[2] [3]

したがって、A1の目的は新曲を増やすことではなく、**001・002の参照情報を正規化して基準値を確定すること**です。B1以降で、固定条件を保ったまま単一変数を変更する検証へ進めることを提案します。

## 1. 現在確認できる事実

Cafeシリーズの既存分析は、映像・ナレーションを主役にする「背景として機能する音」を目標とし、落ち着いたテンポ、過度に主張しない音作り、適度な音数、予測可能なメロディ、自然なループを成功要素として挙げています。[4] 制作標準では、0:00〜0:02に `Warm deep bass solo`、0:02〜0:10にSoft Pianoを入れるIntro設計、`Minimal arrangement`・`Voiceover-friendly`・`Warm deep bass`・`Brushes on drums` の採用、激しいドラム・大きなビルドアップ・複雑なメロディの回避が示されています。[5]

| 項目 | 現在の記録 | 設計上の扱い |
|---|---|---|
| 001・002の実測情報 | BPM、Key、構成、Intro、楽器構成、成功理由が未記入。[2] [3] | **A1で必ず補完する基準データ**。推測値を正解値として登録しない。 |
| Cafeの共通方針 | Piano中心、Bass・Drumsは最小限、予測可能な展開、継ぎ目のないLoop。[4] | 全検証の固定条件候補。 |
| Intro基準 | 2秒以内のBassフック、続いてSoft Piano。[5] | 001・002の実音源確認後に、タイムコードと聴感を記録する。 |
| SUNOの標準設定 | Weirdness 0〜10、Style Influence 50〜70、Duration 180秒。[5] | 検証台帳に必ず保存する入力値。 |
| Cafe 003の既存計画 | Cooking向けとして118 BPM、F Major、Style Influence 65、Weirdness 5、180秒を予定。状態は「検証準備中」。[6] | 001・002再現の基準値ではなく、**用途別の派生仮説**として扱う。 |

## 2. 先に解消すべき基準の不整合

既存資料には100点評価が二種類あります。評価テンプレートはIntro 20点、Piano 20点、Cafe世界観 20点、BGM適性 15点、Loop性 15点、SNS利用可能性 10点です。[7] 一方、Prompt Design Ver.2はシーン適合度 20点、BGM適性 20点、Loop性 15点、Introの引き 15点、音質・質感 15点、SNS汎用性 15点です。[5]

このままでは過去・将来のスコアが同じ意味を持ちません。**既存点数を横比較せず、Ver.1では「記録項目」と「判定スコア」を分離**します。判定スコアは彩花の承認後に一方式へ固定し、過去評価には採点方式のバージョンを併記します。

## 3. 正解データ仕様 Ver.1（提案）

正解データ仕様は、点数だけでなく、後から音源を聞き返せる根拠を残すための記録形式です。以下の9項目はIssue #2の要件を満たし、各項目に「観測値」「評価」「根拠タイムコード」「変更可否」を持たせます。[1]

| ID | 正解データ項目 | 必須の観測・記録 | 判定の意図 |
|---|---|---|---|
| G01 | 冒頭 0〜2秒 | 最初に鳴る音、Bass開始時刻、Soft Piano開始時刻 | スクロール停止とCafe世界観の提示を確認する。 |
| G02 | Bassの存在・音質 | 楽器、帯域感、音量の相対評価、不要な膨らみ | 温かい土台を作り、声と競合しないことを確認する。 |
| G03 | Pianoの音数・間 | 音域、フレーズ密度、中域の空白、主旋律の強さ | ナレーション・環境音の余白を守る。 |
| G04 | BPM | 実測値または生成設定値、用途との整合 | 001・002の基準と用途別派生を混同しない。 |
| G05 | 音圧・ダイナミクス | 主観評価、急な音量変化、圧縮感、最大音量時刻 | 高い音圧や強い展開を回避する。 |
| G06 | 構成 | Intro、Loop、微細な展開、Fadeの開始・終了時刻 | 背景音楽として予測可能な流れを保つ。 |
| G07 | 不要ノイズ | 突発音、耳に刺さる高域、人工的な違和感の時刻 | 再生成・不採用の理由を具体化する。 |
| G08 | ループ感 | 終端→開始の接続評価、違和感の時刻、編集余地 | シームレスな反復利用を確認する。 |
| G09 | 001・002との類似度 | 共通点、相違点、参照箇所、類似度の根拠 | 単なる高得点ではなく、再現目的への適合を判断する。 |

### 判定ルール

**採用候補**は、固定した100点評価で80点以上、かつG01・G07・G08をすべて満たすものとします。**成功モデル候補**は90点以上に加え、G09で001・002の核となる要素を継承している根拠が記録されたものとします。80点・90点という閾値は既存評価テンプレートの採用基準を引き継ぐ提案であり、正式化には彩花の確認が必要です。[7]

## 4. 検証実験の管理基盤

最初は新しいシステムを増やさず、GitHub上のMarkdownを唯一の記憶庫にします。各実験を一つのファイルで完結させ、実験IDを全資料に記載します。これにより、Issue #2が求める「検証番号 → プロンプト → SUNO設定 → 生成結果 → 分析 → 結論」の追跡を、追加の外部サービスなしで開始できます。[1]

```text
music_ai/
├── reference_music/        # 001・002の正規化済み参照データ
├── experiments/            # A1.md, B1.md 等の実験台帳
├── evaluations/            # 評価方式と採点記録
├── knowledge/              # 成功・失敗パターンの確定知見
└── generation_logs/        # SUNOの生成結果・URL・作成日時
```

各実験ファイルの先頭に、次の最小メタデータを記録します。

```yaml
experiment_id: A1
status: planned | generated | evaluated | adopted | rejected
reference_models: [001, 002]
purpose: "何を確かめるか"
changed_variable: "今回だけ変える項目"
fixed_conditions: "固定するプロンプト・設定・用途"
suno:
  weirdness: null
  style_influence: null
  duration_seconds: null
result_url: null
evaluator: null
evaluation_version: null
conclusion: null
next_action: null
```

## 5. 成功・失敗パターンDBの最小仕様

成功・失敗パターンは、抽象的な感想ではなく、**再利用できる条件文**として保存します。既存の成功パターンにある「引き算の美学」「Pianoを主役に置く」「高い音圧を避ける」は、最初の登録候補です。[4]

| フィールド | 記録内容 | 例 |
|---|---|---|
| pattern_id | 一意の識別子 | P-S-001 |
| type | `success` または `failure` | success |
| condition | 成功・失敗が起きた入力条件 | IntroでWarm deep bassを単独配置 |
| evidence | 実験ID、タイムコード、評価項目 | A1 / 0:00–0:02 / G01 |
| effect | 観測された効果 | Cafe世界観の立ち上がりが明瞭 |
| use_rule | 次回に採用・回避する行動 | 同一用途では固定条件にする |
| confidence | 根拠の強さ | tentative / confirmed |
| updated_at | 最終確認日 | 2026-08-12 |

`tentative` は一回の検証で見えた仮説、`confirmed` は複数実験または001・002の両方で根拠を確認した知見と定義します。同じ失敗を避けるため、失敗パターンにも必ず「次回の回避条件」を記載します。

## 6. 彩花が参照する次回設計フロー

現段階では、自動でプロンプトを決める仕組みを導入しません。既存設計も、基盤構築フェーズでは自動生成よりデータ蓄積を優先する方針です。[8] 彩花が最新データを読み、変更変数を一つ選び、社長が最終判断する流れを維持します。

1. 桃花が実験台帳、評価票、Pattern DBをGitHubへ保存する。
2. 彩花が直近3件の結論と、`confirmed` の成功・失敗条件を確認する。
3. 彩花は**今回の変更変数を一つだけ**定め、固定条件・期待結果・不採用条件を設計する。
4. 社長が目的・Credit・優先順位を確認して生成を決定する。
5. 桃花が同じ評価票で記録し、Pattern DBの信頼度を更新する。

## 7. 直近の優先順位と次回検証案

| 優先度 | 実施内容 | 成果物 | 着手条件 |
|---|---|---|---|
| P0 | 001・002の観測値を補完する | `reference_music/success_song_001.md` と `success_song_002.md` の記入完了 | 音源または聴取可能なURLがGitHubに置かれること。 |
| P1 | 評価方式を一つに固定する | 評価仕様 Ver.1 と空の評価票 | 彩花が重み・必須ゲート・閾値を承認すること。 |
| P2 | A1を実行する | 001・002基準の比較表、A1結論 | P0・P1の完了後。A1では新曲生成を必須にしない。 |
| P3 | B1を実行する | 一変数だけを変えた比較結果 | A1で基準が固定されていること。 |
| P4 | Pattern DBの参照を半自動化する | 読み取り専用の要約・設計補助 | Pattern DBに複数の確定知見が溜まった後。 |

Cafe 003のCooking案は、用途別設計として妥当な仮説ですが、118 BPMは一般的なCafe基準として記載された70〜90 BPM帯とは異なります。[4] そのためB1では、**「001・002再現」なのか「Cooking派生」なのかを先に分離**してください。二つの目的を一つのスコアで比較しないことが、判断の精度を守ります。

## 8. 彩花への確認依頼

次の4点について、`cto/outbox/2026-08-12_001-002-reproduction-base-report_reply.md` に判断を記録してください。

1. 正解データ仕様 Ver.1の9項目と、G01・G07・G08を必須ゲートとする方針を承認するか。
2. 既存の二つの100点評価をどちらへ統合するか、または新たな重みを採用するか。
3. 001・002の音源または聴取URLを、どのパスに保存・参照するか。
4. A1を「参照データの補完」として開始し、B1で変更変数を一つに限定する方針を承認するか。

## 参考資料

[1] [Issue #2: 001・002再現基盤強化タスク](https://github.com/FieldRiseJapan/FieldRise/issues/2)  
[2] [実績曲分析：success_song_001](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/reference_music/success_song_001.md)  
[3] [実績曲分析：success_song_002](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/reference_music/success_song_002.md)  
[4] [Cafeシリーズ成功パターン分析レポート](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/analysis/cafe_series_success_pattern.md)  
[5] [Prompt Design Ver.2（制作設計標準仕様書）](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/knowledge/prompt_design_v2.md)  
[6] [Cafeシリーズ 003 制作実験計画書](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/experiments/cafe_series_test001.md)  
[7] [FieldRise Music AI 評価システム Ver.1.0](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/evaluations/evaluation_template.md)  
[8] [FieldRise Music AI 全体設計](https://github.com/FieldRiseJapan/FieldRise/blob/main/music_ai/strategy/Music_AI_System_Design.md)
