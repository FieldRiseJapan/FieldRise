/**
 * Design: Control-Room Ledger — dark operational surface, Signal Blue evidence rail,
 * asymmetric system sidebar and data-first Japanese control-room interface.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  AudioLines,
  CheckCircle2,
  ChevronRight,
  CircleAlert,
  Clock3,
  ExternalLink,
  GitBranch,
  Github,
  LoaderCircle,
  Radio,
  RefreshCw,
  ShieldCheck,
  Signal,
  Workflow,
  XCircle,
} from "lucide-react";

const OWNER = "FieldRiseJapan";
const REPO = "FieldRise";
const BRANCH = "main";
const GITHUB_URL = `https://github.com/${OWNER}/${REPO}`;
const RAW_BASE = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}`;
const COMMIT_SNAPSHOT_PATH = "./data/latest-commit.json";
const SOURCE_PATHS = {
  dashboard: "dashboard/sonata-desk/src/generated/dashboard-data.json",
  comments: "cto/inbox/momoka-comments.md",
  report: "docs/momoka/reports/latest_report.md",
  execution: "automation/momoka-executions/latest.json",
} as const;

type Gate = { id: string; label: string; note: string; state: "measured" | "partial" | string };
type Reference = {
  id: string;
  bpm: string;
  bassOnset: string;
  introBass: string;
  sourcePath: string;
  sourceType: string;
  statusLabel: string;
  summary: string;
};
type Review = { id: string; title: string; detail: string; sourcePath: string };
type DashboardData = {
  a1: { status: string; purpose: string; gates: Gate[] };
  references: Reference[];
  reviewQueue: Review[];
  ledger: { id: string; title: string; note: string; outcome: string; variable: string }[];
  decisionBrief: { title: string; body: string; sourcePath: string };
  sourceDigest: string;
};
type Comment = {
  date: string;
  title: string;
  type: string;
  task: string;
  body: string;
  status: string;
  nextAction: string;
};
type Commit = { sha: string; date: string; message: string };
type Execution = {
  status: string;
  execution_name: string | null;
  issue_number?: string | null;
  project_name?: string;
  task_name?: string;
  receipt_key: string;
  instruction_path: string;
  started_at?: string;
  updated_at?: string;
  error?: string;
};
type SyncState = "loading" | "healthy" | "partial" | "error";

const humanDate = (iso?: string) => {
  if (!iso) return "未取得";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(date).replace(/\//g, ".") + " UTC";
};

const compact = (value: string, max = 82) =>
  value.length > max ? `${value.slice(0, max).trimEnd()}…` : value;

function parseComment(markdown: string): Comment | null {
  const entries = Array.from(markdown.matchAll(/^###\s+(.+?)\s+—\s+(.+)$/gm));
  const latest = entries.length ? entries[entries.length - 1] : undefined;
  if (!latest || latest.index === undefined) return null;
  const end = markdown.indexOf("\n### ", latest.index + latest[0].length);
  const section = markdown.slice(latest.index, end === -1 ? undefined : end);
  const field = (label: string) => {
    const match = section.match(new RegExp(`^\\|\\s*${label}\\s*\\|\\s*(.*?)\\s*\\|$`, "m"));
    return match?.[1]?.replace(/`/g, "") ?? "未登録";
  };
  const date = field("日時");
  const status = field("ステータス");
  return {
    date,
    title: latest[2].trim(),
    type: field("種別"),
    task: field("関連タスク"),
    body: field("桃花からのコメント"),
    status,
    nextAction: status === "完了" ? "対応結果を確認" : "彩花からの回答・状態更新を確認",
  };
}

function parseReportExcerpt(markdown: string) {
  const meaningful = markdown
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith("#") && !line.startsWith("|") && !line.startsWith("["));
  return meaningful.slice(0, 2).map((line) => line.replace(/^>\s*/, ""));
}

async function fetchText(path: string) {
  const response = await fetch(`${RAW_BASE}/${path}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`${path} の取得に失敗しました（HTTP ${response.status}）`);
  return response.text();
}

async function fetchCommit(): Promise<Commit> {
  const response = await fetch(`${COMMIT_SNAPSHOT_PATH}?t=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`最新コミットのスナップショット取得に失敗しました（HTTP ${response.status}）`);
  const data = await response.json();
  if (typeof data.sha !== "string" || typeof data.message !== "string") {
    throw new Error("最新コミットのスナップショット形式が不正です");
  }
  return { sha: data.sha, date: typeof data.date === "string" ? data.date : "", message: data.message };
}

function SourceLink({ path, children }: { path: string; children: React.ReactNode }) {
  return (
    <a
      className="source-link"
      href={`${GITHUB_URL}/blob/${BRANCH}/${path}`}
      target="_blank"
      rel="noreferrer"
    >
      {children}
      <ExternalLink aria-hidden="true" size={12} />
    </a>
  );
}

function StateBadge({ state }: { state: SyncState }) {
  const copy = {
    loading: ["読込中", "muted"],
    healthy: ["同期正常", "good"],
    partial: ["一部取得失敗", "warn"],
    error: ["同期失敗", "bad"],
  } as const;
  const [label, tone] = copy[state];
  return <span className={`state-badge state-${tone}`}><i />{label}</span>;
}

function MetricStatus({ label, value, detail, trace, tone = "neutral" }: { label: string; value: string; detail: string; trace: string; tone?: "neutral" | "good" | "warn" }) {
  return (
    <article className={`metric-card metric-${tone}`}>
      <p className="eyebrow">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-detail">{detail}</p>
      <p className="evidence-label"><span>■</span>{trace}</p>
    </article>
  );
}

export default function Home() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [comment, setComment] = useState<Comment | null>(null);
  const [reportExcerpt, setReportExcerpt] = useState<string[]>([]);
  const [commit, setCommit] = useState<Commit | null>(null);
  const [execution, setExecution] = useState<Execution | null>(null);
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [lastSync, setLastSync] = useState<string>("");
  const [errors, setErrors] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const sync = useCallback(async (manual = false) => {
    if (manual) setIsRefreshing(true);
    setSyncState("loading");
    const tasks = await Promise.allSettled([
      fetchText(SOURCE_PATHS.dashboard),
      fetchText(SOURCE_PATHS.comments),
      fetchText(SOURCE_PATHS.report),
      fetchText(SOURCE_PATHS.execution),
      fetchCommit(),
    ]);
    const nextErrors: string[] = [];
    const [dashboardResult, commentResult, reportResult, executionResult, commitResult] = tasks;

    if (dashboardResult.status === "fulfilled") {
      try { setData(JSON.parse(dashboardResult.value) as DashboardData); }
      catch { nextErrors.push("検証データの形式を読み込めませんでした"); }
    } else nextErrors.push("検証データを取得できませんでした");

    if (commentResult.status === "fulfilled") setComment(parseComment(commentResult.value));
    else nextErrors.push("桃花コメントを取得できませんでした");

    if (reportResult.status === "fulfilled") setReportExcerpt(parseReportExcerpt(reportResult.value));
    else nextErrors.push("最新報告を取得できませんでした");

    if (executionResult.status === "fulfilled") {
      try { setExecution(JSON.parse(executionResult.value) as Execution); }
      catch { nextErrors.push("桃花実行状態の形式を読み込めませんでした"); }
    } else nextErrors.push("桃花実行状態を取得できませんでした");

    if (commitResult.status === "fulfilled") setCommit(commitResult.value);
    else nextErrors.push("GitHub最新コミットを取得できませんでした");

    setErrors(nextErrors);
    setLastSync(new Date().toISOString());
    setSyncState(nextErrors.length === 0 ? "healthy" : nextErrors.length < 5 ? "partial" : "error");
    setIsRefreshing(false);
  }, []);

  useEffect(() => {
    void sync();
    const timer = window.setInterval(() => void sync(), 60_000);
    return () => window.clearInterval(timer);
  }, [sync]);

  const gates = data?.a1.gates ?? [];
  const measured = gates.filter((gate) => gate.state === "measured").length;
  const partial = gates.filter((gate) => gate.state === "partial").length;
  const gauge = gates.length ? Math.round((measured / gates.length) * 100) : 0;
  const references = data?.references ?? [];
  const currentIssue = data?.reviewQueue?.[0];
  const nextAction = data?.decisionBrief;
  const sourceCount = useMemo(() => [data, comment, execution, commit].filter(Boolean).length, [data, comment, execution, commit]);

  return (
    <div className="app-shell">
      <aside className="system-rail" aria-label="システム情報">
        <div className="rail-brand">
          <div className="brand-mark" aria-hidden="true"><i /><i /><b /></div>
          <div><strong>FIELDRISE</strong><span>AI CONTROL</span></div>
        </div>
        <nav className="rail-nav" aria-label="管制メニュー">
          <a className="is-active" href="#overview"><Activity size={16} />概況</a>
          <a href="#reproduction"><AudioLines size={16} />再現度</a>
          <a href="#gates"><Signal size={16} />検証点</a>
          <a href="#operations"><Workflow size={16} />運用ログ</a>
        </nav>
        <div className="rail-footer">
          <p className="eyebrow">SYSTEM SOURCE</p>
          <a className="repo-link" href={GITHUB_URL} target="_blank" rel="noreferrer"><Github size={15} />{OWNER}/{REPO}<ExternalLink size={12} /></a>
          <p className="rail-meta">BRANCH / {BRANCH}</p>
          <p className="rail-meta">POLL / 60 SEC</p>
        </div>
      </aside>

      <main className="control-surface">
        <header className="topbar">
          <div className="mobile-brand"><div className="brand-mark" aria-hidden="true"><i /><i /><b /></div><span>FIELDRISE / AI CONTROL</span></div>
        <div className="topbar-status"><StateBadge state={syncState} /><span><Clock3 size={14} />最終同期 {humanDate(lastSync)}</span></div>
          <button className="sync-button" type="button" onClick={() => void sync(true)} disabled={isRefreshing}>
            <RefreshCw size={15} className={isRefreshing ? "spin" : ""} />{isRefreshing ? "同期中" : "再同期"}
          </button>
        </header>

        <div className="content-wrap">
          <section id="overview" className="hero-panel">
            <div className="hero-visual" aria-hidden="true" />
            <div className="hero-content">
              <div>
                <p className="eyebrow blue-eyebrow">PRESIDENT VIEW / GITHUB CANONICAL</p>
                <h1>FieldRise AI<br /><em>Control Dashboard</em></h1>
                <p className="hero-copy">001・002再現研究の現状を、GitHub正本の検証データと運用記録から確認する。</p>
              </div>
              <div className="hero-commit">
                <GitBranch size={17} />
                <div><p>最新GitHubコミット</p><strong>{commit ? commit.sha.slice(0, 7) : "未取得"}</strong><span>{commit ? compact(commit.message, 42) : "コミット情報を取得中"}</span></div>
              </div>
            </div>
          </section>

          {errors.length > 0 && (
            <section className="error-strip" role="status">
              <CircleAlert size={18} />
              <p><strong>取得状況に注意が必要です。</strong> {errors.join(" / ")}。最後に取得できた値は保持し、推測値は表示しません。</p>
            </section>
          )}

          <section className="metric-grid" aria-label="主要指標">
            <MetricStatus label="検証点数" value={gates.length ? `${measured} / ${gates.length}` : "未登録"} detail={gates.length ? `計測済み ${measured}件・確認待ち ${partial}件` : "GitHub正本の検証データを待機中"} trace="EVIDENCE / A1 GATE LEDGER" tone="good" />
            <MetricStatus label="前回との差分" value="未登録" detail="GitHub正本に比較スコア履歴が未登録のため、差分は算出しません" trace="Δ / HISTORY NOT REGISTERED" tone="warn" />
            <MetricStatus label="同期対象" value={`${sourceCount} / 4`} detail="検証データ・桃花通信・実行状態・最新コミットを照合" trace={`SYNC / ${lastSync ? new Date(lastSync).toISOString().slice(11, 19) : "WAITING"}Z`} />
            <MetricStatus label="重要タスク" value={currentIssue ? currentIssue.id : "未登録"} detail={currentIssue ? compact(currentIssue.title, 34) : "GitHub正本のタスク情報を待機中"} trace="QUEUE / REVIEW REQUIRED" />
          </section>

          <section id="reproduction" className="section-block reproduction-block">
            <div className="section-heading"><div><p className="eyebrow">REFERENCE REPRODUCTION</p><h2>001 / 002 の現在値</h2></div><p>再現度の数値スコアは正本に未登録のため、検証済み事実のみ表示します。</p></div>
            <div className="reproduction-layout">
              <div className="score-gauge" style={{ "--gauge": `${gauge * 3.6}deg` } as React.CSSProperties}>
                <div><span>検証点</span><strong>{gates.length ? `${measured}/${gates.length}` : "—"}</strong><small>計測済み</small></div>
              </div>
              <div className="score-explanation"><p className="eyebrow">再現度バロメーター</p><h3>総合再現度は <span>未登録</span></h3><p>GitHub正本には総合点および前回比の数値がありません。計測済みのG01〜G09を、スコアの代替ではなく検証進捗として表示しています。</p><SourceLink path={SOURCE_PATHS.dashboard}>検証データを確認</SourceLink></div>
              <div className="reference-stack">
                {references.map((reference) => <article className="reference-card" key={reference.id}>
                  <div className="reference-top"><span className="ref-id">{reference.id}</span><span className="verified"><ShieldCheck size={13} />{reference.statusLabel}</span></div>
                  <p>{reference.summary}</p>
                  <dl><div><dt>BPM</dt><dd>{reference.bpm}</dd></div><div><dt>Bass onset</dt><dd>{reference.bassOnset}</dd></div><div><dt>Intro Bass</dt><dd>{reference.introBass}</dd></div></dl>
                  <SourceLink path={reference.sourcePath}>正本を開く</SourceLink>
                </article>)}
                {!references.length && <div className="empty-data"><LoaderCircle className="spin" size={18} /> 正本データを読み込み中</div>}
              </div>
            </div>
          </section>

          <section id="gates" className="section-block gates-block">
            <div className="section-heading"><div><p className="eyebrow">A1 / EVIDENCE LEDGER</p><h2>評価項目 G01〜G09</h2></div><p>各数字は検証項目の識別子です。数値評価は未登録であり、測定・確認の状態を明示します。</p></div>
            <div className="gates-table" role="table" aria-label="再現度評価項目">
              <div className="gates-row gates-head" role="row"><span>項目</span><span>意味</span><span>現在の根拠</span><span>状態</span></div>
              {gates.map((gate) => <div className="gates-row" role="row" key={gate.id}>
                <span className="gate-id">{gate.id}</span><strong>{gate.label}</strong><p>{gate.note}</p><span className={`gate-state ${gate.state}`}>{gate.state === "measured" ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}{gate.state === "measured" ? "計測済み" : "確認待ち"}</span>
              </div>)}
              {!gates.length && <div className="empty-data"><LoaderCircle className="spin" size={18} /> 評価項目を取得中</div>}
            </div>
          </section>

          <section id="operations" className="operations-grid">
            <article className="ops-panel comment-panel">
              <div className="panel-title"><div><p className="eyebrow">MOMOKA / LATEST REPORT</p><h2>桃花の最新通信</h2></div><Radio size={18} /></div>
              {comment ? <div className="comment-entry"><div className="comment-meta"><span>{humanDate(comment.date)}</span><span>{comment.type}</span><span className="comment-status">{comment.status}</span></div><h3>{comment.title}</h3><p>{comment.body}</p><dl className="operation-list"><div><dt>関連タスク</dt><dd>{comment.task}</dd></div><div><dt>次アクション</dt><dd>{comment.nextAction}</dd></div></dl><SourceLink path={SOURCE_PATHS.comments}>通信正本を開く</SourceLink></div> : <div className="empty-data"><LoaderCircle className="spin" size={18} /> 桃花コメントを取得中</div>}
            </article>

            <article className="ops-panel action-panel">
              <div className="panel-title"><div><p className="eyebrow">DECISION QUEUE</p><h2>現在の問題と次のアクション</h2></div><ArrowRight size={18} /></div>
              <div className="decision-card"><span className="decision-label">CURRENT ISSUE</span><h3>{currentIssue?.title ?? "未登録"}</h3><p>{currentIssue?.detail ?? "GitHub正本のレビューキューを取得中です。"}</p>{currentIssue && <SourceLink path={currentIssue.sourcePath}>根拠を確認</SourceLink>}</div>
              <div className="next-action"><span>NEXT</span><div><h3>{nextAction?.title ?? "未登録"}</h3><p>{nextAction?.body ?? "GitHub正本の次アクションを取得中です。"}</p></div></div>
            </article>

            <article className="ops-panel execution-panel">
              <div className="panel-title"><div><p className="eyebrow">MOMOKA / ACTIVE EXECUTION</p><h2>桃花の実行状態</h2></div><Workflow size={18} /></div>
              {execution ? <div className="report-excerpt"><p><strong>{execution.execution_name ?? "実行名生成失敗"}</strong></p><p>状態: {execution.status} {execution.issue_number ? `｜ Issue #${execution.issue_number}` : ""}</p><p>{execution.error ?? `${execution.project_name ?? ""}｜${execution.task_name ?? ""}`}</p><p>開始・更新: {humanDate(execution.started_at ?? execution.updated_at)}</p><SourceLink path={SOURCE_PATHS.execution}>実行状態の正本を開く</SourceLink></div> : <div className="empty-data"><LoaderCircle className="spin" size={18} /> 桃花実行状態を取得中</div>}
            </article>

            <article className="ops-panel report-panel">
              <div className="panel-title"><div><p className="eyebrow">OFFICIAL REPORT</p><h2>最新正式報告</h2></div><ChevronRight size={18} /></div>
              {reportExcerpt.length ? <div className="report-excerpt">{reportExcerpt.map((line, index) => <p key={index}>{line}</p>)}<SourceLink path={SOURCE_PATHS.report}>正式報告を開く</SourceLink></div> : <div className="empty-data"><LoaderCircle className="spin" size={18} /> 正式報告を取得中</div>}
            </article>
          </section>

          <footer className="source-footer"><div><Github size={15} /><span>GitHubを唯一の正本として参照</span></div><span>データ更新は60秒ごとに確認。表示値の書込み・変更は行いません。</span><span>{data?.sourceDigest ? `DATA DIGEST / ${data.sourceDigest.slice(0, 12)}` : "DATA DIGEST / 未取得"}</span></footer>
        </div>
      </main>
    </div>
  );
}
