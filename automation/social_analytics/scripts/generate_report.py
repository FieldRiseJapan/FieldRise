#!/usr/bin/env python3
"""Generate evidence-led social analytics reports from normalized JSON snapshots.

The script intentionally refuses to fabricate missing platform data. It creates charts
only for observed source data and marks pending owner-only analytics explicitly.
"""
from __future__ import annotations

import json
import textwrap
from datetime import datetime
from pathlib import Path
from typing import Any

import matplotlib as mpl
import matplotlib.pyplot as plt
import numpy as np

ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
REPORT_DIR = ROOT / "reports"
CHART_DIR = REPORT_DIR / "charts"

PALETTE = {
    "blue": "#4080FF",
    "sky": "#57A9FB",
    "teal": "#37D4CF",
    "green": "#23C343",
    "yellow": "#FBE842",
    "orange": "#FF9A2E",
    "gray": "#A9AEB8",
    "text": "#1E293B",
    "grid": "#D9DEE7",
}


def configure_style() -> None:
    """Apply white, minimalist theme and a Japanese CJK font before plotting."""
    mpl.rcdefaults()
    mpl.rcParams.update(
        {
            "font.family": "Noto Sans CJK JP",
            "font.sans-serif": ["Noto Sans CJK JP", "Noto Sans CJK", "DejaVu Sans"],
            "axes.unicode_minus": False,
            "figure.facecolor": "white",
            "axes.facecolor": "white",
            "axes.edgecolor": "#E5E7EB",
            "axes.labelcolor": PALETTE["text"],
            "xtick.color": PALETTE["text"],
            "ytick.color": PALETTE["text"],
            "text.color": PALETTE["text"],
            "axes.titleweight": "bold",
            "axes.titlesize": 15,
            "axes.labelsize": 10.5,
            "xtick.labelsize": 9.5,
            "ytick.labelsize": 9.5,
            "savefig.dpi": 180,
            "savefig.bbox": "tight",
            "savefig.facecolor": "white",
        }
    )


def load_json(filename: str) -> dict[str, Any]:
    with (DATA_DIR / filename).open(encoding="utf-8") as f:
        return json.load(f)


def save_figure(fig: plt.Figure, filename: str) -> str:
    CHART_DIR.mkdir(parents=True, exist_ok=True)
    path = CHART_DIR / filename
    fig.savefig(path)
    plt.close(fig)
    return f"charts/{filename}"


def style_axis(ax: plt.Axes, axis: str = "y") -> None:
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    ax.spines["left"].set_color("#E5E7EB")
    ax.spines["bottom"].set_color("#E5E7EB")
    ax.grid(axis=axis, color=PALETTE["grid"], linestyle=(0, (1.2, 2.4)), linewidth=0.85)
    ax.set_axisbelow(True)


def short_label(value: str, width: int = 15) -> str:
    return "\n".join(textwrap.wrap(value, width=width, break_long_words=False))


def pct(value: float) -> str:
    return f"{value * 100:.1f}%"


def plot_instagram_posts(posts: list[dict[str, Any]]) -> str:
    labels = ["カルーセル", "リール（直近）", "リール（最高反応）"]
    views = [post["views"] for post in posts]
    interactions = [post["interactions"] for post in posts]
    x = np.arange(len(posts))
    width = 0.35

    fig, ax = plt.subplots(figsize=(10.5, 5.8))
    bars1 = ax.bar(x - width / 2, views, width, label="再生・表示回数", color=PALETTE["blue"])
    bars2 = ax.bar(x + width / 2, interactions, width, label="総インタラクション", color=PALETTE["teal"])
    ax.bar_label(bars1, padding=4, fontsize=9)
    ax.bar_label(bars2, padding=4, fontsize=9)
    ax.set_title("Instagram：投稿別の露出と反応（累積）", loc="left", pad=16)
    ax.set_ylabel("件数")
    ax.set_xticks(x, labels)
    ax.legend(frameon=False, loc="upper left", ncols=2)
    style_axis(ax)
    fig.text(0.125, 0.01, "出所：Instagram Business Account の投稿インサイト（取得日時：2026-08-16）", fontsize=8.5, color="#64748B")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    return save_figure(fig, "instagram_post_performance.png")


def plot_instagram_engagement(posts: list[dict[str, Any]]) -> str:
    reel_posts = [p for p in posts if p["format"] == "reel" and p["reach"] > 0]
    labels = ["直近リール", "最高反応リール"]
    rates = [p["interactions"] / p["reach"] * 100 for p in reel_posts]

    fig, ax = plt.subplots(figsize=(8.8, 5.3))
    bars = ax.bar(labels, rates, color=[PALETTE["sky"], PALETTE["green"]], width=0.54)
    ax.bar_label(bars, labels=[f"{rate:.1f}%" for rate in rates], padding=5, fontsize=10)
    ax.set_title("Instagram：リールのリーチ当たり反応率", loc="left", pad=16)
    ax.set_ylabel("総インタラクション ÷ リーチ（%）")
    ax.set_ylim(0, max(rates) * 1.28)
    style_axis(ax)
    fig.text(0.125, 0.01, "注：リーチ1件のカルーセルは比較の安定性が低いため除外。", fontsize=8.5, color="#64748B")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    return save_figure(fig, "instagram_reel_engagement_rate.png")


def plot_youtube_top_videos(videos: list[dict[str, Any]]) -> str:
    top = sorted(videos, key=lambda x: x["views"], reverse=True)[:10]
    labels = [short_label(video["title"], 20) for video in reversed(top)]
    values = [video["views"] for video in reversed(top)]

    fig, ax = plt.subplots(figsize=(11.2, 7.2))
    bars = ax.barh(labels, values, color=[PALETTE["blue"], PALETTE["sky"], PALETTE["teal"], PALETTE["green"], PALETTE["yellow"], PALETTE["orange"], PALETTE["gray"], PALETTE["sky"], PALETTE["teal"], PALETTE["blue"]])
    ax.bar_label(bars, padding=4, fontsize=9, fmt="%d")
    ax.set_title("YouTube：取得済み動画の視聴上位10本", loc="left", pad=16)
    ax.set_xlabel("再生数")
    style_axis(ax, axis="x")
    fig.text(0.125, 0.01, "出所：YouTube Data APIまたは公開チャンネルの取得済みデータ", fontsize=8.5, color="#64748B")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    return save_figure(fig, "youtube_top10_public_views.png")


def plot_youtube_categories(videos: list[dict[str, Any]]) -> str:
    categories: dict[str, list[int]] = {}
    for video in videos:
        categories.setdefault(video["category"], []).append(video["views"])
    ordered = sorted(categories.items(), key=lambda item: sum(item[1]), reverse=True)
    labels = [item[0].upper() if item[0] == "edm" else item[0].capitalize() for item in ordered]
    values = [sum(item[1]) for item in ordered]

    fig, ax = plt.subplots(figsize=(9.8, 5.7))
    bars = ax.bar(labels, values, color=[PALETTE["blue"], PALETTE["sky"], PALETTE["teal"], PALETTE["green"], PALETTE["yellow"], PALETTE["orange"], PALETTE["gray"]])
    ax.bar_label(bars, padding=4, fontsize=9)
    ax.set_title("YouTube：確認できた動画のテーマ別累積再生数", loc="left", pad=16)
    ax.set_ylabel("再生数")
    style_axis(ax)
    fig.text(0.125, 0.01, f"注：取得済み動画{len(videos)}本をテーマ分類して集計。", fontsize=8.5, color="#64748B")
    fig.tight_layout(rect=(0, 0.04, 1, 1))
    return save_figure(fig, "youtube_category_public_views.png")


def build_instagram_report(data: dict[str, Any], chart_posts: str, chart_rate: str) -> str:
    posts = data["posts"]
    total_reach = sum(p["reach"] for p in posts)
    total_views = sum(p["views"] for p in posts)
    total_interactions = sum(p["interactions"] for p in posts)
    best = max(posts, key=lambda p: p["interactions"] / p["reach"] if p["reach"] else 0)
    reel_posts = [p for p in posts if p["format"] == "reel"]
    best_reel = max(reel_posts, key=lambda p: p["interactions"] / p["reach"])

    return f"""# Instagramフル分析レポート

**対象アカウント:** [@{data['account']['username']}](https://www.instagram.com/{data['account']['username']}/)  
**分析基準日:** 2026-08-16  
**データ範囲:** 接続済みInstagram Business Accountのアカウント概要・公開投稿3件・投稿インサイト

## エグゼクティブサマリー

取得時点でアカウントは投稿3件、フォロワー数はAPI応答上0件でした。投稿合計では、リーチ**{total_reach:,}**、再生・表示**{total_views:,}**、総インタラクション**{total_interactions:,}**を記録しています。最高反応のリールは2026年4月6日投稿で、リーチ175、再生183、総インタラクション23（リーチ当たり**{pct(best_reel['interactions']/best_reel['reach'])}**）でした。

小標本のため結論は暫定的ですが、リールは2本合計で再生298・総インタラクション24となり、カルーセルの再生3・総インタラクション1を大きく上回りました。特に、いいね19・保存2・シェア1を得た最高反応リールは、単なる表示よりも再閲覧や共有につながる可能性を示します。今後はこの動画の音楽テーマ、サムネイル、公開時間、説明文を再現可能な形で記録し、同条件のリールで検証します。

| 指標 | 値 | 算出・注記 |
|---|---:|---|
| フォロワー数 | 0 | API返却値。異常または初期状態の可能性があるため、フォロワー基準ERは不使用 |
| 投稿数 | 3 | アカウント累計 |
| 合計リーチ | {total_reach:,} | 投稿3件の累計 |
| 合計再生・表示 | {total_views:,} | 投稿3件の累計 |
| 合計総インタラクション | {total_interactions:,} | 投稿インサイトの累計 |
| リーチ当たり反応率 | {pct(total_interactions/total_reach)} | 参考値。フォロワー基準ではない |

## 投稿パフォーマンス

![Instagram投稿別の露出と反応]({chart_posts})

*図1. 各画像は個別PNGとして保存しています。最高反応リールは、リーチ・再生・反応のすべてで主要な貢献をしています。*

![Instagramリールのリーチ当たり反応率]({chart_rate})

*図2. リーチが1件のカルーセルは比率が不安定なため、リール同士で比較しています。*

| 投稿形式 | 公開日（UTC） | リーチ | 再生・表示 | 総反応 | リーチ当たり反応率 | 主な内訳 |
|---|---|---:|---:|---:|---:|---|
| カルーセル | 2026-05-31 | 1 | 3 | 1 | 100.0%* | いいね0、保存0、シェア0 |
| リール | 2026-05-30 | 105 | 115 | 1 | 1.0% | いいね1、保存0、シェア0 |
| リール | 2026-04-06 | 175 | 183 | 23 | 13.1% | いいね19、保存2、シェア1 |

> * リーチが極端に小さいため、カルーセルの比率は実務上の比較対象から除外します。

## 分析上の示唆

最高反応リールは、直近リールと比べてリーチが1.7倍、再生が1.6倍、総反応が23倍でした。現時点ではキャプション情報が欠けるため因果は断定できませんが、次回からはコンテンツテーマ、使用音源、尺、冒頭3秒、CTA、投稿時間をデータに追加し、保存・共有を優先KPIとして検証することが重要です。

> **実測値と推測の区別:** 上記の件数は実測値です。一方で「何が反応を生んだか」は現データだけでは確定できないため、仮説として扱います。

## 制約と次回更新での追加項目

アカウント集計値は取得時点の累積値であり、日次推移、ストーリーズ、フォロワー増減、広告寄与は含みません。フォロワー数が0と返却されている点も含め、今後は公式APIからの継続収集および日次スナップショットを行います。

## 参照

[1]: https://www.instagram.com/{data['account']['username']}/ "Instagramプロフィール"
[2]: https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-media/insights "Instagram Graph API：メディアインサイト"
"""


def build_youtube_report(data: dict[str, Any], chart_top: str, chart_categories: str) -> str:
    videos = data["videos_observed"]
    observed_total = sum(v["views"] for v in videos)
    top = sorted(videos, key=lambda x: x["views"], reverse=True)
    top3 = top[:3]
    top3_views = sum(v["views"] for v in top3)
    cafe_recent = [v for v in videos if v["category"] == "cafe"]
    source = data.get("source", "YouTube公開データ")
    captured_at = data.get("captured_at", "")
    account_total = data['account'].get('public_video_count', len(videos))
    coverage_note = f"取得済み動画{len(videos):,}本（公開動画数{account_total:,}本）"

    return f"""# YouTubeフル分析レポート（公開データ版）

**対象チャンネル:** [@{data['account']['handle']}]({data['account']['channel_url']})  
**分析基準日:** {captured_at or '最新取得時点'}  
**データ範囲:** {source}。{coverage_note}

## エグゼクティブサマリー

チャンネルの公開統計では、登録者数は**{data['account']['subscribers']:,}**、公開動画数は**{data['account']['public_video_count']:,}**です。{coverage_note}の累計再生数は**{observed_total:,}**であり、上位3本（「{top3[0]['title']}」「{top3[1]['title']}」「{top3[2]['title']}」）が**{top3_views:,}**再生を占めました。これは取得対象の累計再生の**{pct(top3_views/observed_total)}**に相当し、視聴が一部タイトルに集中していることを示します。

一方で、チャンネル説明が掲げるCafé Seriesの直近2本は、公開表示上それぞれ63回・13回でした。これだけでシリーズの将来性を判断することはできませんが、既存の高再生群がEDM・冬季テーマ・長尺コンピレーションを含むため、Café Seriesは一貫したサムネイル、タイトル語彙、再生リスト、短尺誘導を組み合わせ、独立した視聴導線として育てる余地があります。

| 指標 | 値 | 注記 |
|---|---:|---|
| 登録者数 | {data['account']['subscribers']:,} | 公開統計 |
| 公開動画数 | {data['account']['public_video_count']:,} | 公開統計 |
| 取得動画数 | {len(videos):,} | {source} |
| 取得動画の累計再生数 | {observed_total:,} | 同上 |
| 視聴上位3本の累計再生数 | {top3_views:,} | 観測対象に対する比率は{pct(top3_views/observed_total)} |
| Café Series確認動画 | {len(cafe_recent):,} | 直近の公開動画2本 |

## 視聴パフォーマンス

![YouTube視聴上位10本]({chart_top})

*図1. 各画像は個別PNGとして保存しています。取得済み動画のうち、視聴上位10本を示します。*

![YouTubeテーマ別累積再生数]({chart_categories})

*図2. 取得済み動画{len(videos):,}本をテーマ分類した累積再生数です。*

| 順位 | 動画 | 公開表示の再生数 | テーマ |
|---:|---|---:|---|
""" + "\n".join(
        f"| {i} | [{video['title']}](https://www.youtube.com/watch?v={video['id']}) | {video['views']:,} | {video['category']} |"
        for i, video in enumerate(top[:10], start=1)
    ) + f"""

## 分析上の示唆

公開データの範囲では、上位コンテンツは季節・感情・ジャンルを明示したタイトルと、複数曲をまとめた長尺作品に偏っています。Café Seriesはチャンネルの説明文と直接整合するため、今後はタイトルの先頭に用途語（例：focus、reading、work）を置き、同じシリーズ名・視覚ルール・再生リストを固定し、長尺版からShorts／Instagram Reels／TikTokへの導線を一本化することが検証可能な仮説です。

> **実測値と推測の区別:** 再生数・登録者数は公開表示の実測値です。CTR、視聴者維持率、流入元、収益、視聴者属性は未取得であり、上記の打ち手は仮説です。

## 制約と次回更新での追加項目

本レポートはYouTube Data APIで取得できる公開統計を対象にしています。YouTube Analytics APIの認可後は、日次の視聴回数、総再生時間、平均視聴時間、インプレッションCTR、登録者増減、トラフィックソース、視聴者維持率を追加し、公開データ版を所有者分析版へ更新します。

## 参照

[1]: {data['account']['channel_url']} "YouTubeチャンネル"
[2]: https://developers.google.com/youtube/analytics/reference/reports/query "YouTube Analytics API：reports.query"
[3]: https://developers.google.com/youtube/v3/docs/channels "YouTube Data API：channels"
"""


def build_tiktok_report() -> str:
    return """# TikTokフル分析レポート（認可待ち）

**対象アカウント:** [@fieldrizejapan](https://www.tiktok.com/@fieldrizejapan)  
**分析基準日:** 2026-08-16

## 現在の状態

公開プロフィールはブラウザ上で安定して取得できず、所有者向けのTikTok API認可も未完了です。そのため、フォロワー数、累積いいね数、動画別視聴数、保存数、シェア数を推測・代入せず、初期レポートでは数値分析を保留します。

## 認可後に実行するフル分析

| 分析領域 | 取得・算出する指標 |
|---|---|
| アカウント成長 | フォロワー数、累計いいね数、動画本数、日次・週次増減 |
| 投稿パフォーマンス | 再生数、いいね、コメント、シェア、保存、完了率（取得可能な場合） |
| コンテンツ分析 | テーマ、尺、フック、音源、投稿時間、ハッシュタグ別の中央値比較 |
| クロスチャネル導線 | YouTube・Instagramへの誘導設計、シリーズ別の再利用率 |

## データ接続要件

TikTok Display APIでは、認可済みユーザーのプロフィールと公開動画を取得できます。動画詳細では`like_count`、`comment_count`、`share_count`、`view_count`を指定できます。[1] [2] アクセストークンは短期間で失効するため、公式のリフレッシュトークン運用が必要です。[3]

> **実測値と推測の区別:** このレポートには未取得のTikTok数値を含めません。認可が完了した最初の実行時に、実データのみで個別グラフを生成します。

## 参照

[1]: https://developers.tiktok.com/doc/display-api-overview "TikTok Display API overview"
[2]: https://developers.tiktok.com/doc/tiktok-api-v2-video-query "TikTok Video Query"
[3]: https://developers.tiktok.com/doc/oauth-user-access-token-management "TikTok OAuth Access Token Management"
"""


def build_summary(instagram: dict[str, Any], youtube: dict[str, Any]) -> str:
    return f"""# Social Analytics — Latest Report Index

**Generated:** {datetime.now().astimezone().strftime('%Y-%m-%d %H:%M %Z')}  
**Owner:** FieldRiseJapan

## Report links

| Platform | Account | Current report | Data status |
|---|---|---|---|
| TikTok | @fieldrizejapan | [TikTok report](tiktok_full_analysis.md) | Official API authorization pending |
| Instagram | @runa_girl8215 | [Instagram report](instagram_full_analysis.md) | Owner-level post insights captured |
| YouTube | @Runa-Girl8215 | [YouTube report](youtube_full_analysis.md) | Public baseline captured; owner analytics authorization pending |

## Morning report rule

The automated morning report should contain the permanent URL of this index and the three platform reports. It must state data freshness and any platform whose latest refresh did not complete.

## Visual asset index

Each visualization is stored and rendered independently:

| Chart | File |
|---|---|
| Instagram: post performance | [PNG](charts/instagram_post_performance.png) |
| Instagram: reel engagement rate | [PNG](charts/instagram_reel_engagement_rate.png) |
| YouTube: top 10 public views | [PNG](charts/youtube_top10_public_views.png) |
| YouTube: category public views | [PNG](charts/youtube_category_public_views.png) |

## References

[1]: https://developers.tiktok.com/doc/display-api-overview "TikTok Display API"
[2]: https://developers.line.biz/en/docs/messaging-api/sending-messages/ "LINE Messaging API"
[3]: https://developers.google.com/youtube/analytics/reference/reports/query "YouTube Analytics API"
"""


def main() -> None:
    configure_style()
    instagram = load_json("instagram_latest.json")
    youtube = load_json("youtube_latest.json")
    REPORT_DIR.mkdir(parents=True, exist_ok=True)

    ig_chart_posts = plot_instagram_posts(instagram["posts"])
    ig_chart_rate = plot_instagram_engagement(instagram["posts"])
    yt_chart_top = plot_youtube_top_videos(youtube["videos_observed"])
    yt_chart_categories = plot_youtube_categories(youtube["videos_observed"])

    (REPORT_DIR / "instagram_full_analysis.md").write_text(
        build_instagram_report(instagram, ig_chart_posts, ig_chart_rate), encoding="utf-8"
    )
    (REPORT_DIR / "youtube_full_analysis.md").write_text(
        build_youtube_report(youtube, yt_chart_top, yt_chart_categories), encoding="utf-8"
    )
    (REPORT_DIR / "tiktok_full_analysis.md").write_text(build_tiktok_report(), encoding="utf-8")
    (REPORT_DIR / "latest_report.md").write_text(build_summary(instagram, youtube), encoding="utf-8")
    print("Generated reports and individual CJK-compatible chart images.")


if __name__ == "__main__":
    main()
