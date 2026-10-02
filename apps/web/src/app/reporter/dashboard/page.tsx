"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/hooks";
import { useSession } from "@/lib/use-session";
import { formatRelative } from "@/lib/types";

interface ReporterArticle {
  id: string;
  slug: string;
  title: string;
  status: string;
  updatedAt: string;
  publishedAt: string | null;
  viewCount: number;
  reviewNote: string | null;
}

interface ReporterStats {
  published: number;
  pending: number;
  draft: number;
  rejected: number;
  unpublished: number;
  views: number;
  likes: number;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-muted",
  pending: "badge-warning",
  published: "badge-success",
  rejected: "badge-error",
  unpublished: "badge-muted",
};

export default function ReporterDashboard() {
  const { session } = useSession();
  const { data: stats } = useApiQuery<ReporterStats>(["reporter", "stats"], "/reporter/stats");
  const { data: articles, isLoading } = useApiQuery<ReporterArticle[]>(["reporter", "articles", "recent"], "/reporter/articles");

  const recent = (articles ?? []).slice(0, 5);
  const rejected = (articles ?? []).filter((a) => a.status === "rejected");

  return (
    <main className="container-wide">
      <div className="row-between mb-3">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Reporter dashboard</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            Welcome back, {session.user?.displayName}.
            {session.reporterStatus && <> · <b>{session.reporterStatus}</b></>}
          </p>
        </div>
        <Link href="/reporter/compose" className="btn btn-primary">+ New article</Link>
      </div>

      {session.reporterStatus && session.reporterStatus !== "approved" && (
        <div className="toast-note mb-3" style={{ background: "rgba(217,119,6,.12)", borderColor: "rgba(217,119,6,.3)", color: "var(--warning)" }}>
          Your reporter account is <b>{session.reporterStatus}</b>.{" "}
          {session.reporterStatus === "pending"
            ? "An admin is reviewing your application."
            : <>You can <Link href="/reporter/apply" style={{ color: "var(--warning)", fontWeight: 700 }}>re-apply</Link>.</>}
        </div>
      )}

      <div className="grid grid-4 mb-3">
        <div className="kpi"><div className="num">{stats?.published ?? 0}</div><div className="lbl">Published</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--warning)" }}>{stats?.pending ?? 0}</div><div className="lbl">Pending review</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--muted)" }}>{stats?.draft ?? 0}</div><div className="lbl">Drafts</div></div>
        <div className="kpi"><div className="num">{stats?.views ?? 0}</div><div className="lbl">Total views</div></div>
      </div>

      {rejected.length > 0 && (
        <div className="toast-note mb-3" style={{ background: "rgba(220,38,38,.1)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>
          {rejected.length} article(s) need changes.{" "}
          <Link href="/reporter/articles" style={{ color: "var(--error)", fontWeight: 700 }}>Review feedback →</Link>
        </div>
      )}

      <div className="row-between mb-2">
        <div className="section-title" style={{ marginBottom: 0 }}>Recent articles</div>
        <Link href="/reporter/articles" className="small" style={{ color: "var(--purple)", fontWeight: 700 }}>View all</Link>
      </div>
      {isLoading ? (
        <div className="empty">Loading…</div>
      ) : recent.length === 0 ? (
        <div className="empty"><div className="big">&#128240;</div><div>No articles yet. Start writing!</div></div>
      ) : (
        recent.map((a) => (
          <Link key={a.id} href={`/reporter/compose?id=${a.id}`} className="list-row" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="grow">
              <div className="title">{a.title}</div>
              <div className="sub">Updated {formatRelative(a.updatedAt)} · {a.viewCount} views</div>
            </div>
            <span className={`badge ${STATUS_BADGE[a.status] ?? "badge-muted"}`}>{a.status}</span>
          </Link>
        ))
      )}
    </main>
  );
}
