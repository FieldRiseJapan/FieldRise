# Project-001｜Cafe 001再現検証 作業台帳

**正式指示書:** [2026-08-15_project001_reproduction_verification.md](../instructions/2026-08-15_project001_reproduction_verification.md)
**状態:** `in_progress`
**基準コミット:** `ff80b0299ad4302e7e6fc91246c5dfc72b7ab391`（作業開始前に`origin/main`と一致を確認）
**検証対象:** 001を固定Master、002を比較対象とする。
**目的:** 001の観測値をFactとして固定し、候補曲の生成条件を一変数ずつ検証できる再現システムへ整理する。

> **現時点の結論:** 001 Masterの0〜2秒、Bass、Piano相当の伴奏導入、Drums・Vocalの相対的な非前面性について、既存正本から再利用可能な測定Factを確認した。一方、001との再現差分を測るための、由来・生成Prompt・SUNO設定が結び付いた候補曲音源はGitHub上で確認できない。したがって、本台帳ではMasterの基準値を固定し、候補音源が到着するまでは**再現合否を主張しない**。

## 1. 正本・資産確認

| 確認項目 | 結果 | 区分 | 根拠 |
|---|---|---|---|
| 001 Master | `music_ai/reference_music/audio/001_reference_main.flac` | FACT | 48 kHz、Stereo、222.400秒。元Main SHA-256は`b62e1f5cf0e8bdbe7ee72a4e9b5a083722f39a2d396cb7a3d68297b5909a8006`。 |
| 正本整合 | 001の分離4ステムはStudio Mainを相関1.000000、SNR 151.91 dBで再構成 | FACT | 001参照仕様。 |
| 002の位置付け | 002は正規Main登録済みであり、比較対象として使用可能 | FACT | 002参照仕様および正規Main検証記録。 |
| A1の固定候補 | Bassの早期立ち上がり、Intro低域主導、Intro Drums非前面化、Vocal非主成分 | FACT → 固定候補 | A1および既存ステム実測。 |
| B1の唯一の変更変数 | その他／伴奏の導入時刻 | FACT | 001は2.299秒、002は0.255秒。 |
| 再現候補音源 | 音源の由来、生成Prompt、SUNO設定に紐付くA1/B1候補曲は未確認 | FACT | リポジトリ上には001・002正規Main、比較用002 stem mix、用途未紐付けのWAVのみ。 |

## 2. Phase 1｜0〜2秒 Bass導入の固定値

| 測定対象 | 001 Master・ステムから確認した値 | 区分 | 検証時の扱い |
|---|---:|---|---|
| Bass初回Onset | 0.464秒 | FACT | 候補曲では、Bassが0.5秒未満に存在するかを別測定する。 |
| 0〜2秒 Bass低域比率（20〜180 Hz） | 98.73% | FACT | 001型Introの低域主導の基準値。 |
| 0〜2秒 Bass RMS | -26.85 dBFS | FACT | 同じ測定条件で候補曲と比較する補助値。 |
| Full mix持続信号開始 | 約0.4267秒 | FACT | Main全体の値であり、BassステムOnsetとは混同しない。 |
| 0〜2秒 Full mix Low比率 | 98.46% | FACT | 001正規Mainを同一手法で再計測した相対比較値。 |
| 0〜2秒 Full mix High比率 | 0.08% | FACT | 導入で高域を過多にしない根拠。 |
| その他／伴奏初回Onset | 2.299秒 | FACT | 0〜2秒にPiano／Keys等を前面化しない001型の参照。楽器名は未確定。 |
| Drums | Intro RMS -58.70 dBFS | FACT | IntroでDrumsを前面化しない根拠。 |
| Vocal | 全体RMS -108.55 dBFS | FACT | 主旋律Vocalを主成分にしない根拠。ただし分離残差の可能性がある。 |

### 0〜2秒に関する判定

> **Fact:** 001の0〜2秒は低域が強く支配し、Bassステムの初回Onsetは0.464秒である。既存の測定では、伴奏ステムは2.299秒、IntroのDrumsはBassより大幅に低い水準である。[1] [2]

> **Hypothesis:** 「0:00からBass」と記述するだけでは生成音源にBassが出ない可能性がある。解決策は文言の強化であると仮定せず、候補曲ごとにBassの実在・開始時刻・0〜2秒低域比率を測定して判断する。[3]

> **未判定:** Bassの主観的な質感、アタックの聴感、クリック・金属音などの不要ノイズ、Pianoの実際の楽器名と音数は、タイムコード付きの人の聴取で確定する。

## 3. Phase 2〜5の実行設計

| 段階 | 固定するもの | 今回測るもの | 変更可能な主要変数 | 完了条件 |
|---|---|---|---|---|
| Phase 2: Bass | 001 Masterと解析条件 | Onset、RMS、低域比率、アタック・サステインの聴取所見 | なし | 候補曲との同一区間比較表があること。 |
| Phase 3: Piano／伴奏 | Bass条件、テンポ、音圧、Drums、Vocal | 導入時刻、音数、フレーズ長、休符、密度 | 導入時刻のみ | 001型2.299秒と002型0.255秒を混在させず記録すること。 |
| Phase 4: Drums／空間／Dynamics | 導入時刻以外のPrompt・設定 | Drums水準、帯域、ステレオ幅、残響、区間RMS、全体密度 | 未決定。次の一変数として設定 | 自動測定と聴取を分離して記録すること。 |
| Phase 5: 全体再現 | 個別検証で固定済みの項目 | 001との差分、Loop、ノイズ、投稿用途適合性 | Prompt版、設定、Negative指定の一組 | 生成Prompt、SUNO設定、Negative指定をセットで保存すること。 |

## 4. 既存A1／B1との整合

A1の「Bass onsetを0.5秒未満に置く」「IntroでDrumsを前面化しない」「Vocalを主成分にしない」という固定候補と、本検証のMaster測定値に矛盾はない。B1では伴奏導入時刻のみを001型の2.299秒または002型の0.255秒に変える方針が既に定義されている。したがって、Bassの未出現を解消する目的で、Piano導入、テンポ、Drums、音圧まで同時に変更してはならない。[2] [4]

## 5. 未完了・ブロッカー

| 項目 | 状態 | 影響 | 解消条件 |
|---|---|---|---|
| 001再現候補音源 | `blocked` | 001との再現差分、Bassの実在、Bass開始、ノイズ、全体再現を実測できない。 | 候補曲ファイルと、生成Prompt・SUNO設定・Negative指定・生成日時／IDを同じ実験IDで登録する。 |
| 001の聴取レビュー | `open` | Bass質感、Pianoの音数／休符、ノイズ、Loopの最終判定を自動値だけで確定できない。 | 0〜2秒、2〜10秒、10〜30秒、終端8秒のタイムコード付き聴取記録を作成する。 |
| 002の正式BPM | `open` | 001／002のテンポ差を固定条件にできない。 | 82〜83 BPMと123〜125 BPMをDAWグリッドで複数区間照合する。 |

## 6. 次の入力依頼

再現検証をPhase 2以降へ進めるには、001を再現したい**候補曲の音源**をGitHubに追加し、次のメタデータを同じ実験記録に紐付ける必要がある。

| 必須入力 | 目的 |
|---|---|
| 候補曲音源（WAVまたはFLAC） | 001 Masterとの同一条件比較。 |
| 生成Promptの完全本文 | 変更変数を一つに限定できているかの検証。 |
| SUNO設定 | Promptだけでは再現できない生成条件の固定。 |
| Negative指定 | 低域、Drums、Vocal、ノイズの差分原因を追跡。 |
| 実験ID・生成日時・版番号 | 結果と生成条件を一対一対応させる。 |

## 参照資料

[1]: [001参照仕様](../../../music_ai/reference_music/success_song_001.md)
[2]: [001・002ステム実測](../../../music_ai/analysis/cafe/2026-08-12_001-002-stem-measurement.md)
[3]: [Project-001 001再現検証 正式指示](../instructions/2026-08-15_project001_reproduction_verification.md)
[4]: [A1｜001・002正解データ取得](../../../music_ai/experiments/A1_001-002-ground-truth-capture.md)
[5]: [B1｜導入静音長 A/B検証仕様](../../../music_ai/experiments/cafe_series/b1_intro_quiet_window_spec_v1.md)
[6]: [001・002正規Main再分析](../../../music_ai/analysis/cafe/2026-08-15_001-002_canonical_main_reanalysis.md)
