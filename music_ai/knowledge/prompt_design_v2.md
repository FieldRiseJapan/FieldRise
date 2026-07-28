# FieldRise Music AI: Prompt Design Ver.2 (制作設計標準仕様書)

## 1. Prompt Designの基本理念
FieldRise Music AIにおける「良い曲」とは、単体で感動を与える曲ではなく、**「動画クリエイターが最も使いやすい音」**である。
- **最高の脇役:** 映像とナレーション（声）を主役とし、その魅力を120%引き出すための背景音を設計する。
- **感覚から再現性へ:** ヒット曲の「なんとなく良い」をデータとロジックで分解し、最小のCreditで最大の価値を生む制作を行う。

## 2. 制作前チェックリスト
生成前に以下の項目を定義し、設計に矛盾がないか確認すること。
- [ ] **使用目的:** 誰が、何の動画で使うか？
- [ ] **想定シーン:** Cooking, Focus, Morning, Nightのどれか？
- [ ] **感情設計:** 視聴者にどのような気分（安らぎ、集中、清々しさ）を与えたいか？
- [ ] **BPM設定:** シーンに合致しているか？ (80 or 120)
- [ ] **Intro設計:** 2秒以内のBassフックが組み込まれているか？
- [ ] **声との共存:** ナレーションを入れる隙間（中域の空き）があるか？
- [ ] **ループ性:** 始まりと終わりが自然に繋がるか？

## 3. Scene別プロンプト設計

### A. Cooking Cafe (料理・ASMR向け)
- **目的:** 調理音（焼く、切る）を引き立て、工程を軽快に見せる。
- **推奨BPM:** 115-120 (Walking Tempo)
- **楽器:** Crisp Piano, Light Brushes, Acoustic Guitar.
- **プロンプト例:** `Upbeat walking tempo, crisp acoustic piano, light brushes on drums, minimal arrangement, voiceover-friendly, space for ASMR sounds.`

### B. Focus Cafe (勉強・作業向け)
- **目的:** 思考を邪魔せず、集中状態（フロー）を維持させる。
- **推奨BPM:** 80-85 (Heartbeat Tempo)
- **楽器:** Mellow Electric Piano (Rhodes), Soft Upright Bass.
- **プロンプト例:** `Steady rhythmic pulse, mellow electric piano, soft upright bass, no sudden changes, minimal melody, focus-oriented atmosphere.`

### C. Morning Cafe (朝活・ルーティン向け)
- **目的:** 清潔感とポジティブな「始まり」を演出する。
- **推奨BPM:** 110-115
- **楽器:** Bright Piano, Warm Bass, Subtle Shaker.
- **プロンプト例:** `Bright morning sunlight atmosphere, warm acoustic bass, simple piano melody, positive yet calm, non-intrusive.`

### D. Night Cafe (夜・リラックス向け)
- **目的:** 一日の疲れを癒やし、深いリラックスへ誘う。
- **推奨BPM:** 70-75
- **楽器:** Deep Bass, Reverb-light Piano, Smooth Saxophone (Subtle).
- **プロンプト例:** `Deep night relaxation, low warm bass, soft emotional piano, slow tempo, cozy atmosphere, minimalist jazz.`

## 4. SUNO AI 設定推奨値
- **Weirdness (0-100):** `0-10`
  - 理由: Cafeシリーズは「王道」であるべき。奇をてらう必要はない。
- **Style Influence (0-100):** `50-70`
  - 理由: プロンプトの指示を確実に守らせつつ、AIの自然な音楽性を活かす。
- **Duration:** `180s (3分)`
  - 理由: TikTok利用（15-60秒）を前提としつつ、YouTube作業用BGMとしての汎用性も確保。

## 5. 必須・禁止ワード集

### 必須ワード (Must Include)
- `Minimal arrangement`: 音の密度を下げ、隙間を作る。
- `Voiceover-friendly`: ナレーションとの共存をAIに意識させる。
- `Warm deep bass`: 冒頭のフックと土台の安定感。
- `Brushes on drums`: 刺さる高音を排除。

### 禁止・回避ワード (Avoid)
- `EDM / Strong Drums`: 激しすぎてBGMの枠を超えるため。
- `Large build-up`: 急な音量変化は視聴者の集中を削ぐ。
- `Complex melody`: 映像の主役（声）と競合してしまう。

## 6. Intro設計ルール (2秒の法則)
- **0:00〜0:02:** `Warm deep bass solo`
  - 目的: スクロールする手を止め、瞬時にジャンルを提示する。
- **0:02〜0:10:** `Enter soft piano melody`
  - 目的: 世界観へ没入させ、視聴維持率を高める。

## 7. 評価基準 (100点満点)
1. **シーン適合度 (20点):** 狙ったシーンで違和感なく流せるか。
2. **BGM適性 (20点):** ナレーションや環境音を邪魔していないか。
3. **ループ性 (15点):** 繋ぎ目が自然か。
4. **イントロの引き (15点):** 最初の2秒で「おっ」と思わせるか。
5. **音質・質感 (15点):** 耳に心地よいアナログ感があるか。
6. **SNS汎用性 (15点):** 様々な動画に使い回せるか。

## 8. 次世代生成プロセス
1. **市場分析:** TikTok等のトレンドを確認。
2. **利用シーン決定:** 誰の、どんな瞬間のための音かを定義。
3. **Prompt Design:** 本仕様書に基づき、プロンプトを構築。
4. **SUNO生成:** 最小のCreditで実行。
5. **評価・ログ:** 100点評価を行い、ログへ記録。
6. **Knowledge更新:** 新たな発見をデータベースへ統合。

---
**知識資産管理:** FieldRise Music AI (桃花)
**最終更新:** 2026年7月28日
