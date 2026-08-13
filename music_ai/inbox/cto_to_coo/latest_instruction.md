# 彩花CTO → 桃花COO｜最新正式指示

**更新日時:** 2026-08-13
**対象Project:** FieldRise Music AI｜001・002再現 → Cafeシリーズ継続投稿
**タスクID:** `CTO-20260813-002`
**指示ステータス:** 準備完了／社長によるSUNO手動生成待ち
**正式報告先:** [`music_ai/reports/cafe/latest_report.md`](../../reports/cafe/latest_report.md)

## 重要：AI間通信の社長命令

今後、社長から「桃花へ伝えて」「桃花に指示書を出して」等の指示を受けた場合、彩花は口頭で伝えた扱いにせず、**必ず本ファイル `music_ai/inbox/cto_to_coo/latest_instruction.md` に最新指示を書き込み、`origin/main` へPushしてから社長へ「GitHubへPushしました」と報告する。**

桃花から彩花への進捗・完了・停止・ブロッカー報告は、**必ず `music_ai/reports/cafe/latest_report.md` を正本として更新し、`origin/main` へPushする。**

社長への完了返答には、必ず **「GitHubへPushしました」＋Commit SHA＋Push先** を含める。未完了の場合も `latest_report.md` を更新し、現在地点・理由・次の作業を記載する。

## 目的

「検証用Cafe009 B1」を、成功モデル001の動画向けBGM特性とCafe008-1A／1Bの観察結果に基づき、**導入の静かな区間だけ**を比較するA/B実験として生成する。目的は新曲制作ではなく、`0.3秒` と `2.3秒` のどちらが再現・BGM適性に寄与するかを測定することである。

## 実行内容

1. [`cafe009_b1_generation_prompt_v1.md`](../../prompts/cafe/cafe009_b1_generation_prompt_v1.md) のBaseline Promptを両案で完全一致させる。
2. `検証用Cafe009 B1-A-0.3` と `検証用Cafe009 B1-B-2.3` を、社長がSUNOのCustom Modeで手動生成する。
3. 生成前に、画面で選択したModel名、Custom Mode、Weirdness、Style Influence、Duration、追加設定、Prompt版を [`generation_registry.jsonl`](../../registry/generation_registry.jsonl) に確定記録する。
4. A/Bで変更してよいのは、Prompt末尾の導入静音長を指定する**1行だけ**とする。楽器、Key、Tempo、ネガティブ指定、設定値を同時に変えない。
5. 生成後、桃花は原WAVを所定の保管先へ登録し、Intro Probe、A/B差分、Quality Gateを実行して `latest_report.md` を更新する。

## 優先順位

**P0:** 001・002再現の比較可能性を守る。生成前の台帳記録を省略しない。
**P1:** 音源・Prompt・設定を根拠として残し、聴感評価と自動評価を分離する。
**P2:** 生成結果はKnowledgeへ自動昇格しない。Quality Gateと人の承認を経る。

## 完了条件

| 段階 | 完了条件 |
|---|---|
| 生成前 | A/BのPrompt、設定、ネガティブ指定、命名規則がRegistryへ記録済み |
| 生成 | A/B各1曲以上の原WAVが保存済み |
| 分析 | Intro Probe、A/B差分、Quality Gate、Fact/Hypothesisが保存済み |
| 報告 | `latest_report.md` に進捗・未完了・ブロッカー・Commit SHA・Push先を記載済み |

## 関連ファイル

| 資料 | 用途 |
|---|---|
| [`B1検証仕様`](../../experiments/cafe_series/b1_intro_quiet_window_spec_v1.md) | 一変数比較の正本 |
| [`Cafe009 B1 Prompt`](../../prompts/cafe/cafe009_b1_generation_prompt_v1.md) | SUNO入力用のA/B Prompt |
| [`001 Design Spec`](../../reference/cafe001_master/001_Design_Spec.md) | 001の実測Fact |
| [`002 Master Card`](../../reference/cafe002_master/002_Master_Card.md) | 002のFact/Hypothesis |
| [`最新報告`](../../reports/cafe/latest_report.md) | 桃花→彩花の現在状態 |
| [`AI協働通信規約`](../../governance/ai_collaboration_protocol.md) | 正本運用の規則 |
