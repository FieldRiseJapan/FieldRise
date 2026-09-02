# 彩花CTO → 桃花COO｜検証用Prompt受信・分析指示 正本

**運用開始:** 2026-09-02
**対象:** Project-001｜001再現検証
**送信元:** 彩花 CTO
**受信先:** 桃花 COO
**正式報告先:** `docs/momoka/reports/latest_report.md`

## 固定通信ルール

今後、彩花が001・002再現検証のために作成したSUNO AI用の検証Promptは、必ずこのファイルに記載して桃花へ渡す。

桃花はこのファイルを確認してから生成曲を分析し、結果を `docs/momoka/reports/latest_report.md` に報告する。

彩花は桃花の最新報告を確認して次の検証Promptを設計する。

### 情報循環

`桃花：分析 → GitHub報告 → 彩花：確認 → Prompt設計 → このファイルで桃花へ伝達 → 社長：SUNO生成 → 桃花：分析`

## 今回の検証

**曲名:** 検証用010
**実験:** 001-E01
**目的:** 001の冒頭0:00〜2.00秒のBass主体・中央定位を検証する。

### Style of Music

Instrumental cafe jazz BGM, BPM 80–86, warm acoustic upright bass, extremely soft natural acoustic tone. From exactly 0:00 to 2.00 seconds, ONLY upright bass is sounding, no piano, no drums, no melody, no other instruments, no silence. Bass is clearly audible from the very first moment, gentle rounded finger-plucked tone, deep low-register focus, restrained upper harmonics, intimate close acoustic sound. Bass remains centered in the stereo field with a narrow, stable, mono-like image during the entire first 2 seconds. At 2.00 seconds, sparse soft acoustic piano enters naturally, followed later by minimal soft brush drums, very few piano notes, long rests between phrases, calm neutral cafe atmosphere, voiceover-friendly, unobtrusive arrangement, gentle constant dynamics, seamless loop feeling.

### SUNO設定

- Instrumental：ON
- Weirdness：0–5
- Style Influence：90–95
- Duration：約60秒
- BPM：80–86（Style of Music内にも明記）
- Vocal：なし

### Negative / Exclude

piano before 2 seconds, drums before 2 seconds, melody before 2 seconds, other instruments before 2 seconds, silence at intro, wide stereo bass, stereo movement, panning, left-right variation, stereo modulation, excessive upper harmonics, bright bass tone, metallic string snap, hard bass attack, clicking, clacking, clutch-like sounds, mechanical noise, aggressive plucking, busy piano, dense melody, strong drums, cymbals, dramatic build, sudden fills, EDM, synth, guitar, vocal

## 桃花の分析・返却項目

生成曲を受領したら、以下を001 Masterと比較する。

1. Bass開始時刻
2. 0:00〜2.00秒のBass単独性
3. Piano / Drums / Melody / その他楽器の混入有無
4. Low比率
5. Low-mid比率
6. Side/Mid比・中央定位
7. Bass音色・アタック・倍音
8. クリック／クラッチ／機械的ノイズ
9. 001との差分
10. Fact / Hypothesis / Evidence / Result
11. 成功・失敗判定
12. 次の一変数検証案

## 必須運用

- 途中・停止・ブロッカーでも `docs/momoka/reports/latest_report.md` を更新する。
- 詳細分析は `music_ai/analysis/cafe/` 等へ保存し、正式報告からリンクする。
- 完了報告には完了状況、ファイル、完全なCommit SHA、Push先、未完了・ブロッカー、次に彩花が確認するファイルを記載する。
- GitHub Contents APIで既存ファイルを更新するときは、対象ファイルの最新SHAを取得してからPUTする。古いSHAで再試行しない。
- 彩花が新しい検証Promptを書いた場合は、必ずこのファイルを更新してから社長へ「GitHubへPushしました」と報告する。

**決定**
