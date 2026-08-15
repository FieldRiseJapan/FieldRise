# Project-001｜Suno候補曲 取得記録

**取得日:** 2026-08-15（GMT+9）
**用途:** Cafe 001 Masterとの再現比較に使用する候補曲の識別情報・共有ページ公開情報を保存する。
**注意:** 以下はSuno共有ページで確認できた公開情報である。生成Prompt、SUNO設定、Negative指定は共有ページ上で確認できない場合があり、未確認値を推測で補完しない。

| 候補ID | ユーザー提供URL | Suno song ID | タイトル | 公開情報の状態 |
|---|---|---|---|---|
| CAND-004 | `https://suno.com/s/QhzmREKfyxAo6uyW` | `4a35d77d-04b5-4b55-a317-8186450731df` | `004` | ページ到達を確認。初期読込状態のため、追加メタデータ・音源URLは未確定。 |
| CAND-005 | `https://suno.com/s/ksoKv0j8BunFng6L` | `ef70c86b-462a-4121-80dd-4ad0d8f3e201` | `005` | タイトル、作成者、スタイル、日時、表示上の再生時間を確認。 |

## CAND-005で確認できた公開メタデータ

| 項目 | 値 | 区分 |
|---|---|---|
| 作成者表示 | `「Runa」` | FACT |
| スタイルタグ | `cafe jazz`、`instrumental`、`BGM` | FACT |
| 表示日時 | 2026-08-15 13:01（共有ページ表示） | FACT |
| 表示上の再生時間 | 3:00 | FACT |
| 生成情報 | 共有ページ上で「なし」 | FACT |
| Prompt／SUNO設定／Negative指定 | 未確認 | OPEN |
| 直接ダウンロード音源URL | 共有ページ本文では未確認 | OPEN |

## 次の取得・検証方針

1. CAND-004およびCAND-005について、再生に使われる音源URLを取得できるかを確認する。
2. 取得可能な音源は、参照用にローカル分析を行う前に、公開URL・取得日時・SHA-256・曲尺・形式を記録する。
3. Prompt、SUNO設定、Negative指定は、共有ページで確定できない限り`OPEN`とし、候補曲間の「一変数検証済み」を主張しない。
4. 音源が確認できた場合は、001 Masterと同一の0〜2秒測定、全体RMS、帯域比、開始時刻、テンポ候補の比較へ進む。

## CAND-005の共有ページで追加確認した情報

共有ページの「Show full styles」展開後、CAND-005には次の公開スタイルが表示された。これは共有ページに現れた**公開メタデータ**であり、生成Promptの完全本文、SUNO設定、Negative指定と同一であるとは主張しない。

| 種別 | 共有ページ表示の内容 | 区分 |
|---|---|---|
| 基本タグ | `cafe jazz`、`instrumental`、`BGM` | FACT |
| 楽器・奏法タグ | `upright bass pizzicato`、`brushed snare kit`、`staccato piano melody`、`syncopated piano lines`、`classical guitar fingerstyle`、`cello countermelody`、`sparse left-hand bass` | FACT |
| 空間・質感タグ | `plate reverb`、`tape saturation`、`room mic bleed`、`wide stereo field`、`1960s tape warmth` | FACT |
| テンポ・ムードタグ | `gentle swing`、`mid-tempo 90 BPM`、`introspective calm` | FACT |
| Prompt全文／SUNO設定／Negative指定 | 共有ページ上で確定できない | OPEN |

## 取得済み分析用音源

| 候補ID | 公開CDN URL | ローカル分析ファイル | 形式 | 曲尺 | SHA-256 |
|---|---|---|---|---:|---|
| CAND-004 | `https://cdn1.suno.ai/4a35d77d-04b5-4b55-a317-8186450731df.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-004_4a35d77d.mp3` | MP3、48 kHz、Stereo、約192 kbps | 180.432秒 | `242bd0c43f919daa1d3e7def3862186b87f05c8296d3a1c7fb86200e0fe017da` |
| CAND-005 | `https://cdn1.suno.ai/ef70c86b-462a-4121-80dd-4ad0d8f3e201.mp3` | `music_ai/analysis/cafe/incoming_001_reproduction/CAND-005_ef70c86b.mp3` | MP3、48 kHz、Stereo、約196 kbps | 180.720秒 | `36536c073b5c2076c3571a87736820bb1512d194bd5ede2e6874d94e393f60cc` |

> **取扱い:** 音源はユーザーが共有したSuno URLに対応する公開CDNから、001再現検証のために取得した。分析値はMP3デコード後の比較値であり、001 Masterの可逆FLAC測定値と厳密な絶対比較には使わず、候補004と候補005を同一方法で比較し、001の時間・帯域・ダイナミクス特性への近接度を補助的に評価する。

## CAND-004で確認できた公開メタデータ

| 項目 | 値 | 区分 |
|---|---|---|
| 作成者表示 | `「Runa」` | FACT |
| 基本スタイルタグ | `cafe jazz`、`instrumental`、`BGM` | FACT |
| 表示日時 | 2026-08-15 13:01（共有ページ表示） | FACT |
| 表示上の再生時間 | 3:00 | FACT |
| 直接公開CDN音源 | `https://cdn1.suno.ai/4a35d77d-04b5-4b55-a317-8186450731df.mp3` | FACT |
| 完全スタイル、Prompt全文、SUNO設定、Negative指定 | 基本共有ページの展開前状態では未確認 | OPEN |

CAND-004とCAND-005は、共有ページ上の基本タグ、作成者表示、表示日時、表示曲尺が共通している。これは公開情報上の一致であり、同一Prompt・同一設定・一変数のみ変更したペアであることは示さない。候補間の比較は音響差分の記録として実施し、**一変数実験済み**の主張は生成条件が確認できるまで保留する。

## CAND-004の公開Prompt（共有ページの完全スタイル表示）

CAND-004では、共有ページの完全スタイル表示から、次の生成意図を確認した。これは公開ページで確認したPrompt本文であり、Suno側の内部設定値ではない。

> Instrumental cafe jazz BGM. From exactly 0:00 to 2.00 seconds, ONLY a warm acoustic upright bass is sounding. No piano, no drums, no melody, no other instruments during the first 2.00 seconds. The upright bass is clearly present from the first instant, extremely soft, rounded, natural finger-plucked tone, gentle sustained low-end presence, very slow soft swell, no silence. At exactly 2.00 seconds, sparse soft acoustic piano enters naturally, followed later by minimal soft brush drums. Few piano notes, long rests, calm neutral mood, voiceover-friendly, spacious midrange, unobtrusive cafe atmosphere, constant gentle dynamics, seamless loop feeling. Negative specifications exclude piano, drums, melody, other instruments, and silence before 2 seconds; hard bass attack, clicking, clacking, clutch-like sounds, mechanical noise, metallic string snap, aggressive plucking, busy piano, dense melody, strong drums, cymbals, dramatic build, sudden fills, EDM, synth, guitar, and vocal.

| 検証変数 | CAND-004の公開指定 | 区分 |
|---|---|---|
| 0〜2秒 | upright bassのみ、Piano・Drums・メロディ・他楽器なし | FACT（公開Prompt） |
| Bass | 0秒から存在、弱い自然な指弾き、遅いSwell | FACT（公開Prompt） |
| Piano | 2.00秒に疎に導入、長い休符 | FACT（公開Prompt） |
| Drums | Piano後に最小限のbrush drums | FACT（公開Prompt） |
| Negative指定 | 早期Piano／Drums／メロディ、無音、硬いBassアタック、クリック系ノイズ等を除外 | FACT（公開Prompt） |
| SUNO設定 | 共有ページに明示なし | OPEN |

## CAND-005のスタイル表示に関する訂正

前項でCAND-005の「共有ページで追加確認した情報」として記録した、`upright bass pizzicato`、`brushed snare kit`、`staccato piano melody`等の詳細タグは、当該ページの**Similar欄に表示された別曲のタグを含む**ことが判明した。そのため、CAND-005自身の生成条件としては使用しない。CAND-005に現時点で帰属確認できるのは、基本タグ`cafe jazz`、`instrumental`、`BGM`、作成者、表示日時、曲尺、公開CDN音源のみである。CAND-005の固有Prompt・SUNO設定・Negative指定は`OPEN`として維持する。

## CAND-005の公開Prompt確認

CAND-005の完全スタイル表示では、CAND-004と同一のPrompt本文およびNegative指定が表示された。少なくとも共有ページに表示される生成テキスト上は、Bassのみの0〜2秒、2.00秒の疎なPiano導入、後続の最小限brush drums、ならびに初期のPiano／Drums／メロディ／無音／硬いBassアタック／クリック系ノイズ等の除外指定が一致する。

| 比較項目 | CAND-004 | CAND-005 | 判定 |
|---|---|---|---|
| 公開Prompt本文 | 同一表示 | 同一表示 | FACT |
| 公開Negative指定 | 同一表示 | 同一表示 | FACT |
| 基本タグ・作成者・公開日時 | 同一表示 | 同一表示 | FACT |
| SUNO設定（モデル以外の詳細、seed等） | 未表示 | 未表示 | OPEN |
| 音源のSHA-256 | 異なる | 異なる | FACT |

> **検証上の扱い:** CAND-004とCAND-005は、公開Prompt・公開Negative指定が同一で、音源ハッシュが異なる**生成出力ペア**として比較できる。ただし、Sunoの非表示設定、seed、生成時内部パラメータは共有ページから確認できないため、「生成Prompt以外が完全固定された一変数実験」とは表現しない。
