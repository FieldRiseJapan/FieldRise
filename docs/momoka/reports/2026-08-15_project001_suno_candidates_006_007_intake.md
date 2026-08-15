# Project-001｜Suno候補006・007 取得記録

**取得日:** 2026-08-15（GMT+9）
**用途:** 001 Masterおよび先行候補004・005と比較する、検証用006・007の公開情報と音源指紋を管理する。

| 候補ID | ユーザー提供URL | Suno song ID | タイトル | ページ初期確認 |
|---|---|---|---|---|
| CAND-006 | `https://suno.com/s/Y4pUYkjkf5VRtgNb` | `89a554f4-7676-43f5-9435-498a02243f59` | `006` | 表示曲尺は2:33。完全スタイル・音源URLは継続確認中。 |
| CAND-007 | `https://suno.com/s/KH1HYSA4VPQxZJQj` | `fa977d24-f9a1-4b74-bffc-fb3224614245` | `007` | 共有ページで完全スタイルの本文表示を確認。 |

## CAND-007で確認した公開Prompt・Negative指定

CAND-007の共有ページには、BPM 80–86、warm acoustic upright bass、0〜2秒はupright bassのみ、Piano・Drums・メロディ・他楽器なし、Bassは0:00から存在、無音なし、soft rounded finger-plucked tone、low-register centered and intimate、predominantly deep low-frequency energy、restrained upper harmonics、minimal natural resonance、2秒に疎なPiano、後続で最小限のsoft brush drumsを求める公開本文が表示された。Negative指定には、早期Piano／Drums／メロディ／他楽器／無音、bright bass harmonics、wide stereo bass、stereo reverb during intro、hard bass attack、クリック／クラッチ／機械的ノイズ、metallic string snap、busy piano、強いDrums等の除外が含まれる。

| 検証条件 | 共有ページで確認した内容 | 区分 |
|---|---|---|
| 0〜2秒の楽器構成 | upright bassのみ。Piano、Drums、メロディ、他楽器なし。 | FACT（公開Prompt） |
| Bass開始・無音 | 0:00からBassあり、無音なし。 | FACT（公開Prompt） |
| 音色・帯域 | soft、rounded、natural finger-plucked、low-register、低域優勢、上位倍音を抑制。 | FACT（公開Prompt） |
| 空間 | centered／intimate、wide stereo bassとintro中のstereo reverbを除外。 | FACT（公開Prompt） |
| 2秒以降 | sparse soft Piano、後続minimal soft brush drums。 | FACT（公開Prompt） |
| seed、非表示Suno設定 | 共有ページに表示なし。 | OPEN |

> **初期所見:** CAND-007の公開Promptは、004・005比較後に確定した「Bass開始0:00・無音なしを固定し、0〜2秒の低域中心・中央定位・上位倍音／早期reverb抑制を加える」という次検証条件と整合する。音源の客観測定と人による聴取確認の前に、再現達成を主張しない。

## CAND-006の公開Prompt確認

CAND-006の完全スタイル表示でも、CAND-007と同じ公開PromptおよびNegative指定を確認した。すなわち、BPM 80–86、Bass開始0:00・無音なし、0〜2秒Bass単独、低域優勢、上位倍音の抑制、中央で親密な定位、dry close acoustic sound、early stereo reverbの除外、2秒の疎なPiano導入、後続minimal soft brush drumsである。

| 比較項目 | CAND-006 | CAND-007 | 判定 |
|---|---|---|---|
| 公開Prompt本文 | 同一表示 | 同一表示 | FACT |
| 公開Negative指定 | 同一表示 | 同一表示 | FACT |
| BPM指定 | 80–86 | 80–86 | FACT |
| 非表示seed・内部設定 | 未表示 | 未表示 | OPEN |
| 音源SHA-256 | 異なる | 異なる | FACT |

## 取得済み分析用音源

| 候補ID | 公開CDN URL | ローカル分析ファイル | 形式 | 曲尺 | SHA-256 |
|---|---|---|---|---:|---|
| CAND-006 | `https://cdn1.suno.ai/89a554f4-7676-43f5-9435-498a02243f59.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-006_89a554f4.mp3` | MP3、48 kHz、Stereo、約191 kbps | 153.888秒 | `a1f02349bbb8fdadad227d582ccf989ec612179e03829af2c9bcd456ace0a288` |
| CAND-007 | `https://cdn1.suno.ai/fa977d24-f9a1-4b74-bffc-fb3224614245.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-007_fa977d24.mp3` | MP3、48 kHz、Stereo、約181 kbps | 104.400秒 | `605689f30d42c21afe3112bbb560f33bbf9541a4c5d157b44ae2634dff541757` |

> **検証上の扱い:** CAND-006・007は公開Prompt・公開Negative指定・BPM指定が同一で、音源ハッシュが異なる生成出力ペアとして比較する。非表示seedおよび内部設定が不明なため、完全な一変数実験であるとは主張しない。
