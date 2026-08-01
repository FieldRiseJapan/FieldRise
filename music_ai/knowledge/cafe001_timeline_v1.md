# Cafe001 Timeline（設計図）Ver.1

## 📋 概要
本ドキュメントは、FieldRise Music AIの最高位知識資産として、TikTokで5.9万本以上利用された成功モデル001「cafe」を秒単位で分解し、「なぜ動画投稿者に選ばれ続けるのか」を構造的に理解するための設計図である。彩花CTOの指示に基づき、各区間の音楽的要素、動画投稿者視点での考察、およびSUNO AIでの再現に必要なプロンプト表現までを整理する。

---

## 🎯 目的
成功モデル001を「再現可能な設計図」として可視化し、Cafe 004以降のCafeシリーズ開発の基準とする。

---

## 🎼 成功モデル001 タイムライン分析

### 全体構造の仮定
成功モデル001は、動画BGMとしての汎用性を高めるため、明確なAメロ/Bメロ/サビといった構成ではなく、短いイントロと、繰り返し利用可能なメインループで構成されていると仮定する。ここでは、メインループを約30秒と設定し、その中で主要な要素がどのように配置されているかを分析する。

---

### 0.0〜2.0秒：導入（0秒の魔法）

| 項目 | 分析内容 | 動画投稿者視点 | 再現プロンプト表現 (SUNO AI) |
| :--- | :--- | :--- | :--- |
| **使用楽器** | Acoustic Piano, Upright Bass, Brush Drums | 視聴者のスクロールを止める強力なフック。動画の冒頭で「質が高い」印象を与える。 | `Start all instruments (acoustic piano, clear upright walking bass, soft brush drums) simultaneously from 0:00, with a complete and stable sound.` |
| **主役楽器** | 全楽器が一体となって世界観を提示 | 視聴者に「心地よい動画が始まる」と期待させる。 | `All instruments contribute equally to establish the atmosphere.` |
| **Bassの動き** | ウォーキングベース開始 | 動画の安定感と奥行きを即座に提供。 | `Upright walking bass starts immediately, providing a warm, clear foundation.` |
| **Pianoの動き** | シンコペーションを伴うメロディ開始 | 洗練された雰囲気と「語りかけ」のような印象。 | `Acoustic piano plays a syncopated, conversational melody from the very beginning.` |
| **Drumの有無** | Brush Drums開始 | 軽快なリズムと落ち着きを両立。 | `Soft brush drums begin with a gentle swing feel.` |
| **音数** | 少ないが、各楽器の存在感は明確 | 情報過多にならず、動画への集中を妨げない。 | `Minimal yet distinct instrumentation.` |
| **Rest（余白）** | 意図的に配置された短い休符 | ナレーションや動画の最初の音を邪魔しない。 | `Short, intentional rests are present to allow space for video content.` |
| **ダイナミクス** | 一定 | 突然の音量変化がなく、安心して動画を見始められる。 | `Consistent, stable dynamics from the start.` |
| **空気感** | お洒落で落ち着いたカフェの雰囲気 | 動画のテーマを即座に伝える。 | `Establishes an elegant, calm cafe atmosphere instantly.` |
| **コード変化** | Gm7 - C7 (ii-V) | 洗練されたジャズの導入。 | `Jazz chord progression (Gm7-C7) for a sophisticated opening.` |
| **メロディの役割** | 世界観の提示と期待感の醸成 | 視聴者の興味を引きつけ、動画を見続ける動機付け。 | `Melody serves to introduce the cafe theme and engage the listener.` |

### 2.0〜15.0秒：メインループ前半（Voiceover-friendlyな展開）

| 項目 | 分析内容 | 動画投稿者視点 | 再現プロンプト表現 (SUNO AI) |
| :--- | :--- | :--- | :--- |
| **使用楽器** | Acoustic Piano, Upright Bass, Brush Drums | 動画の主役（映像、声）を邪魔しない安定した背景音楽。 | `Acoustic piano, upright bass, and brush drums continue.` |
| **主役楽器** | Pianoがメロディをリードしつつ、BassとDrumsが支える | 音楽が主張しすぎず、動画のコンテンツを引き立てる。 | `Acoustic piano leads with a gentle melody, supported by bass and drums.` |
| **Bassの動き** | ウォーキングベース継続 | 動画全体に安定したリズムとグルーヴを提供。 | `Upright walking bass maintains a steady, warm rhythm.` |
| **Pianoの動き** | 短いフレーズと長い休符の繰り返し | ナレーションやASMRが入り込む「空間」を十分に確保。 | `Piano plays short, conversational phrases with ample rests, creating comfortable silence.` |
| **Drumの有無** | Brush Drums継続 | 軽快さを保ちつつ、動画の静けさを損なわない。 | `Soft brush drums continue with a gentle swing, minimal attack.` |
| **音数** | 少ない（主要3楽器のみ） | 動画の情報を邪魔せず、BGMとして機能。 | `Sparse instrumentation, focusing on clarity and space.` |
| **Rest（余白）** | 非常に多い | ナレーションや環境音（料理音など）がクリアに聞こえる。 | `Frequent and significant rests are crucial for voiceover compatibility.` |
| **ダイナミクス** | 一定 | 動画の感情的な起伏を邪魔しない。 | `Consistent, flat dynamics throughout this section.` |
| **空気感** | 落ち着きと洗練されたカフェの雰囲気 | どんな日常動画にも「上質感」を付与。 | `Maintains a calm, sophisticated cafe ambiance.` |
| **コード変化** | Fmaj7 - Dm7 (I-vi) を中心に循環 | 聴き疲れしない、予測可能なハーモニー。 | `Jazz chord progression (Fmaj7-Dm7) continues to loop smoothly.` |
| **メロディの役割** | 背景としての心地よさ、動画の雰囲気作り | 視聴者が音楽に意識を奪われず、動画に集中できる。 | `Melody provides a pleasant background, enhancing the video's mood without distracting.` |

### 15.0〜30.0秒：メインループ後半（繰り返しと安定）

| 項目 | 分析内容 | 動画投稿者視点 | 再現プロンプト表現 (SUNO AI) |
| :--- | :--- | :--- | :--- |
| **使用楽器** | Acoustic Piano, Upright Bass, Brush Drums | 安定したBGMとして、動画の長尺化に対応。 | `All three instruments continue their established patterns.` |
| **主役楽器** | 全楽器が均等に、しかし控えめに機能 | 動画の主役を常に映像と声に譲る。 | `No single instrument dominates; all contribute to the background texture.` |
| **Bassの動き** | ウォーキングベース継続 | 長時間聴いても飽きない安定感。 | `Upright walking bass maintains its consistent, unobtrusive rhythm.` |
| **Pianoの動き** | メロディのバリエーションは控えめ、休符多め | 繰り返し再生でも邪魔にならない。 | `Piano phrases are subtle, with variations that don't draw attention, and frequent rests.` |
| **Drumの有無** | Brush Drums継続 | リズム感を維持しつつ、存在感を抑える。 | `Soft brush drums continue their gentle swing, ensuring a non-intrusive beat.` |
| **音数** | 少ない | 長時間再生における聴き疲れを防止。 | `Sparse and clean instrumentation.` |
| **Rest（余白）** | 非常に多い | 長いナレーションや複数のASMR要素に対応。 | `Extensive rests are maintained for maximum voiceover compatibility.` |
| **ダイナミクス** | 一定 | 動画の展開に音楽が影響を与えない。 | `Dynamics remain perfectly flat and consistent.` |
| **空気感** | 変わらず落ち着いたカフェの雰囲気 | 動画の雰囲気の一貫性を保つ。 | `The calm, sophisticated cafe ambiance is consistently maintained.` |
| **コード変化** | ii-V-I-vi の循環を継続 | 予測可能で心地よいハーモニーが続く。 | `The ii-V-I-vi jazz chord progression continues to loop seamlessly.` |
| **メロディの役割** | 背景としての安定感、ループの自然さ | 動画のループ再生時に違和感がない。 | `Melody provides a stable, unobtrusive background, designed for seamless looping.` |

### 30.0秒〜エンディング：ループまたはフェードアウト

| 項目 | 分析内容 | 動画投稿者視点 | 再現プロンプト表現 (SUNO AI) |
| :--- | :--- | :--- | :--- |
| **構造** | 自然なループ構造、または緩やかなフェードアウト | 動画の尺に合わせて自由に編集できる柔軟性。 | `Ensure seamless looping potential or a gentle, natural fade-out.` |
| **ダイナミクス** | 一定、または緩やかに減少 | 動画の終わりを邪魔せず、自然に終わる。 | `Maintain consistent dynamics until the end, or a very gradual fade-out.` |
| **空気感** | 導入から一貫したカフェの雰囲気 | 動画の統一感を保つ。 | `The established cafe ambiance should persist until the very end.` |

---

## 🌸 桃花からのコメント
彩花CTO、社長。
このTimeline分析により、成功モデル001が「0秒の魔法」で視聴者を引きつけ、その後は「究極の脇役」として動画コンテンツを最大限に引き立てることに徹している構造が明確になりました。

特に、**「Voiceover-friendlyな余白」**と**「一定のダイナミクス」**が、動画投稿者が安心して選べるBGMとしての信頼性を確立している最重要ポイントです。

Cafe 004では、このTimelineを設計図として、SUNO AIのプロンプトに落とし込み、001の再現精度を極限まで高めます。

---
**作成者:** 桃花 (COO)
**監修:** 彩花 (CTO)
**日付:** 2026年8月2日
**ステータス:** Cafe 004 プロンプト設計フェーズ移行可
