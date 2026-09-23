import Link from "next/link";
import { apiFetch } from "@/lib/api";
import { getSession } from "@/lib/session";
import { formatRelative } from "@/lib/types";

export const dynamic = "force-dynamic";
export const metadata = { title: "Reporter dashboard" };

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

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-muted",
  pending: "badge-warning",
  published: "badge-success",
  rejected: "badge-error",
  unpublished: "badge-muted",
};

export default async function ReporterDashboard() {
  const session = await getSession();
  const token = undefined; // server reads are public; reporter list is client-fetched elsewhere

  let articles: ReporterArticle[] = [];
  try {
    articles = await apiFetch<ReporterArticle[]>("/articles/feed?limit=5", { revalidate: 0 });
  } catch {
    /* empty */
  }

  const counts = {
    published: articles.filter((a) => a.status === "published").length,
    pending: articles.filter((a) => a.status === "pending").length,
    draft: articles.filter((a) => a.status === "draft").length,
  };
  const rejected = articles.filter((a) => a.status === "rejected");

  void token;

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

      {session.reporterStatus !== "approved" && (
        <div className="toast-note mb-3" style={{ background: "rgba(217,119,6,.12)", borderColor: "rgba(217,119,6,.3)", color: "var(--warning)" }}>
          Your reporter account is <b>{session.reporterStatus ?? "not approved"}</b>. You can draft articles, but submission requires admin approval.
        </div>
      )}

      <div className="grid grid-4 mb-3">
        <div className="kpi"><div className="num">{counts.published}</div><div className="lbl">Published (recent)</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--warning)" }}>{counts.pending}</div><div className="lbl">Pending review</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--muted)" }}>{counts.draft}</div><div className="lbl">Drafts</div></div>
        <div className="kpi"><div className="num">{articles.reduce((s, a) => s + a.viewCount, 0)}</div><div className="lbl">Total views (recent)</div></div>
      </div>

      {rejected.length > 0 && (
        <div className="toast-note mb-3" style={{ background: "rgba(220,38,38,.1)", borderColor: "rgba(220,38,38,.25)", color: "var(--error)" }}>
          {rejected.length} article(s) need changes. <Link href="/reporter/articles" style={{ color: "var(--error)", fontWeight: 700 }}>Review feedback →</Link>
        </div>
      )}

      <div className="row-between mb-2">
        <div className="section-title" style={{ marginBottom: 0 }}>Recent articles</div>
        <Link href="/reporter/articles" className="small" style={{ color: "var(--purple)", fontWeight: 700 }}>View all</Link>
      </div>
      {articles.length === 0 ? (
        <div className="empty"><div className="big">&#128240;</div><div>No articles yet. Start writing!</div></div>
      ) : (
        articles.map((a) => (
          <div key={a.id} className="list-row">
            <div className="grow">
              <div className="title">{a.title}</div>
              <div className="sub">Updated {formatRelative(a.updatedAt)} · {a.viewCount} views</div>
            </div>
            <span className={`badge ${STATUS_BADGE[a.status] ?? "badge-muted"}`}>{a.status}</span>
          </div>
        ))
      )}
    </main>
  );
}
