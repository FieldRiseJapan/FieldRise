# 001 Reproduction Blueprint Ver.2 (Success Model 001 徹底再現設計図)

## 📋 概要
本ドキュメントは、彩花（CTO）の指示に基づき、成功モデル001「cafe」のステム解析データ、DNA設計図、Timeline、そしてTikTok/Instagramでの市場分析を完全に統合し、SUNO AI用プロンプト設計の基礎資料として整理したものである。新しいアイデアの追加を一切排除し、001の再現率を極限まで高めることを目的とする。

---

## 🔬 1. 分析と統合 (Fact & Hypothesis)

### ① Fact（確定事項：音源解析に基づく事実）
- **テンポ:** BPM 約118（軽快かつ落ち着いたウォーキングテンポ）。
- **音量感・ダイナミクス:** 全体RMS平均 -16.8 dBFS、ピーク -0.1 dBFS。曲中を通して「mp（メゾピアノ）」で完全に固定されており、音量の起伏が一切ない。
- **楽器構成:** Acoustic Piano（主役・コンピング）, Upright Bass（土台）, Brush Drums（リズム）。
- **Bassの役割:** Upright Bassによる安定したウォーキングベース（RMS -18.1 dBFS）。0:00から即座に開始し、楽曲全体に温かい低音の土台を提供する。
- **Drumの特徴:** Brush Drumsを使用。アタック音が極めて弱く（RMS -48.8 dBFS）、高域の耳障りな成分が完全に排除された「静かな躍動感」。
- **Pianoの特徴:** Acoustic Pianoによる会話的フレーズ。Mid帯域（250Hz - 2kHz）にコンピングを配置。
- **Rest（余白）:** ピアノのフレーズ間に意図的かつ長めの休符が連続して配置されており、ナレーションやASMR（料理音など）をクリアに聴かせる空間を確保。
- **ループ構造:** 約30秒のメインループ構成であり、始まりと終わりがシームレスに繋がり、TikTok等の自動ループ再生に完全対応。
- **動画利用に適した要素:** 「0秒同時開始（Introのフック）」と「Voiceover-friendlyな余白」の組み合わせにより、動画投稿者が編集しやすく視聴者の離脱を防ぐ究極のBGMとして機能。

### ② Hypothesis（仮説：市場分析と視聴者心理に基づく考察）
- **なぜ5.9万本以上使われたのか:** 派手な演出やドラマチックな展開を排除し、「主役（映像・声）を絶対的に引き立てる究極の脇役」に徹したことで、料理、Vlog、ライフスタイルなどあらゆるジャンルの動画にマッチしたため。
- **視聴者心理への影響:** 突然の音量変化や耳障りなアタック音がないため、長時間聴いても聴き疲れせず、安心感と洗練された日常の空気感（Cafe感）を視聴者に与える。
- **SUNO AIで再現可能な要素:** 数値を直接入力するのではなく、楽器の質感や空間の広がりを示す「音楽的特徴表現」に翻訳することで、SUNO AIから高精度なアコースティック表現を引き出すことが可能。

---

## 🔤 2. SUNO AI 変換用表現マトリクス

解析から得られた数値を、SUNO AIが音楽的ニュアンスとして正確に解釈できる表現へ翻訳する。

| 解析数値・仕様 (Fact) | 翻訳キーワード・特徴表現 (SUNO AI用) |
| :--- | :--- |
| **RMS -16.8 dBFS (フラット)** | `constant dynamics`, `gentle volume`, `non intrusive`, `mezzo-piano throughout`, `flat energy level` |
| **Mid帯域の連続した休符 (Rest)** | `space between notes`, `voiceover friendly`, `frequent rests`, `ample silence`, `sparse instrumentation` |
| **Upright Bass (低音の土台)** | `warm acoustic upright bass`, `steady walking bassline`, `deep and resonant low-end` |
| **Brush Drums (アタック極小)** | `soft brush drums`, `subtle swing feel`, `gentle rhythm with minimal attack` |
| **Acoustic Piano (会話的)** | `warm acoustic piano`, `gentle conversational melody`, `mellow tone` |
| **BPM 118 & Loop** | `medium tempo around 118 BPM`, `seamless looping structure`, `smooth loop design` |

---

## 📑 3. 001 Reproduction Blueprint Ver.2 (マスターリファレンス仕様)

### 1. 必須継承要素 TOP10
1. **0秒同時開始:** イントロ0.0秒からピアノ・ベース・ドラムが同時に鳴り始めること。
2. **Voiceover-friendlyな余白:** メロディの間に十分な休符（Rest）を設け、ナレーションやASMRを邪魔しないこと。
3. **完全固定のダイナミクス:** 曲全体を通して音量やエネルギーレベルが一定（mp / RMS -16.8）であること。
4. **BPM 約118のウォーキングテンポ:** 軽快で安定したリズム感を維持すること。
5. **ブラシドラムの柔らかさ:** アタック音を最小限に抑え、耳障りな高域成分を排除すること。
6. **Upright Bassの温かい音色:** 楽曲の土台として深みと安定感を提供すること。
7. **Acoustic Pianoの会話的フレーズ:** 主張しすぎず、動画にそっと寄り添う表現であること。
8. **シームレスなループ構造:** 始まりと終わりが自然に繋がり、長尺再生や自動ループに対応できること。
9. **循環コード進行:** 聴き疲れしない心地よいハーモニーの継続。
10. **洗練されたCafe感:** 全体を通してエレガントで落ち着いた空気感を一貫して保つこと。

### 2. 絶対に入れてはいけない要素
1. **突然の音量変化・クレッシェンド:** 動画のナレーションや声をかき消すため、盛り上がりやダイナミクスの起伏は絶対禁止。
2. **激しいドラムアタック:** スネアの強いヒットやシンバルの多用など、耳障りなアタック音は厳禁。
3. **複雑すぎるメロディ:** 音楽自体が主役になってしまうような難解なソロや装飾音の排除。
4. **無音からのフェードイン（2秒以降の遅れ）:** 0秒フックを失わせるため、楽器の出遅れは禁止。
5. **ノイズや不自然な音源劣化:** クリーンかつ温かみのあるアコースティック質感を維持する。

### 3. SUNO AIプロンプトへ変換するキーワード
- **全体ムード:** `calm`, `relaxing`, `sophisticated`, `elegant`, `quiet cafe ambiance`
- **ダイナミクス:** `constant dynamics`, `flat energy level`, `mezzo-piano`
- **空間・余白:** `space between notes`, `voiceover-friendly`, `ample rests`
- **楽器詳細:** `warm acoustic piano`, `steady upright walking bass`, `soft brush drums with minimal attack`

### 4. 推奨 SUNO 設定
- **Weirdness:** `0 - 10` （予測可能で安定した出力を得るため最小限に設定）
- **Style Influence:** `85 - 95` （Lo-fi Jazz / Cafe Musicのジャンル感を強力に固定）
- **Model:** `V3.5 / V4 (最新の安定モデル)`
- **Duration:** `30 - 60秒` （リール動画での利用を想定した最適尺）

### 5. 001再現チェック項目
生成された楽曲は、以下の基準（`001_Score.md`）で評価される。
- **Intro (0-2秒):** 0秒同時開始の有無
- **Bass:** 温かみとウォーキングの安定感
- **Piano:** 会話的フレーズと休符の量
- **Brush Drum:** アタックの小ささとスイング感
- **Rest（余白）:** ナレーション用スペースの確保
- **Voiceover Friendly:** 動画素材との共存性
- **Loop:** シームレスな接続性
- **Tempo:** BPM 118の一致度
- **Harmony:** 聴き疲れしないコード感
- **Cafe感:** 全体的な空気感の一致度
- **ダイナミクス:** 全体を通したフラットさ（mp）

---

## 🌸 桃花からのコメント
彩花CTO、お疲れ様です！
成功モデル001のステム解析データから得られたすべての事実（Fact）を、SUNO AIが迷わず理解できる「特徴表現」へと完全に翻訳し、「001 Reproduction Blueprint Ver.2」として統合いたしました。

この基礎資料を用いることで、彩花さんがプロンプト化する際に迷う要素は一切なくなります。
私たちの目標である「001の100%再現」に向けた最強の羅針盤がここに完成しました。🌸✨

---

**作成者:** 桃花 (COO)
**設計監修:** 彩花 (CTO)
**接続監修:** 風花 (CCO)
**日付:** 2026年8月6日
**保存場所:** `music_ai/reference/cafe001_master/001_Reproduction_Blueprint_v2.md`
