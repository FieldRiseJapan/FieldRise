# Project-001｜Suno候補008・009A 取得記録

**取得日:** 2026-08-15（GMT+9）
**用途:** 001 MasterおよびCAND-006との比較に用いる、検証用008・009Aの公開情報と音源指紋を管理する。

| 候補ID | ユーザー提供URL | Suno song ID | タイトル | ページ初期確認 |
|---|---|---|---|---|
| CAND-008 | `https://suno.com/s/OH6EsNilE64L1fgm` | `ce225f8b-6c6a-4445-ae56-23eabce65e4d` | `008` | 表示曲尺は1:31。完全スタイル・音源URLは継続確認中。 |
| CAND-009A | `https://suno.com/s/Oo6Nbb0edO38Qwwn` | `1b961067-16ec-46d3-a84a-e18a5b895487` | `009A` | 共有ページで完全スタイルの本文表示を確認。 |

## CAND-009Aで確認した公開Prompt・Negative指定

CAND-009Aの共有ページには、BPM 80–86、0〜2秒はupright bassのみ、無音なし、very soft deep sub-focused upright bass、rounded natural finger-plucked tone、almost entirely fundamental low-frequency energy below 180 Hz、minimal upper harmonics、restrained resonance、intimate centered mono-like bass image、2.00秒の疎なPiano導入、後続minimal soft brush drumsを求める公開本文が表示された。Negative指定には、早期Piano／Drums／メロディ／他楽器／無音、upper harmonics、bright bass tone、180–2,000 Hz resonance、wide stereo bass、hard attack、クリック／クラッチ／金属的・機械的ノイズ、強いDrums等の除外が含まれる。

| 検証条件 | 共有ページで確認した内容 | 区分 |
|---|---|---|
| 0〜2秒の楽器構成 | upright bassのみ、他楽器なし。 | FACT（公開Prompt） |
| Bass開始・無音 | 0:00からBassあり、無音なし。 | FACT（公開Prompt） |
| 音色・帯域 | deep sub-focused、180 Hz未満の基音中心、倍音最小、共鳴抑制。 | FACT（公開Prompt） |
| 空間 | centered mono-like bass image、wide stereo bassを除外。 | FACT（公開Prompt） |
| 2秒以降 | sparse soft Piano、後続minimal soft brush drums。 | FACT（公開Prompt） |
| seed、非表示Suno設定 | 共有ページに表示なし。 | OPEN |

> **初期所見:** CAND-009Aの公開Promptは、CAND-006後に定めた「Bassの倍音量だけを抑え、導入を180 Hz未満に集中させる」検証条件と整合する。音源を同条件で測定し、再現達成を判定する。

## CAND-008の公開Prompt確認

CAND-008の完全スタイル表示には、BPM 80–86、0〜2秒はupright bassのみ、無音なし、very soft rounded finger-plucked tone、extremely deep low-register focus、very little overtone content、導入エネルギーのほぼ全てを180 Hz未満に置くこと、0〜2秒における180–2,000 Hz resonanceの回避、2.00秒の疎なPiano導入、後続minimal soft brush drumsが表示された。Negative指定には、早期Piano／Drums／メロディ／他楽器／無音、excessive overtones、bright bass harmonics、180–2,000 Hz resonance、hard attack、クリック／クラッチ／金属的・機械的ノイズ、強いDrums等の除外が含まれる。

| 比較項目 | CAND-008 | CAND-009A | 判定 |
|---|---|---|---|
| 公開Promptの主眼 | 倍音を極小化し、180 Hz未満に導入を集中 | sub-focused、基音中心、180 Hz未満に集中 | FACT |
| 公開Negative指定 | early instrument、過剰倍音、180–2,000 Hz resonance等を除外 | early instrument、upper harmonics、180–2,000 Hz resonance等を除外 | FACT |
| BPM指定 | 80–86 | 80–86 | FACT |
| 非表示seed・内部設定 | 未表示 | 未表示 | OPEN |

## 取得済み分析用音源

| 候補ID | 公開CDN URL | ローカル分析ファイル | 形式 | 曲尺 | SHA-256 |
|---|---|---|---|---:|---|
| CAND-008 | `https://cdn1.suno.ai/ce225f8b-6c6a-4445-ae56-23eabce65e4d.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-008_ce225f8b.mp3` | MP3、48 kHz、Stereo、約177 kbps | 91.032秒 | `4ea40b2ae2d460cd68de1a06f0fe9b948d22f3c9a3c8060ea711c131b23638f0` |
| CAND-009A | `https://cdn1.suno.ai/1b961067-16ec-46d3-a84a-e18a5b895487.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-009A_1b961067.mp3` | MP3、48 kHz、Stereo、約190 kbps | 107.568秒 | `3116cb69406cdec628030fc28c245866d48cd75d40af95e4dd79f1a89a8c95d5` |

> **検証上の扱い:** CAND-008・009Aは、Bass開始0:00・無音なし・0〜2秒Bass単独を維持し、導入の倍音量とLow-mid共鳴をさらに抑える公開条件を持つ。両者の公開文言に差があるため、音響差は同一Promptからの出力差ではなく、Prompt差と生成出力差の複合として扱う。
