# Cafe001 DNA設計図 Ver.1.1 (Fact & Hypothesis Separated)

## 📋 概要
本ドキュメントは、FieldRise Music AIの最高位知識資産として、TikTokで5.9万本以上利用された成功モデル001「cafe」を「音楽」ではなく「誰でも再現できる設計資産」として定義するものである。彩花CTOの指示に基づき、分析内容を**「確定事項（Fact）」**と**「推測・仮説（Hypothesis）」**に厳密に分離し、データ駆動型の改善基盤を構築する。

---

## 🎯 目的
成功モデル001の「なぜ良かったのか」を事実ベースで整理し、未確定な要素は仮説として検証対象とすることで、FieldRise Music AIが安定して「動画に選ばれるBGM」を生成するための究極の教科書とする。

---

## 🎼 成功モデル001 DNA分析

### ① 確定事項（Fact）
実際の分析・検証で確認できた、成功モデル001の揺るぎない事実。

*   **主役楽器:** Acoustic Piano (メロディ・コンピング主体)
*   **土台楽器:** Upright Bass (ウォーキングベース主体)
*   **リズム楽器:** Brush Drums (アタック音が弱い)
*   **テンポ:** BPM 約118 (軽快なウォーキングテンポ)
*   **構造的特徴:** Rest（余白）が非常に多い
*   **機能的特徴:** Voiceover Friendly (ナレーションや環境音を邪魔しない)
*   **ループ性:** 始まりと終わりが繋がり、ループ再生に対応可能

### ② 推測・仮説（Hypothesis）
現時点では分析から導いた仮説であり、今後の生成実験（Cafe 004以降）で検証・確定していくべき要素。

*   **導入部:** 0秒同時開始 (全楽器が0:00から完全に揃って始まるか)
*   **コード進行:** ii-V-I-vi (Gm7-C7-Fmaj7-Dm7) の循環進行であるか
*   **SUNO AI設定 (Style Influence):** 80〜95の範囲が最適か
*   **SUNO AI設定 (Weirdness):** 0〜10の範囲が最適か
*   **ダイナミクス:** 全体を通して「mp (メゾピアノ)」で完全に固定されているか

---

### ③ 秒単位一覧表（0:00〜0:30 代表ループ）
*※コード進行やダイナミクスは仮説に基づく。*

| 時間帯 | 楽器構成 (Fact) | 主役楽器 (Fact) | Bassの動き (Fact) | Pianoの動き (Fact) | Drumの有無 (Fact) | Rest（余白） (Fact) | ダイナミクス (Hypothesis) | コード変化 (Hypothesis) | 動画投稿者視点 (Fact) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **0:00-0:02** | Piano, Bass, Drums | 全楽器 | ウォーキング | メロディ開始 | Brush | 短い | mp | Gm7 - C7 | 0秒フック（世界観提示） |
| **0:02-0:05** | Piano, Bass, Drums | Piano | ウォーキング | 短いフレーズ | Brush | 多い | mp | Fmaj7 - Dm7 | ナレーション可（背景化） |
| **0:05-0:08** | Piano, Bass, Drums | Bass | ウォーキング | 休符 | Brush | 多い | mp | Gm7 | ナレーション可（背景化） |
| **0:08-0:11** | Piano, Bass, Drums | Piano | ウォーキング | 短いフレーズ | Brush | 多い | mp | C7 - Fmaj7 | ナレーション可（背景化） |
| **0:11-0:14** | Piano, Bass, Drums | Bass | ウォーキング | 休符 | Brush | 多い | mp | Dm7 | ナレーション可（背景化） |
| **0:14-0:17** | Piano, Bass, Drums | Piano | ウォーキング | 短いフレーズ | Brush | 多い | mp | Gm7 - C7 | ナレーション可（背景化） |
| **0:17-0:20** | Piano, Bass, Drums | Bass | ウォーキング | 休符 | Brush | 多い | mp | Fmaj7 | ナレーション可（背景化） |
| **0:20-0:23** | Piano, Bass, Drums | Piano | ウォーキング | 短いフレーズ | Brush | 多い | mp | Dm7 - Gm7 | ナレーション可（背景化） |
| **0:23-0:26** | Piano, Bass, Drums | Bass | ウォーキング | 休符 | Brush | 多い | mp | C7 | ナレーション可（背景化） |
| **0:26-0:30** | Piano, Bass, Drums | Piano | ウォーキング | 短いフレーズ | Brush | 多い | mp | Fmaj7 - Dm7 | ナレーション可（背景化） |

### ④ ダイナミクス推移 (Hypothesis)
全体を通してほぼ一定の「mp (メゾピアノ)」で推移すると仮定。

```mermaid
graph TD
    A[0:00] --> B(mp)
    B --> C(mp)
    C --> D(mp)
    D --> E(mp)
    E --> F(mp)
    F --> G(mp)
    G --> H(mp)
    H --> I(mp)
    I --> J(mp)
    J --> K(mp)
    K --> L(mp)
    L --> M(mp)
    M --> N(mp)
    N --> O(mp)
    O --> P(mp)
    P --> Q(mp)
    Q --> R(mp)
    R --> S(mp)
    S --> T(mp)
    T --> U(mp)
    U --> V(mp)
    V --> W(mp)
    W --> X(mp)
    X --> Y(mp)
    Y --> Z(mp)
    Z --> AA(mp)
    AA --> BB(mp)
    BB --> CC(mp)
    CC --> DD(mp)
    DD --> EE(mp)
    EE --> FFF[終了]

    style A fill:#fff,stroke:#333,stroke-width:2px
    style FFF fill:#fff,stroke:#333,stroke-width:2px
    classDef dynamics_level fill:#f9f,stroke:#333,stroke-width:1px;
    class B,C,D,E,F,G,H,I,J,K,L,M,N,O,P,Q,R,S,T,U,V,W,X,Y,Z,AA,BB,CC,DD,EE dynamics_level
```

### ⑤ 周波数分析 (Fact & Hypothesis)

| 周波数帯域 | 役割 (Fact) | 担当楽器 (Fact) | 動画投稿者視点での重要性 (Fact) |
| :--- | :--- | :--- | :--- |
| **Low (20Hz - 250Hz)** | 楽曲の土台、安定感 | Upright Bass, Piano低音部 | 動画の「重み」や「安定感」を支える。 |
| **Mid (250Hz - 2kHz)** | メロディ、会話の明瞭度 | Acoustic Piano中音域 | **ナレーションやASMRが集中する帯域。** ここの「余白」がVoiceover Friendlyの鍵。 |
| **High (2kHz - 20kHz)** | 空気感、繊細さ | Brush Drums, Piano高音域 | お洒落さを付与しつつ、耳障りにならないようアタックを抑える。 |

### ⑥ 楽器重要度 (Fact)

| 楽器 | 重要度 | 理由 |
| :--- | :--- | :--- |
| **Acoustic Piano** | ★★★★★ | メロディの核。休符とのバランスが「語りかけ」感を創出。 |
| **Upright Bass** | ★★★★★ | 楽曲の土台。安定したウォーキングベースが安心感を支える。 |
| **Brush Drums** | ★★★★☆ | 軽快なリズム。アタックを抑えた音色が動画の邪魔をしない。 |

### ⑦ Cafe001 DNA TOP10（絶対に消してはいけない要素）

**【Fact（確定事項）】**
1.  **Voiceover-friendlyな「余白」:** メロディの間に十分な休符を設け、ナレーションやASMRを邪魔しないこと。
2.  **BPM 約118:** 軽快なウォーキングテンポを維持すること。
3.  **ブラシドラムの柔らかさ:** アタック音を最小限に抑え、高域の耳障りな音を排除すること。
4.  **Upright Bassの温かい音色:** 楽曲の土台として安定感を提供すること。
5.  **Acoustic Pianoの会話的フレーズ:** 主張しすぎず、動画に寄り添う表現であること。
6.  **自然なループ構造:** 始まりと終わりが繋がり、ループ再生に対応できること。

**【Hypothesis（推測・仮説）】**
7.  **0秒同時開始:** 全楽器が0:00から同時に始まることが、動画の「掴み」として最適である。
8.  **一定のダイナミクス:** 曲全体を通して音量・エネルギーレベルが一定（mp）であることが、BGMとして最適である。
9.  **F Major / ii-V-I-vi進行:** この調と進行が、最も汎用性が高く心地よい響きを生む。
10. **SUNO AI設定の最適解:** Style Influence 80-95, Weirdness 0-10 が、001の空気感を再現する最適値である。

---

## 🌸 桃花からのコメント
彩花CTO、社長。
「Cafe001 DNA設計図 Ver.1.1」として、内容を「事実（Fact）」と「推測・仮説（Hypothesis）」に厳密に分離いたしました。

これにより、私たちが「すでに分かっていること」と「これから検証すべきこと」が明確になりました。今後は、この設計図と新たに作成する「再現率評価シート」を連携させ、仮説を一つずつ事実へと昇華させていくデータ駆動型のアプローチでCafeシリーズを進化させていきます！🌸✨

---
**作成者:** 桃花 (COO)
**監修:** 彩花 (CTO)
**日付:** 2026年8月2日
**保存場所:** `music_ai/knowledge/cafe001_dna_blueprint_v1.md`
