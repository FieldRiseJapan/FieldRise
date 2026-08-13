/**
 * Sonata Desk — FieldRise Music AI の運用ダッシュボード。
 * 生成りの紙面、楽譜の時間軸、深いモスグリーンで「静謐・精密・実直」を表現する。
 * GitHubを唯一の正本とし、画面は001・002再現研究の表示・比較・参照層に徹する。
 */
import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  AudioLines,
  BookOpen,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileAudio,
  FileCheck2,
  Github,
  Leaf,
  Menu,
  PauseCircle,
  PlayCircle,
  Search,
  Sparkles,
  TableProperties,
  X,
} from "lucide-react";

const heroImage = "/assets/fieldrise-hero-cafe.jpg";
const deskImage = "/assets/fieldrise-research-desk.jpg";
const pianoImage = "/assets/fieldrise-piano-detail.jpg";
const brandMark = "/assets/fieldrise-mark.png";

const githubRoot = "https://github.com/FieldRiseJapan/FieldRise/blob/main/";
const rawRoot = "https://raw.githubusercontent.com/FieldRiseJapan/FieldRise/main/";

const sources = {
  a1: `${githubRoot}music_ai/experiments/A1_001-002-ground-truth-capture.md`,
  patterns: `${githubRoot}music_ai/suno_database/successful_patterns.md`,
  report: `${githubRoot}music_ai/reports/cafe/latest_report.md`,
  audioLedger: `${githubRoot}music_ai/reference_music/audio/README.md`,
  groundTruth: `${githubRoot}music_ai/reference_music/ground_truth_spec_v1.md`,
  song001: `${githubRoot}music_ai/reference_music/success_song_001.md`,
  song002: `${githubRoot}music_ai/reference_music/success_song_002.md`,
  issue: "https://github.com/FieldRiseJapan/FieldRise/issues/2",
};

const navigation = [
  { id: "overview", label: "概況", icon: TableProperties },
  { id: "references", label: "001・002比較", icon: AudioLines },
  { id: "a1", label: "A1進捗", icon: FileCheck2 },
  { id: "ledger", label: "検証台帳", icon: Clock3 },
  { id: "patterns", label: "Pattern DB", icon: BookOpen },
  { id: "sources", label: "参照音源", icon: FileAudio },
];

const fallbackReferenceTracks = [
  {
    id: "001",
    sourceType: "正本 Main / 可逆FLAC",
    status: "verified",
    statusLabel: "正本・検証済み",
    duration: "222.400 sec",
    sampleRate: "48 kHz / Stereo",
    bpm: "86.13 BPM*",
    bassOnset: "0.464 sec",
    introBass: "98.73%",
    drumsRms: "−57.36 dBFS",
    summary: "受領Mainを可逆圧縮。復号FLACのPCM MD5は元WAVと一致し、4ステムはStudio Mainを相関1.000000で再構成。",
    audio: `${rawRoot}music_ai/reference_music/audio/001_reference_main.flac`,
    source: sources.song001,
  },
  {
    id: "002",
    sourceType: "暫定 Main / 4-stem mix FLAC",
    status: "pending",
    statusLabel: "暫定・正式Main待ち",
    duration: "212.920 sec",
    sampleRate: "44.1 kHz / Stereo",
    bpm: "80.75 BPM*",
    bassOnset: "0.464 sec",
    introBass: "84.21%",
    drumsRms: "−62.82 dBFS",
    summary: "受領Mainは無音（RMS −240 dBFS）。Bass・Drums・その他・ボーカルをゲイン正規化なしで合成した暫定参照Main。",
    audio: `${rawRoot}music_ai/reference_music/audio/002_reference_stem_mix.flac`,
    source: sources.song002,
  },
];

const fallbackA1Gates = [
  { id: "G01", label: "冒頭 0–2秒", state: "measured", note: "Bass Onsetを両曲で0.464秒に観測" },
  { id: "G02", label: "Bass 音質", state: "pending", note: "周波数特徴は測定済み。音色の聴取記録が必要" },
  { id: "G03", label: "Piano / Keys の間", state: "pending", note: "その他ステムの導入時刻は取得済み。聴感確認が必要" },
  { id: "G04", label: "BPM・シーン適合", state: "measured", note: "推定80–86 BPM帯を確認" },
  { id: "G05", label: "音圧・ダイナミクス", state: "partial", note: "001は測定済み。002は正式Main待ち" },
  { id: "G06", label: "構成", state: "partial", note: "Introイベントのみ実測済み" },
  { id: "G07", label: "不要ノイズ", state: "pending", note: "人の聴取とタイムコードが必要" },
  { id: "G08", label: "Loop 接続", state: "partial", note: "001は近似値取得済み。最終判定は聴取待ち" },
  { id: "G09", label: "001 / 002 比較", state: "measured", note: "共通固定条件と差分変数を定義済み" },
];

const fallbackLedgerRows = [
  {
    id: "A1",
    title: "001・002 正解データ取得",
    variable: "なし — 新規生成をしない",
    outcome: "実測完了 / holdあり",
    note: "001は整合確認済み。002は正式Main待ち。",
    tone: "border-[#C9D8CB] bg-[#E8F0E9] text-[#244131]",
  },
  {
    id: "B1",
    title: "その他ステムの導入時刻比較",
    variable: "0.3 sec vs 2.3 sec のみ",
    outcome: "設計済み / 承認待ち",
    note: "Bass・Tempo・Drums・非ボーカル主導を固定。",
    tone: "border-[#E0CBA8] bg-[#F8F0E1] text-[#7B5A2D]",
  },
];

const fallbackPatterns = [
  { id: "P-S-002", label: "confirmed", title: "0.5秒未満のBass立ち上がり", body: "001・002ともBass Onsetは0.464秒。B1では固定条件。", tone: "bg-[#E8F0E9] text-[#244131]" },
  { id: "P-S-004", label: "confirmed", title: "低域主導・控えめなDrums", body: "Intro 0–2秒のBass低域比率は84–99%。DrumsはBassより大幅に低い。", tone: "bg-[#E8F0E9] text-[#244131]" },
  { id: "P-S-005", label: "confirmed", title: "80–86 BPM帯", body: "両曲の推定テンポを根拠に、B1ではテンポを変数にしない。", tone: "bg-[#E8F0E9] text-[#244131]" },
  { id: "P-S-006", label: "confirmed", title: "非ボーカル主導", body: "ボーカルステムは主成分より大幅に低く、Voiceover-friendlyを維持する。", tone: "bg-[#E8F0E9] text-[#244131]" },
  { id: "P-S-001", label: "provisional", title: "Piano / Keys の間", body: "伴奏の音数と間は聴取確認前。B1では導入時刻を単独で比較する。", tone: "bg-[#F8F0E1] text-[#7B5A2D]" },
  { id: "P-F-003", label: "confirmed", title: "無音Mainを正本にしない", body: "002の受領Mainは無音。暫定参照Mainを明示し、正式版と混同しない。", tone: "bg-[#F7EAE5] text-[#8C4634]" },
];

const stateStyle = {
  measured: { label: "実測済み", className: "bg-[#E8F0E9] text-[#244131]" },
  partial: { label: "一部実測", className: "bg-[#F8F0E1] text-[#7B5A2D]" },
  pending: { label: "聴取待ち", className: "bg-[#F7EAE5] text-[#8C4634]" },
};

type SyncReference = {
  id: string; sourceType: string; status: string; statusLabel: string; duration: string; sampleRate: string;
  bpm: string; bassOnset: string; introBass: string; drumsRms: string; summary: string; audioPath: string; sourcePath: string;
};
type SyncGate = { id: string; label: string; state: "measured" | "partial" | "pending"; note: string };
type SyncLedger = { id: string; title: string; variable: string; outcome: string; note: string };
type SyncPattern = { id: string; kind: string; label: string; title: string; body: string; evidence: string };
type SyncData = { sourceDigest: string; references: SyncReference[]; a1: { status: string; gates: SyncGate[] }; ledger: SyncLedger[]; patterns: SyncPattern[] };

const dashboardDataUrl = "https://raw.githubusercontent.com/FieldRiseJapan/FieldRise/main/dashboard/sonata-desk/src/generated/dashboard-data.json";

function syncTone(label: string) {
  if (label === "confirmed") return "bg-[#E8F0E9] text-[#244131]";
  if (label === "deprecated") return "bg-[#F7EAE5] text-[#8C4634]";
  return "bg-[#F8F0E1] text-[#7B5A2D]";
}

function toTrack(track: SyncReference) {
  return { ...track, duration: track.duration.replace("秒", " sec"), audio: `${rawRoot}${track.audioPath}`, source: `${githubRoot}${track.sourcePath}` };
}

function toLedger(row: SyncLedger) {
  const tone = row.id === "A1" ? "border-[#C9D8CB] bg-[#E8F0E9] text-[#244131]" : "border-[#E0CBA8] bg-[#F8F0E1] text-[#7B5A2D]";
  return { ...row, tone };
}

function Rule({ className = "" }: { className?: string }) {
  return <span className={`block h-px bg-[#D8D0C1] ${className}`} aria-hidden="true" />;
}

function ScoreRuler({ start, end, note }: { start: string; end: string; note: string }) {
  return (
    <div className="mt-5 flex items-center gap-3 font-mono text-[9px] tracking-[0.12em] text-[#827A6F]" aria-label={`${start}から${end}までの検証ルーラー：${note}`}>
      <span className="shrink-0">{start}</span>
      <span className="relative h-4 flex-1 overflow-hidden border-y border-[#CFC7B7]" style={{ backgroundImage: "repeating-linear-gradient(90deg, transparent 0, transparent 17px, rgba(104, 101, 92, 0.38) 17px, rgba(104, 101, 92, 0.38) 18px)" }}>
        <span className="absolute left-[20%] top-[-1px] h-4 w-[42%] rounded-[50%] border-t border-[#3F5D4B]" />
      </span>
      <span className="shrink-0 text-[#3F5D4B]">{end}</span>
      <span className="hidden shrink-0 text-[#A2865C] sm:inline">{note}</span>
    </div>
  );
}

function DecisionNote({ title, body, action, href }: { title: string; body: string; action: string; href: string }) {
  return (
    <aside className="border-l-2 border-[#3F5D4B] bg-[#ECE9DF] p-5 sm:p-6">
      <p className="font-mono text-[9px] tracking-[0.16em] text-[#4F6B5A]">CURRENT DECISION</p>
      <h3 className="mt-3 font-serif text-[21px] font-semibold leading-tight tracking-[-0.03em] text-[#24352A]">{title}</h3>
      <p className="mt-3 text-[12px] leading-6 text-[#5D625B]">{body}</p>
      <div className="mt-5"><SourceLink href={href}>{action}</SourceLink></div>
    </aside>
  );
}

function SourceLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 border-b border-[#3F5D4B]/40 pb-0.5 text-[11px] font-semibold text-[#31513E] transition-colors hover:border-[#31513E] hover:text-[#1F3829]">
      {children}<ArrowUpRight className="h-3 w-3" />
    </a>
  );
}

export default function Home() {
  const [activeSection, setActiveSection] = useState("overview");
  const [menuOpen, setMenuOpen] = useState(false);
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [syncState, setSyncState] = useState<"checking" | "synced" | "fallback">("checking");

  useEffect(() => {
    let active = true;
    fetch(dashboardDataUrl, { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error(`GitHub display data: ${response.status}`);
        return response.json() as Promise<SyncData>;
      })
      .then((data) => { if (active) { setSyncData(data); setSyncState("synced"); } })
      .catch(() => { if (active) setSyncState("fallback"); });
    return () => { active = false; };
  }, []);

  const referenceTracks = syncData ? syncData.references.map(toTrack) : fallbackReferenceTracks;
  const a1Gates = syncData ? syncData.a1.gates : fallbackA1Gates;
  const ledgerRows = syncData ? syncData.ledger.map(toLedger) : fallbackLedgerRows;
  const patterns = syncData ? syncData.patterns.map((pattern) => ({ ...pattern, tone: syncTone(pattern.label) })) : fallbackPatterns;
  const a1Status = syncData?.a1.status ?? "evaluated_with_hold";

  const scrollTo = (id: string) => {
    setActiveSection(id);
    setMenuOpen(false);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#F7F4EC] text-[#1C1A17]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.28] paper-noise" aria-hidden="true" />

      <header className="sticky top-0 z-50 border-b border-[#D8D0C1]/85 bg-[#F7F4EC]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-[76px] max-w-[1600px] items-center justify-between px-5 sm:px-8">
          <button type="button" onClick={() => scrollTo("overview")} className="group flex items-center gap-3 text-left" aria-label="FieldRise Music AIの概況へ移動">
            <span className="grid h-11 w-11 place-items-center overflow-hidden rounded-full bg-[#E9E5D9] transition-transform duration-200 group-hover:scale-[1.04]"><img src={brandMark} alt="" className="h-9 w-9 object-contain" /></span>
            <span><span className="block font-serif text-[18px] font-semibold leading-none tracking-[-0.02em]">FieldRise</span><span className="mt-1 block font-mono text-[9px] uppercase tracking-[0.18em] text-[#6D6A63]">Music research desk</span></span>
          </button>
          <div className="hidden items-center gap-7 md:flex">
            <span className="font-mono text-[10px] tracking-[0.14em] text-[#716E67]">CANONICAL / {syncState === "synced" ? "SYNCED" : syncState === "checking" ? "CHECKING" : "FALLBACK"}</span>
            <SourceLink href={sources.issue}>Issue #2 を開く</SourceLink>
          </div>
          <button type="button" onClick={() => setMenuOpen((value) => !value)} className="grid h-10 w-10 place-items-center border border-[#D8D0C1] bg-[#FBF9F4] md:hidden" aria-expanded={menuOpen} aria-label="ナビゲーションを開く">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
        {menuOpen && <div className="border-t border-[#D8D0C1] bg-[#FBF9F4] px-5 py-4 md:hidden"><div className="grid grid-cols-2 gap-2">{navigation.map((item) => <button type="button" key={item.id} onClick={() => scrollTo(item.id)} className="flex items-center gap-2 border border-[#E2DBCD] px-3 py-3 text-left text-xs font-medium"><item.icon className="h-3.5 w-3.5 text-[#3F5D4B]" />{item.label}</button>)}</div></div>}
      </header>

      <div className="relative z-10 mx-auto grid max-w-[1600px] lg:grid-cols-[236px_minmax(0,1fr)]">
        <aside className="hidden border-r border-[#D8D0C1] px-5 py-9 lg:block"><div className="sticky top-[112px]"><p className="font-mono text-[10px] tracking-[0.18em] text-[#7A756C]">INDEX</p><nav className="mt-5 space-y-1" aria-label="ページ内ナビゲーション">{navigation.map((item, index) => { const Icon = item.icon; const active = activeSection === item.id; return <button type="button" key={item.id} onClick={() => scrollTo(item.id)} className={`group flex w-full items-center gap-3 border-l px-3 py-3 text-left transition-all duration-200 ${active ? "border-[#3F5D4B] bg-[#ECE9DF] text-[#244131]" : "border-transparent text-[#615E57] hover:border-[#B18350] hover:bg-[#F0EDE4] hover:text-[#1C1A17]"}`} aria-current={active ? "page" : undefined}><span className="font-mono text-[10px] text-[#8A857B]">0{index + 1}</span><Icon className="h-4 w-4" strokeWidth={1.8} /><span className="text-[12px] font-medium">{item.label}</span></button>; })}</nav><div className="mt-12 border-t border-[#D8D0C1] pt-5"><div className="flex items-center gap-2 text-[#3F5D4B]"><Leaf className="h-4 w-4" /><span className="font-mono text-[10px] tracking-[0.15em]">FIELD NOTES</span></div><p className="mt-3 text-[12px] leading-6 text-[#716D65]">GitHubが正本。画面は、次の判断を早く正確にするための表示層。</p></div></div></aside>

        <main className="min-w-0 px-5 pb-16 pt-6 sm:px-8 sm:pt-8 lg:px-10 xl:px-14">
          <section id="overview" className="scroll-mt-28" aria-labelledby="hero-title">
            <div className="grid overflow-hidden border border-[#D8D0C1] bg-[#EAE6DA] shadow-[0_16px_45px_rgba(60,49,28,0.06)] lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
              <div className="relative flex min-h-[420px] flex-col justify-between p-7 sm:p-10 lg:p-12"><div className="absolute inset-x-0 top-0 h-[5px] bg-[#3F5D4B]" /><div><div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]"><span className="h-px w-8 bg-[#4F6B5A]" />sonata desk / canonical view</div><h1 id="hero-title" className="mt-7 max-w-[620px] font-serif text-[42px] font-semibold leading-[1.13] tracking-[-0.045em] text-[#1F1D19] sm:text-[52px] xl:text-[62px]">記録を見渡して、<br /><span className="text-[#3F5D4B]">次の一変数を選ぶ。</span></h1><p className="mt-6 max-w-[540px] text-[14px] leading-7 text-[#5F5B53] sm:text-[15px]">001・002の正本、A1、Pattern DB、検証台帳、参照音源をGitHubから辿るための、読み取り専用の研究デスクです。</p></div><div className="mt-10 grid max-w-[500px] grid-cols-[1fr_auto] items-end gap-5 border-t border-[#CFC7B7] pt-5"><div><p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#817B70]">Current gate</p><p className="mt-2 text-[15px] font-semibold text-[#2F4A3B]">A1 / {a1Status}</p>{syncData && <p className="mt-1 font-mono text-[9px] tracking-[0.1em] text-[#7C756B]">SYNC {syncData.sourceDigest.slice(0, 10)}</p>}</div><button type="button" onClick={() => scrollTo("a1")} className="group inline-flex items-center gap-2 text-[12px] font-semibold text-[#1C1A17]">A1を確認<ChevronRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" /></button></div></div>
              <div className="relative min-h-[310px] overflow-hidden lg:min-h-full"><img src={heroImage} alt="朝の喫茶店に置かれたピアノと制作ノート" className="h-full w-full object-cover" /><div className="absolute inset-0 bg-gradient-to-t from-[#1B211B]/40 via-transparent to-transparent" /><div className="absolute right-5 top-5 grid h-16 w-16 place-items-center border border-white/50 bg-[#233F2F]/70 backdrop-blur-sm"><img src={brandMark} alt="" className="h-12 w-12 object-contain brightness-0 invert" /></div><div className="absolute bottom-5 left-5 right-5 flex items-center justify-between border-t border-white/40 pt-3 text-white"><span className="font-mono text-[10px] tracking-[0.16em]">SONATA DESK / V1.1</span><span className="font-mono text-[10px] tracking-[0.16em]">GITHUB CANONICAL</span></div></div>
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-3">{[["001 / 002", "参照する二つの正本", "正式Mainと暫定Mainを区別する"], ["A1", "次の判断のゲート", "実測・保留・承認待ちを分ける"], ["B1", "一つだけ変える実験", "その他ステムの導入時刻を比較する"]].map(([number, title, note]) => <article key={title} className="border border-[#DCD5C7] bg-[#FBF9F4] p-5 transition-transform duration-200 hover:-translate-y-0.5"><p className="font-mono text-[24px] leading-none tracking-[-0.06em] text-[#3F5D4B]">{number}</p><h2 className="mt-4 text-[13px] font-semibold text-[#282620]">{title}</h2><p className="mt-1 text-[12px] leading-5 text-[#706B62]">{note}</p></article>)}</div><div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-[#D8D0C1] pt-3 font-mono text-[9px] tracking-[0.12em] text-[#726C62]"><span className="inline-flex items-center gap-2"><i className="h-2 w-2 bg-[#3F5D4B]" />FIELD MOSS / 実測・前進</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 bg-[#A45B40]" />TERRACOTTA / 保留・再検証</span><span className="inline-flex items-center gap-2"><i className="h-2 w-2 bg-[#B18350]" />BRASS / 記録・知見</span></div>
          </section>

          <section id="references" className="scroll-mt-28 pt-20" aria-labelledby="reference-title"><div className="flex flex-col justify-between gap-6 border-t-2 border-[#1C1A17] pt-5 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]">01 / Reference comparison</p><h2 id="reference-title" className="mt-3 font-serif text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">001・002を、同じ物差しで見る。</h2></div><SourceLink href={sources.audioLedger}>音源台帳を開く</SourceLink></div><ScoreRuler start="00:00" end="LOOP" note="BPM / Bass Onset / Stem Evidence" />
            <div className="mt-7 grid gap-5 xl:grid-cols-2">{referenceTracks.map((track) => <article key={track.id} className="overflow-hidden border border-[#D8D0C1] bg-[#FBF9F4]"><div className="flex items-start justify-between gap-4 border-b border-[#E1DBCE] p-5 sm:p-6"><div><p className="font-mono text-[10px] tracking-[0.16em] text-[#7A756C]">REFERENCE / {track.id}</p><h3 className="mt-2 font-serif text-[30px] font-semibold tracking-[-0.04em]">Cafe {track.id}</h3><p className="mt-1 text-[11px] text-[#706B62]">{track.sourceType}</p></div><span className={`shrink-0 border px-2.5 py-1 font-mono text-[9px] tracking-[0.08em] ${track.status === "verified" ? "border-[#C9D8CB] bg-[#E8F0E9] text-[#244131]" : "border-[#E5C4B6] bg-[#F7EAE5] text-[#8C4634]"}`}>{track.statusLabel}</span></div><div className="grid grid-cols-2 gap-px bg-[#E5DED0] sm:grid-cols-3">{[["Length", track.duration], ["Format", track.sampleRate], ["Tempo", track.bpm], ["Bass onset", track.bassOnset], ["Intro bass", track.introBass], ["Drums RMS", track.drumsRms]].map(([label, value]) => <div key={label} className="bg-[#F7F4EC] px-4 py-4"><p className="font-mono text-[9px] tracking-[0.13em] text-[#8A8378]">{label}</p><p className="mt-2 text-[12px] font-semibold text-[#332F28]">{value}</p></div>)}</div><div className="p-5 sm:p-6"><p className="text-[12px] leading-6 text-[#676158]">{track.summary}</p><div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[#E1DBCE] pt-4"><SourceLink href={track.source}>正解データを読む</SourceLink><SourceLink href={track.audio}>FLACを開く</SourceLink></div></div></article>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]"><p className="self-center font-mono text-[10px] leading-5 text-[#7C756B]">* BPMはアルゴリズム推定値。最終値はDAWまたは聴取で確認する。</p><DecisionNote title="B1は音源差ではなく、導入時刻を比べる。" body="001の約2.3秒と002の約0.3秒。比較以外の条件を固定するため、正本・暫定の区別をカード上で維持する。" action="A1の固定条件を見る" href={sources.a1} /></div></section>

          <section id="a1" className="scroll-mt-28 pt-20" aria-labelledby="a1-title"><div className="grid gap-8 border-t-2 border-[#1C1A17] pt-5 xl:grid-cols-[0.8fr_1.2fr]"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]">02 / A1 progress</p><h2 id="a1-title" className="mt-3 font-serif text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">確定したことと、<br />まだ聞くべきこと。</h2><ScoreRuler start="G01" end="G09" note="Measured / Pending / Hold" /><p className="mt-5 max-w-[420px] text-[13px] leading-7 text-[#666158]">A1は実測を終え、聴取レビューと002の正式Main確認を保留しています。未観測の値を推測で埋めないことが次の比較の前提です。</p><div className="mt-7 border border-[#E5C4B6] bg-[#F7EAE5] p-5"><div className="flex items-center gap-2 text-[#A45B40]"><CircleAlert className="h-4 w-4" /><span className="font-mono text-[10px] tracking-[0.14em]">CURRENT HOLD</span></div><p className="mt-3 text-[12px] leading-6 text-[#5D5549]">002の受領Mainは無音。現在の002参照音源は、4ステム合成による暫定版です。</p><div className="mt-4"><SourceLink href={sources.a1}>A1台帳を開く</SourceLink></div></div></div>
              <div className="overflow-hidden border border-[#D8D0C1] bg-[#FBF9F4]"><div className="flex items-center justify-between border-b border-[#E1DBCE] px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><FileCheck2 className="h-4 w-4 text-[#3F5D4B]" /><span className="text-[12px] font-semibold">G01–G09 / Status</span></div><span className="font-mono text-[10px] tracking-[0.14em] text-[#7F796F]">A1 / {a1Status}</span></div><div className="divide-y divide-[#E7E0D3]">{a1Gates.map((gate) => { const style = stateStyle[gate.state as keyof typeof stateStyle]; return <div key={gate.id} className="grid gap-3 px-5 py-4 sm:grid-cols-[52px_140px_minmax(0,1fr)_auto] sm:items-center sm:px-6"><span className="font-mono text-[11px] text-[#3F5D4B]">{gate.id}</span><p className="text-[12px] font-semibold text-[#302E29]">{gate.label}</p><p className="text-[11px] leading-5 text-[#716C62]">{gate.note}</p><span className={`w-fit px-2 py-1 font-mono text-[9px] tracking-[0.08em] ${style.className}`}>{style.label}</span></div>; })}</div></div>
            </div></section>

          <section id="ledger" className="scroll-mt-28 pt-20" aria-labelledby="ledger-title"><div className="flex flex-col justify-between gap-5 border-t-2 border-[#1C1A17] pt-5 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]">03 / Experiment ledger</p><h2 id="ledger-title" className="mt-3 font-serif text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">検証番号に、根拠と次の一手を結ぶ。</h2></div><SourceLink href={sources.a1}>実験台帳を開く</SourceLink></div><ScoreRuler start="A1" end="B1" note="One variable / Evidence first" /><div className="mt-7 overflow-hidden border border-[#D8D0C1] bg-[#FBF9F4]"><div className="hidden grid-cols-[76px_minmax(160px,1fr)_minmax(180px,1fr)_minmax(150px,0.75fr)] gap-4 border-b border-[#E1DBCE] bg-[#F3F0E8] px-6 py-3 font-mono text-[9px] tracking-[0.14em] text-[#7C756B] md:grid"><span>ID</span><span>RESEARCH UNIT</span><span>ONE VARIABLE</span><span>STATE</span></div>{ledgerRows.map((row) => <article key={row.id} className="grid gap-4 border-b border-[#E7E0D3] px-5 py-5 last:border-b-0 md:grid-cols-[76px_minmax(160px,1fr)_minmax(180px,1fr)_minmax(150px,0.75fr)] md:items-center md:px-6"><span className="w-fit border border-[#CFC7B7] bg-[#F4F0E7] px-2 py-1 font-mono text-[11px] font-semibold text-[#454139]">{row.id}</span><div><h3 className="text-[13px] font-semibold text-[#26241E]">{row.title}</h3><p className="mt-1 text-[11px] text-[#716C62]">{row.note}</p></div><p className="text-[12px] font-medium text-[#4A554C]">{row.variable}</p><span className={`w-fit border px-2.5 py-1 font-mono text-[10px] tracking-[0.08em] ${row.tone}`}>{row.outcome}</span></article>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_330px]"><p className="self-center text-[12px] leading-6 text-[#706B62]">A1は正本を揃えるための観測。B1は導入時刻だけを変える比較。記録を増やす前に、比較可能性を保つ。</p><DecisionNote title="次の一手は、B1を生成することではない。" body="まず、002の正式MainとG02・G03・G07・G08の聴取記録の承認状態を確認する。" action="Issue #2の承認条件を見る" href={sources.issue} /></div></section>

          <section id="patterns" className="scroll-mt-28 pt-20" aria-labelledby="patterns-title"><div className="flex flex-col justify-between gap-6 border-t-2 border-[#1C1A17] pt-5 sm:flex-row sm:items-end"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]">04 / Pattern database</p><h2 id="patterns-title" className="mt-3 font-serif text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">成功を固定し、仮説を分ける。</h2></div><SourceLink href={sources.patterns}>Pattern DBを開く</SourceLink></div><ScoreRuler start="FACT" end="HYPOTHESIS" note="Confirmed / Provisional / Pending" /><div className="mt-7 grid gap-px overflow-hidden border border-[#D8D0C1] bg-[#D8D0C1] md:grid-cols-2 xl:grid-cols-3">{patterns.map((pattern) => <article key={pattern.id} className="bg-[#F8F5ED] p-5 transition-colors duration-200 hover:bg-[#F1EEE5]"><div className="flex items-center justify-between gap-3"><span className="font-mono text-[10px] text-[#8A8378]">{pattern.id}</span><span className={`px-2 py-1 font-mono text-[9px] tracking-[0.08em] ${pattern.tone}`}>{pattern.label}</span></div><h3 className="mt-5 text-[14px] font-semibold text-[#292720]">{pattern.title}</h3><p className="mt-2 text-[12px] leading-6 text-[#68635A]">{pattern.body}</p></article>)}</div><div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]"><article className="relative min-h-[250px] overflow-hidden border border-[#D8D0C1] bg-[#F0ECE2]"><img src={deskImage} alt="楽曲検証のためのノートとメトロノーム" className="absolute inset-0 h-full w-full object-cover opacity-80" /><div className="absolute inset-0 bg-gradient-to-t from-[#1C241E]/80 via-[#1C241E]/20 to-transparent" /><div className="absolute bottom-0 left-0 right-0 p-6 text-white"><p className="font-mono text-[10px] tracking-[0.16em] text-[#D6E0D3]">GITHUB AS MEMORY</p><h3 className="mt-3 font-serif text-[24px] font-semibold leading-tight">推測ではなく、<br />根拠を次へ渡す。</h3></div></article><article className="border border-[#D8D0C1] bg-[#FBF9F4] p-6"><p className="font-mono text-[10px] tracking-[0.16em] text-[#7A756C]">FACT / HYPOTHESIS</p><h3 className="mt-3 font-serif text-[25px] font-semibold tracking-[-0.04em]">次のB1で混同しないこと。</h3><Rule className="mt-6" /><div className="mt-5 space-y-4 text-[12px] leading-6 text-[#625D54]"><p><strong className="text-[#2F4A3B]">Fact</strong>：Bass Onset 0.464秒、80–86 BPM帯、Intro低域主導、控えめなDrums。</p><p><strong className="text-[#8B6438]">Hypothesis</strong>：その他ステムの導入時刻が、Cafeらしい余白の評価に与える影響。</p><p><strong className="text-[#914630]">Pending</strong>：002の正式Main、Piano / Keysの間、ノイズ、Loopの聴取記録。</p></div></article></div></section>

          <section id="sources" className="scroll-mt-28 pt-20" aria-labelledby="sources-title"><div className="grid gap-8 border-t-2 border-[#1C1A17] pt-5 xl:grid-cols-[0.86fr_1.14fr]"><div><p className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#4F6B5A]">05 / Reference audio</p><h2 id="sources-title" className="mt-3 max-w-[490px] font-serif text-[32px] font-semibold tracking-[-0.04em] sm:text-[38px]">同じ音源を、同じ根拠で聞く。</h2><ScoreRuler start="00:00" end="END → START" note="Canonical evidence / Loop review" /><p className="mt-5 max-w-[440px] text-[13px] leading-7 text-[#666158]">分析の起点となる参照音源はGitHubに保存し、SHA-256と由来を台帳で追跡します。002は暫定ステム合成版であることを常に表示します。</p><div className="mt-7"><SourceLink href={sources.audioLedger}>参照音源台帳を開く</SourceLink></div></div><div className="space-y-5">{referenceTracks.map((track) => <article key={track.id} className="overflow-hidden border border-[#D8D0C1] bg-[#FBF9F4]"><div className="flex flex-col justify-between gap-3 border-b border-[#E1DBCE] px-5 py-4 sm:flex-row sm:items-center sm:px-6"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#E9E5D9]"><AudioLines className="h-4 w-4 text-[#3F5D4B]" /></div><div><p className="font-mono text-[10px] tracking-[0.14em] text-[#7A756C]">REFERENCE EVIDENCE / {track.id}</p><p className="mt-0.5 text-[12px] font-semibold">{track.sourceType}</p></div></div><span className="font-mono text-[10px] text-[#7A756C]">{track.duration}</span></div><div className="p-5 sm:p-6"><ScoreRuler start="PLAY" end="LOOP" note={track.statusLabel} /><div className="mt-3 flex items-center justify-between border-y border-[#E1DBCE] py-2 font-mono text-[9px] tracking-[0.12em] text-[#7C756B]"><span>GITHUB / CANONICAL FILE</span><span>{track.sampleRate}</span></div><audio controls preload="metadata" className="mt-3 h-10 w-full" aria-label={`参照音源 ${track.id} を再生`}><source src={track.audio} type="audio/flac" />お使いのブラウザはFLAC再生に対応していません。</audio><div className="mt-4 flex flex-wrap items-center justify-between gap-3"><p className="font-mono text-[10px] text-[#746F65]">SHA-256 recorded in ledger</p><SourceLink href={track.audio}>音源を直接開く</SourceLink></div></div></article>)}</div></div></section>

          <section className="pt-20"><div className="relative overflow-hidden border border-[#D8D0C1] bg-[#2E4035] p-7 text-[#FBF9F4] sm:p-9"><img src={pianoImage} alt="" className="absolute inset-0 h-full w-full object-cover opacity-20 mix-blend-screen" /><div className="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-end"><div><p className="font-mono text-[10px] tracking-[0.18em] text-[#D6E0D3]">NEXT DECISION</p><h2 className="mt-3 font-serif text-[30px] font-semibold tracking-[-0.04em]">B1は、その他ステムの<br />導入時刻だけを比べる。</h2><p className="mt-4 max-w-[600px] text-[12px] leading-6 text-[#E4E8DF]">0.3秒案と2.3秒案を比較し、Bass・Tempo・Drums・非ボーカル主導は固定する。002の正式Mainと聴取レビューがそろうまで、生成は承認待ちとして扱う。</p></div><SourceLink href={sources.issue}>設計課題を開く</SourceLink></div></div></section>

          <footer className="mt-20 border-t border-[#D8D0C1] py-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center border border-[#CFC7B7] bg-[#E9E5D9]"><img src={brandMark} alt="" className="h-9 w-9 object-contain" /></span><p className="font-serif text-[16px] font-semibold">FieldRise Music AI</p></div><div className="flex items-center gap-4 font-mono text-[10px] tracking-[0.13em] text-[#7A756C]"><span>SONATA DESK / V1.1</span><span className="h-3 w-px bg-[#CFC7B7]" /><span>CANONICAL VIEW</span></div></div></footer>
        </main>
      </div>
    </div>
  );
}
