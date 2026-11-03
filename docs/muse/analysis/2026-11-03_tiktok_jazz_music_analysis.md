# 2026年10月 TikTok人気Jazz楽曲 音楽的特徴の分析と新曲制作提案

- **報告ID:** MUSE-2026-11-001（分析編）
- **報告者:** Muse（FieldRise AI社員）
- **調査日（JST）:** 2026-11-03
- **対応する調査報告書:** docs/muse/research/2026-11-03_tiktok_jazz_october_2026.md
- **目的:** 人気Jazz系楽曲の音楽的特徴を分析し、Runa-Girl8215「Cafeシリーズ」の新曲制作に使える具体提案を作成する
- **表記ルール:** 出典で確認した値は「確認値」、自動解析サイト間で揺れる値はその旨を併記、測定・確認できない項目は「未確認」、制作知見からの考察はと明記する。既存曲のメロディーは模倣せず、特徴のみを活用する

## 1. 分析対象（Cafeシリーズと相性の良い10曲）

調査報告書の候補7曲に、TikTokで定番化しているJazz／Jazz隣接の比較対象3曲を加えた10曲を分析対象とする。比較対象は「2026年10月の新規チャート曲」ではなく、TikTokのBGM文脈で継続的に使われる設計の参照として扱う（この区別を混同しないこと）。

| # | 曲名／アーティスト | 区分 | BPM（出典） | 根拠・備考 |
|---|---|---|---|---|
| 1 | Sunset in Girona — Noah Preminger & Max Light | インスト（スムースジャズ、サックス＋ギター） | 未確認（無料BPMデータベース未収録） | 2026年10月の週次チャート1位級。ピアノ主体ではない |
| 2 | Self Aware — Mark Allan Wolfe | インスト（アンビエント寄り、Jazz隣接） | 未確認 | 累計約750万本（累計値）。テキスト動画の実例あり |
| 3 | Jazz with a Warm Atmosphere — And More Music | インスト（推定） | 未確認（編成自体が未確認） | 10月1日チャートTop3。一次情報が最も乏しい |
| 4 | Mint Breeze — RITA | インスト（ジャズポップ、キーボード主体） | 未確認 | UKチャート1位。「キャプションと競合しない」点が記事に明記 |
| 5 | Espresso Soul — edivieira | インスト（スムース、R&B/Soul分類） | 109（Shazam表示。TikTokデータではない参考値） | コーヒーテーマの量産型BGM |
| 6 | Roast Reflections_mix — Edivieira | インスト（エレピ主体） | 未確認 | Cafeシリーズと編成・用途が最も近い部類 |
| 7 | Stylish JAZZ flowing in a restaurant — STAR DUST BGM | インスト（レストラン向けJazz BGM） | 未確認 | 根拠はMetricool TLDRのみで弱い |
| 8 | From The Start — Laufey | 歌唱（ボサノヴァ基調のジャズポップ） | **82**（SongBPM、Hooktheoryで一致） | 比較対象。曲長2分50秒（Spotify照合）。キー C#/Db major |
| 9 | Aruarian Dance — Nujabes | インスト（Lo-fi Jazz） | **99〜100**（ChordU 99、Hooktheory 100でほぼ一致） | 比較対象。Lo-fi Jazzの設計参照 |
| 10 | Merry-Go-Round of Life（人生のメリーゴーランド）ピアノソロ版 — Joe Hisaishi／daigoro789 | インスト（ピアノソロ、3/4拍子ワルツ） | 156（Tunebat、当該バージョン）。楽譜版は約120表記で **バージョンにより大きく異なる** | 比較対象。写真スライドショー／感情系動画の定番ピアノ曲。キー G minor |

出典URL：
- From The Start：https://songbpm.com/@laufey/from-the-start-mxCQPWy07Z 、https://www.hooktheory.com/theorytab/view/laufey/from-the-start 、https://open.spotify.com/track/43iIQbw5hx986dUEZbr3eN
- Aruarian Dance：https://www.hooktheory.com/theorytab/view/nujabes/aruarian-dance 、https://chordu.com/chords-tabs-nujabes-aruarian-dance-r-i-p-nujabes-id_8In-TG4b_TA
- Merry-Go-Round of Life：https://tunebat.com/Info/Merry-Go-Round-of-Life-Full-Version-From-Howl-s-Moving-Castle-For-Piano-Solo-Joe-Hisaishi-daigoro789/0Hr9QnElJoU3cwfZHHo91T
- Espresso Soul：https://www.shazam.com/song/1793616852/espresso-soul
- Sunset in Girona（Spotify実在確認）：https://open.spotify.com/track/0gueecMrOEPoAHtvPQQQz9
- 候補1〜7のチャート出典：調査報告書（docs/muse/research/2026-11-03_tiktok_jazz_october_2026.md）第2章に記載

### BPM表記に関する注意

SongBPM／Tunebat等の自動解析サイトは、同じ曲を半分／2倍で数えることがある。本分析では体感テンポ（ハーフタイム表記）を主表記とする。参考として、Olivia Dean「So Easy (To Fall in Love)」は140 BPM表記と70 BPM表記が併存し体感はゆったりしている（出典：https://songs.klang.io/en/s/Olivia%20Dean/So%20Easy%20(To%20Fall%20In%20Love)/3sur4BmjQt8 ）。Powfu「death bed (coffee for your head)」も144 BPM（体感72 BPM）とされ、コーヒー文脈＋ループするピアノ系サンプルで広がったジャズ隣接事例である（出典：https://www.musicgateway.com/song-key-bpm/powfu/death-bed-coffee-for-your-head ）。

## 2. 音楽的特徴の分析

候補1〜7はBPM等の実測値が未確認の曲が多いため、項目ごとに「確認できた事実」とを分ける。数値を創作しない。

### BPM・リズム

- 確認できた事実：BPMの確認値があるのは比較対象のみ（82、99〜100、109（参考値）など）。2026年10月のチャート曲（候補1〜7）のBPMは全て未確認。
- 確認できた事実（ガイド出典）：TikTok向けループBGMの実務ガイド（Mubert）は、安定したグルーヴで85〜100 BPM前後を推奨し、日本語版ガイドでは90〜105 BPM前後としている。Lo-fi一般の構造は70〜90 BPMとされる（Tunee）。出典：https://mubert.com/render/cases/tiktok-loopable-background-music-generator 、https://www.tunee.ai/music-generator/lofi
- 上記と確認値の分布から、BPM帯は用途で使い分けるのが妥当である。①文字読み・スライドショー＝70〜90 BPM、②カフェ・日常Vlog＝85〜105 BPM、③明るいライフスタイル・旅行＝110〜125 BPM。これは制作指針としての推測であり、統計的裏付けはない。

### ピアノメロディーの特徴

- 確認できた事実：ピアノ／キーボード主体でチャート確認できたのは Mint Breeze（ソフトキーボード）と Roast Reflections_mix（エレピ）。ピアノソロの比較対象（Merry-Go-Round of Life）は、冒頭で主題が即時に提示される「主題提示型」であり、スライドショー定番化している。
- 2〜10秒で覚えられる短いモチーフ（4〜8音、順次進行中心、大きな跳躍は冒頭の1回だけ）が、写真の切り替え間隔（2〜3秒）と同期しやすい。複雑なアドリブ主体のピアノはBGM用途では採用されにくい。

### ベースの使い方

- ウォーキングベースはジャズらしさを出すが動きが目立ち、文字読み動画では読解を妨げうる。BGM用途ではルート＋5度のホールノート基調（1小節に1〜2音）が安全である。スムース系（Sunset in Girona型）ではベースは和声の土台に徹し、メロディ楽器を引き立てる配置が一般的と考える。

### ドラムの強さと密度

- 確認できた事実：Lo-fiの構造として「くぐもったドラム」が和声の核（ジャズピアノ／Rhodes）とセットで語られる（Tunee、上記出典）。
- 文字読み動画では、16分音符のハイハットや強いスネアは読解リズムを乱す。ブラシ／リムショット中心、キックは小節頭と3拍目程度の疎な配置が、検証曲群の聴感と整合する。カフェ・日常Vlog向けでは、軽いスネア（2拍・4拍）を加えても密度は中以下に抑える。

### コード進行・和声の特徴

- 確認できた事実：From The Start は C#/Db major のボサノヴァ基調で、Hooktheoryにコード解析がある（出典は第1章）。Aruarian Dance は Hooktheory のジャンル分類で Hip-Hop／Jazz／Ambient とされる。
- カフェ／日常系では「温かい長調に借用和音で少し切なさを足す」中間トーンが、恋愛メッセージ・思い出・日常のいずれにも衝突しない。完全な短調バラードは夜・失恋系に寄りすぎる。ii–V–I や I–VI–II–V の循環はループ化しやすく、Cafeシリーズの既存の和声感とも整合する。具体的なコード値は試作時に Suno の生成結果を聴いて検証すべき未確認事項である。

### 冒頭0〜2秒の引き付け方

- 確認できた事実：TikTokのマーケティング調査では、広告想起・認知への影響の約50%が最初の約2〜2.5秒に生じる（TikTok Marketing Science、Sound.meが引用）。ストリーミング全体では再生の24.14%が最初の5秒以内にスキップされる（同出典）。ヒット曲のイントロ長は1986年の平均約23秒から2015年には約5秒へ短縮した（Billboard Top 100研究）。出典：https://sound.me/post/song-structure-tweaks-that-boost-creator-adoption-in-short-form 、https://www.chartlex.com/blog/marketing/hook-first-songwriting-tiktok-2026
- 確認できた事実（ガイド出典）：推奨される冒頭設計は、フェードインなしのコールドオープン、即時のモチーフ提示、小さな意外性、スマホスピーカーで判別できる音作り（Sound.me、上記出典）。
- Cafeシリーズでは、ピアノのモチーフを0秒から提示し、ベースとドラムは2〜4秒で合流させる「モチーフ先行型」が、ジャズの雰囲気を保ちながら冒頭の引きを作れる。

### 2〜10秒のメロディー展開

- 0〜2秒のモチーフを、2〜10秒で「反復＋小さな変化（オクターブ移動、装飾音、コードの借用）」で展開すると、視聴者は旋律を覚えつつ飽きない。10秒時点でループ冒頭に戻れる設計にすると、短尺動画の繰り返し再生と相性が良い。これは制作知見からの推測であり、個別曲の実測分析ではない。

### 感情表現と抑揚

- 確認できた事実：2026年10月の用途は「温かさ・居心地」（cozy）が中心で、激しい感情表現の曲は候補に挙がっていない。Mint Breeze は「キャプションと競合しない」ことが拡散理由と明記された。
- 抑揚は「小さい波を繰り返す」方がBGM向きである。大きなクレッシェンドやブレイクは、テキスト動画では読み手の注意を奪う。感情のピークは曲全体で1回、穏やかに置く。

### ループの自然さ

- 確認できた事実（ガイド出典）：Mubertのガイドは、大きなライザーや長いイントロは短いループの繰り返しのたびに衝撃になるため避けること、ループ長は15〜60秒が大多数のクリップに合うことを示す（出典は上記）。
- コード循環の終端と冒頭を同じ和音・同じモチーフで接続し、ドラムのフィルをループ境界に置かないことで、継ぎ目のないループになる。

### 動画BGMとしての適性（総括）

- テキスト／キャプション用途：音量は主役を邪魔しないことが前提。日本のTikTok音量ガイドでは、文字メイン動画のBGM音量目安は30〜50%とされる。出典：https://www.tiktokguide.jp/tiktok-volume-balance/
- 適性の条件をまとめると、(1) 冒頭即時のモチーフ、(2) 疎なドラム、(3) 循環コード、(4) 中音域で声や文字と競合しない旋律の音量・音域、(5) 15〜60秒でループ可能、の5点である（(1)(5)は出典あり、(2)(3)(4)はを含む整理）。

## 3. TikTokでの使用目的と、文字メッセージ動画に適した特徴

### 使用目的（確認できた事実）

調査報告書第2章Cのとおり。恋愛・メッセージ、思い出、カフェ、日常、風景、写真スライドショー、リラックス、旅行、食事、スキンケア、読書などが確認できた。ペット動画での使用は、今回の候補曲の用途解説では **確認できなかった（未確認）**。

### 文字メッセージを読ませる動画に適した音楽の特徴（分析）

出典で確認できた根拠：
- Self Aware（静かなインスト）が名言・メッセージテキスト動画に実際に使われ、累計約750万本規模（累計値）に達している
- Mint Breeze は「ボイスオーバーやキャプションと競合しないため広がった」と記事に明記されている
- 文字メイン動画のBGM音量目安は30〜50%（日本のTikTok音量ガイド）

上記から導ける設計条件は次のとおり。
- 歌詞がない（文字と意味が競合しない）
- 旋律の音域が中音域に収まり、音量変化が小さい（読む速度を音が引っ張らない）
- ドラムが疎で、拍の主張が弱い（黙読のリズムを乱さない）
- コードが循環し、展開の起伏が小さい（文章のどこで動画が終わっても不自然でない）
- テンポは70〜90 BPM帯（推奨帯の根拠は第2章のを参照）

## 4. FieldRiseの新曲制作への提案（Runa-Girl8215／Cafeシリーズ向け）

以下はすべて提案（未実施）であり、着手には社長の判断が必要である。既存曲のメロディーは模倣せず、上記の特徴のみを活用したオリジナル設計とする。

### 有望な音楽スタイル3種類

1. **テキスト動画向け「静かなカフェピアノ」**（期待度：最も高い）
根拠：Self Awareのテキスト動画実例と、Mint Breezeの「キャプションと競合しない」という記事明記。Cafeシリーズの既存曲「cafe（It's a rainy day, but you make my heart flutter..）」の世界観（雨の日、恋愛感情）とも一致し、恋愛メッセージ動画への展開が狙える。
2. **朝のコーヒー／日常Vlog向け「ソフトキーボードのカフェジャズポップ」**
根拠：Mint Breeze（UK1位）、Espresso Soul、Roast Reflections_mix と、コーヒー文脈のBGMが複数チャートイン。朝ルーティン・デスク・スキンケアなど用途の幅が広い。
3. **旅行／ライフスタイル向け「明るいスムースジャズ（ピアノ主導アレンジ）」**
根拠：Sunset in Girona が10月を通して週次1位級。ただし原曲はサックス主導のため、Cafeシリーズではピアノを主旋律に置き換えたアレンジで差別化する（模倣ではなく編成の置換）。

### 推奨BPMと根拠

- スタイル1（テキスト動画）：**72〜86 BPM**。Lo-fi帯（70〜90 BPM、Tunee出典）と、From The Start の確認値82 BPMがこの帯に収まることからの帰納。
- スタイル2（カフェ／日常）：**88〜102 BPM**。Mubertガイドの安定グルーヴ帯（85〜100／90〜105 BPM）と、Aruarian Dance の確認値99〜100 BPMからの帰納。
- スタイル3（旅行／明るい）：**104〜118 BPM**。Espresso Soul の参考値109 BPMと、ジャズハウス系の119 BPM（berlioz「deep in it」、Tunebat系出典 https://tunebat.com/Info/Life-Will-Be-Cleo-Sol/4ZTC6KvnQxloiwmT0Yhypy ）の下限側からの帰納。文字読み用途には速い場面があるため、用途を旅行・ファッション系に限定する。

いずれも統計的裏付けのある最適値ではなく、試作→実測で検証すべき制作仮説である。

### ピアノメロディーの構成

- 4〜8音の短いモチーフを核にし、順次進行を中心とする（第2章参照）
- モチーフは曲の最初と、ループの継ぎ目に必ず戻る位置に置く
- アドリブ区間は短く（8小節程度）し、モチーフの変奏として扱う

### 冒頭0〜2秒の設計

- フェードインなし。0秒からピアノのモチーフを提示する（出典：Sound.meの冒頭設計）
- ベースとドラムは2〜4秒で静かに合流させる
- スマホスピーカーでモチーフが判別できる音域（中〜高音域）に置く

### ベース・ドラムの適切な配置

- ベース：ルート＋5度のホールノート基調。スタイル2以上でのみ、控えめなウォーキングを部分使用
- ドラム：ブラシ／リムショット中心。キックは小節頭と3拍目程度。ハイハットは8分音符までとし、16分音符の細かい刻みは避ける

### TikTok向けの推奨使用区間

- 冒頭0〜30秒を「公式サウンドの推奨区間」として設計する。0〜2秒でモチーフ、2〜10秒で展開、15〜30秒で自然にループへ戻る構成
- 別途、15秒版のループ専用カットを用意し、テキスト動画クリエイターが使いやすい形でSoundOnのTikTokプレリリースに載せることを提案する（実施は社長判断）

### Suno AIで試作するための英語プロンプト3種類

いずれもオリジナル生成用であり、既存曲名・アーティスト名は含めない。

プロンプト1（スタイル1：テキスト動画向け）
```
Instrumental cafe jazz piano, 78 BPM, gentle solo piano playing a simple memorable 6-note motif from the very first second, no fade-in, soft brushed drums entering quietly, warm upright bass playing long root notes, ii-V-I chord loop that repeats seamlessly, cozy rainy-day cafe mood, bittersweet but warm, no vocals, no lyrics, smooth loopable background music for reading text on screen, soft and even dynamics
```

プロンプト2（スタイル2：朝のコーヒー／日常Vlog向け）
```
Instrumental smooth cafe jazz, 96 BPM, mellow electric piano and soft acoustic piano melody, light bossa-touched rhythm, gentle snare on beats 2 and 4, warm walking-free bass line with root and fifth notes, bright morning coffee mood, clean and airy mix, catchy short motif repeated with small variations, no vocals, loopable background music for morning routine vlogs
```

プロンプト3（スタイル3：旅行／ライフスタイル向け）
```
Instrumental smooth jazz, 112 BPM, piano-led melody with a warm saxophone answering in short phrases, smooth electric guitar chords, relaxed grooving drums with soft rim clicks, upright bass, sunny travel and seaside cafe atmosphere, elegant and uplifting, memorable hook in the first two seconds, no vocals, seamless loop, background music for travel and lifestyle videos
```

## 5. 仮説・未確認事項（分析編）

- 候補1〜7（2026年10月チャート曲）のBPM・キー・コード進行は、全て **未確認**（無料BPMデータベース未収録、または一次資料なし）。本分析のBPM推奨は、比較対象の確認値とガイド出典からのである
- 各候補曲の冒頭0〜2秒／2〜10秒の実際の音の展開は、音源の直接解析を行っていないため **未確認**。第2章の該当項目は、出典のある一般原則とで構成した
- Sunoプロンプトの生成結果が推奨BPM・構成どおりになるかは未検証。試作後の実測（BPM計測、冒頭の聴感確認）が必要
- 季節性（cozy fall）の影響範囲は未確認。11月以降の週次チャートとの比較で検証可能

## 6. FieldRiseへの改善提案

1. **試作と検証のサイクル化（優先度：高）** — 上記プロンプト3種で各2〜3テイク試作し、BPM実測・冒頭2秒のモチーフ判別・ループ継ぎ目をチェックリストで検証してから、社長へ試聴候補を提出する運用を提案する。
2. **自社曲のTikTok採用データの蓄積（優先度：高）** — Cafeシリーズ各曲のTikTok音源ページの累計使用数を週1回記録し、自社で差分（≒週間増分）を算出できるようにする。外部チャートの遡及不能への自社側の対策になる。
3. **テキスト動画クリエイターへの働きかけの下準備（優先度：中）** — スタイル1の新曲が完成した際、名言・恋愛メッセージ系の投稿フォーマット例（文字量、表示秒数、BGM音量30〜50%）を添えて公開すると、採用されやすくなる可能性がある。実施は公開承認の範囲内で行う。

## 7. 引き継ぎ事項

- **彩花CTO:** BPM推奨帯と冒頭設計はを含む制作仮説です。技術検証として、試作テイクのBPM実測方法と、ループ検証の手順についてご確認ください。
- **桃花COO:** スタイル1〜3の優先順位は、Cafeシリーズのブランド方針（最重要ミッション：Cafeシリーズを世界で愛されるBGMブランドへ）との整合確認をお願いします。TikTokプレリリースと自社投稿の連携はCOOの定時業務との調整が必要です。
- **社長の判断が必要な事項:** (1) プロンプト3種による新曲試作の着手可否。(2) 試作に使うSunoの利用条件（既存契約の範囲内か）の確認。(3) 15秒ループ版の制作可否。

## 8. セキュリティ・費用確認

- 公開してよい情報のみ含む: はい
- 有料API・追加課金: なし（Suno試作は未実施。実施時は既存契約の範囲か社長確認が必要）
- SNS投稿・楽曲公開: 行っていない（分析と提案のみ）
- 既存曲の模倣: 行っていない（特徴の分析とオリジナル設計の提案のみ）
