# 彩花CTO → 桃花COO｜検証用Prompt受信・分析指示 正本

**運用開始:** 2026-09-06
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

**曲名:** 検証用013
**実験:** 001-E02
**目的:** 検証用011で確立した0:00〜2.00秒のBass単独・中央定位・2.00秒Piano導入を完全に固定し、Bassの低域重心と倍音を改善する。

### Style of Music

Instrumental cafe jazz BGM, BPM 80–86, warm acoustic upright bass, extremely soft natural acoustic tone. Start the track immediately at 0:00 with one clearly audible, soft upright bass note. The first sound must be upright bass. From 0:00 to 2.00 seconds, keep the arrangement to upright bass only: no piano, no drums, no melody, no other instruments, and no silence. The bass should remain continuously present through the first 2 seconds with a gentle rounded finger-plucked tone, **sub-bass frequency focus, deep low-register focus, warm rounded tone, restrained upper harmonics, reduced bright upper-frequency character**, intimate close acoustic sound, centered in the stereo field with a narrow stable mono-like image. At exactly 2.00 seconds, allow sparse soft acoustic piano to enter naturally, followed later by minimal soft brush drums, very few piano notes, long rests between phrases, calm neutral cafe atmosphere, voiceover-friendly, unobtrusive arrangement, gentle constant dynamics, seamless loop feeling.

### SUNO設定

- Instrumental：ON
- Weirdness：0–5
- Style Influence：90–95
- Duration：約60秒
- BPM：80–86（Style of Music内にも明記）
- Vocal：なし

### Negative / Exclude

piano before 2 seconds, drums before 2 seconds, melody before 2 seconds, other instruments before 2 seconds, silence at intro, delayed bass entry, bass absent at 0:00, bass entering after the first sound, wide stereo bass, stereo movement, panning, left-right variation, stereo modulation, excessive upper harmonics, excessive high-frequency harmonics, bright bass tone, thin bass tone, sharp upper-frequency character, metallic string snap, hard bass attack, clicking, clacking, clutch-like sounds, mechanical noise, aggressive plucking, busy piano, dense melody, strong drums, cymbals, dramatic build, sudden fills, EDM, synth, guitar, vocal

## 013で変更する変数

**変更変数はBassの音色・倍音に関するPrompt wordingのみ。**

011で成功した構造条件を固定したまま、以下の語を追加する。

- `sub-bass frequency focus`
- `deep low-register focus`
- `warm rounded tone`
- `restrained upper harmonics`
- `reduced bright upper-frequency character`

定位、開始時刻、Bass単独区間、Piano導入時刻、BPM、Instrumental、Weirdness、Style Influence、Duration、その他のNegative指定は変更しない。

## 桃花の分析・返却項目

生成曲を受領したら、001 Masterおよび011と比較する。

1. Bass開始時刻
2. 最初に鳴った音の正体
3. 0:00〜2.00秒のBass単独性
4. Piano / Drums / Melody / その他楽器の混入有無
5. Bassが2秒間継続して存在するか
6. Low比率
7. Low-mid比率
8. Side/Mid比・中央定位
9. Bass音色・アタック・倍音
10. クリック／クラッチ／機械的ノイズ
11. 011との差分（特に低域重心・倍音・明るさ）
12. 001との差分
13. Fact / Hypothesis / Evidence / Result
14. 成功・失敗判定
15. 次の一変数検証案

## 必須運用

- 011で成功した構造条件を013でも固定し、音色・倍音以外の変更を行わない。
- 途中・停止・ブロッカーでも `docs/momoka/reports/latest_report.md` を更新する。
- 詳細分析は `music_ai/analysis/cafe/` 等へ保存し、正式報告からリンクする。
- 完了報告には完了状況、ファイル、完全なCommit SHA、Push先、未完了・ブロッカー、次に彩花が確認するファイルを記載する。
- GitHub Contents APIで既存ファイルを更新するときは、対象ファイルの最新SHAを取得してからPUTする。古いSHAで再試行しない。
- 彩花が新しい検証Promptを書いた場合は、必ずこのファイルを更新してから社長へ「GitHubへPushしました」と報告する。

**決定**
