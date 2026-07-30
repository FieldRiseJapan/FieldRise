# FieldRise Music AI: Prompt Design Ver.2 (制作設計標準仕様書)

## 1. Prompt Designの基本理念
FieldRise Music AIにおける「良い曲」とは、単体で感動を与える曲ではなく、**「動画クリエイターが最も使いやすい音」**である。
- **究極の脇役:** 映像とナレーション（声）を主役とし、その魅力を120%引き出すための背景音を設計する。**Voiceover-friendlyを最優先**とする。
- **感覚から再現性へ:** ヒット曲の「なんとなく良い」をデータとロジックで分解し、最小のCreditで最大の価値を生む制作を行う。

## 2. 制作前チェックリスト
生成前に以下の項目を定義し、設計に矛盾がないか確認すること。
- [ ] **使用目的:** 誰が、何の動画で使うか？
- [ ] **想定シーン:** Cooking, Focus, Morning, Nightのどれか？
- [ ] **感情設計:** 視聴者にどのような気分（安らぎ、集中、清々しさ）を与えたいか？
- [ ] **BPM設定:** シーンに合致しているか？ (80 or 120)
- [ ] **Intro設計:** **静かな開始**が実現されているか？
- [ ] **声との共存:** ナレーションを入れる**十分な余白**（中域の空き）があるか？
- [ ] **ループ性:** 始まりと終わりが自然に繋がり、**長時間再生**に適しているか？
- [ ] **音量:** **一定の音量**で、聴き疲れしないか？

## 3. Scene別プロンプト設計

### A. Cooking Cafe (料理・ASMR向け)
- **目的:** 調理音（焼く、切る）を引き立て、工程を軽快に見せる。**Voiceover-friendlyを最優先**。
- **推奨BPM:** 115-120 (Walking Tempo)
- **楽器:** Soft Piano, Light Brush Drums, Warm Upright Bass.
- **プロンプト例:** `Quiet start, soft piano melody, light brush drums, warm upright bass with natural presence, minimal arrangement, voiceover-friendly, ample space for ASMR sounds, consistent volume, natural loop, long-time listening.`

### B. Focus Cafe (勉強・作業向け)
- **目的:** 思考を邪魔せず、集中状態（フロー）を維持させる。**Voiceover-friendlyを最優先**。
- **推奨BPM:** 80-85 (Heartbeat Tempo)
- **楽器:** Mellow Electric Piano (Rhodes), Soft Upright Bass.
- **プロンプト例:** `Quiet start, mellow electric piano, soft upright bass with natural presence, no sudden changes, minimal melody, focus-oriented atmosphere, consistent volume, natural loop, long-time listening.`

### C. Morning Cafe (朝活・ルーティン向け)
- **目的:** 清潔感とポジティブな「始まり」を演出する。**Voiceover-friendlyを最優先**。
- **推奨BPM:** 110-115
- **楽器:** Soft Piano, Warm Bass, Subtle Shaker.
- **プロンプト例:** `Quiet start, soft piano melody, warm bass with natural presence, simple and calm, non-intrusive, consistent volume, natural loop, long-time listening.`

### D. Night Cafe (夜・リラックス向け)
- **目的:** 一日の疲れを癒やし、深いリラックスへ誘う。**Voiceover-friendlyを最優先**。
- **推奨BPM:** 70-75
- **楽器:** Deep Bass, Reverb-light Piano.
- **プロンプト例:** `Quiet start, deep bass with natural presence, soft emotional piano, slow tempo, cozy atmosphere, minimalist jazz, consistent volume, natural loop, long-time listening.`

## 4. SUNO AI 設定推奨値 (v4/v5対応)
- **Weirdness (0-100):** `0-5` (Extremely Safe Zone)
  - 理由: Cafeシリーズは「究極の脇役」であるべき。不協和音や予期せぬ展開は徹底的に排除するため、値をさらに下げる。
- **Style Influence (0-100):** `80-95` (Very Strong)
  - 理由: プロンプトの指示（静かな開始、余白、一定の音量など）をAIに確実に守らせるため、高めに設定する。
- **Duration:** `180s (3分)`
  - 理由: TikTok利用（15-60秒）を前提としつつ、YouTube作業用BGMとしての汎用性も確保。
- **Audio Influence:** (Audio Upload使用時のみ) `60-80`
  - 理由: 成功モデルのメロディラインを継承しつつ、新しいバリエーションを生むためのバランス値。

## 5. 必須・禁止ワード集

### 必須ワード (Must Include)
- `Voiceover-friendly`: ナレーションとの共存をAIに意識させる。最優先。
- `Quiet start`: 楽曲の導入を静かにし、視聴者の集中を妨げない。
- `Soft piano melody`: 柔らかく、主張しすぎないピアノの旋律。
- `Warm upright bass with natural presence`: 低音は自然な存在感に留め、目立たせない。
- `Minimal arrangement`: 音の密度を下げ、十分な余白を作る。
- `Consistent volume`: 一定の音量を保ち、聴き疲れを防止する。
- `Ample space / Comfortable silence (rest)`: 音の隙間を確保し、ASMRやナレーションとの共存性を高める。
- `Natural loop / Long-time listening`: 長時間再生に適した構造。
- `Light brush drums`: 刺さる高音を排除し、柔らかいリズムを刻む。

### 禁止・回避ワード (Avoid)
- `目立ちすぎるイントロ / Strong hook`: 視聴者の注意を引く要素は排除。
- `派手な展開 / Large build-up / Dramatic changes`: 急な音量変化や盛り上がりは集中を妨げるため禁止。
- `感情を押し付ける演出 / Emotional melody`: 特定の感情を強く喚起するメロディは避ける。
- `EDM / Strong Drums / Aggressive sounds`: 激しすぎる音はBGMの枠を超えるため禁止。
- `Complex melody / Intrusive melody`: 映像の主役（声）と競合するため禁止。

## 6. Intro設計ルール (新基準)
- **目的:** 視聴者の集中を妨げず、動画の世界観に自然に溶け込む「静かな導入」を実現する。
- **0:00〜0:05:** `Quiet start with soft ambient pad or very subtle, warm upright bass entry.`
  - 目的: 楽曲の存在感を最小限に抑え、動画の開始を邪魔しない。
- **0:05〜0:15:** `Gently introduce soft piano melody with ample space, maintaining consistent low volume.`
  - 目的: 静かに世界観へ没入させ、ナレーションやASMR音のための余白を確保する。

## 7. 評価基準 (100点満点) - 新基準
1. **Voiceover-friendly (25点):** ナレーションや環境音を全く邪魔しないか。中域のクリアさ、余白の適切さ。
2. **静かな開始 (20点):** 導入が静かで、視聴者の集中を妨げないか。目立つイントロがないか。
3. **長時間再生適性 (20点):** ループが自然で、一定の音量と穏やかな展開で聴き疲れしないか。
4. **Cafeシリーズらしさ (15点):** FieldRise Music AIのブランドイメージ（温かみ、洗練、ミニマル）に合致しているか。
5. **音質・質感 (10点):** 耳に心地よいアナログ感があるか。
6. **SNS汎用性 (10点):** 様々な動画に使い回せるか。

## 8. 次世代生成プロセス
1. **市場分析:** TikTok等のトレンドを確認。
2. **利用シーン決定:** 誰の、どんな瞬間のための音かを定義。
3. **Prompt Design:** 本仕様書に基づき、プロンプトを構築。
4. **SUNO生成:** 最小のCreditで実行。
5. **評価・ログ:** 100点評価を行い、ログへ記録。
6. **Knowledge更新:** 新たな発見をデータベースへ統合。

---
**知識資産管理:** FieldRise Music AI (桃花)
**最終更新:** 2026年7月30日
