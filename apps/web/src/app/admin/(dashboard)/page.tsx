"use client";

import Link from "next/link";
import { useApiQuery } from "@/lib/hooks";
import { useSession } from "@/lib/use-session";

interface AnalyticsSummary {
  totals: { published: number; views: number; likes: number; comments: number; bookmarks: number } | null;
  topArticles: { id: string; title: string; views: number }[];
}

interface QueueItem {
  id: string;
  title: string;
  status: string;
  submittedAt: string | null;
  reporterId: string;
  regionId: string;
}

export default function AdminDashboard() {
  const { session } = useSession();
  const isSuper = session.role === "super_admin";
  const { data: analytics, isLoading } = useApiQuery<AnalyticsSummary>(["admin", "analytics"], "/admin/analytics/summary");
  const { data: queue } = useApiQuery<QueueItem[]>(["admin", "moderation", "pending"], "/admin/moderation/queue?status=pending&limit=10");

  const totals = analytics?.totals;

  return (
    <>
      <div className="row-between mb-3">
        <div>
          <h1 className="page-title" style={{ marginBottom: 2 }}>Dashboard</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>
            {isSuper ? "Global overview" : `Region-scoped · ${session.regionScopes.length} region(s)`}
          </p>
        </div>
        <Link href="/admin/articles" className="btn btn-primary">Moderation queue</Link>
      </div>

      <div className="grid grid-4 mb-3">
        <div className="kpi"><div className="num">{isLoading ? "…" : totals?.published ?? 0}</div><div className="lbl">Published</div></div>
        <div className="kpi"><div className="num" style={{ color: "var(--warning)" }}>{queue?.length ?? 0}</div><div className="lbl">Pending review</div></div>
        <div className="kpi"><div className="num">{isLoading ? "…" : totals?.views ?? 0}</div><div className="lbl">Total views</div></div>
        <div className="kpi"><div className="num">{isLoading ? "…" : totals?.likes ?? 0}</div><div className="lbl">Total likes</div></div>
      </div>

      <div className="grid grid-2 mb-3">
        <div className="card card-pad">
          <div className="section-title">Pending moderation</div>
          {!queue || queue.length === 0 ? (
            <p className="muted small">Nothing in the queue.</p>
          ) : (
            queue.slice(0, 5).map((q) => (
              <div key={q.id} className="list-row">
                <div className="grow">
                  <div className="title">{q.title}</div>
                  <div className="sub">{q.status}</div>
                </div>
              </div>
            ))
          )}
          <Link href="/admin/articles" className="small" style={{ color: "var(--purple)", fontWeight: 700 }}>Open queue →</Link>
        </div>

        <div className="card card-pad">
          <div className="section-title">Top articles</div>
          {!analytics?.topArticles || analytics.topArticles.length === 0 ? (
            <p className="muted small">No data yet.</p>
          ) : (
            analytics.topArticles.map((a) => (
              <div key={a.id} className="list-row">
                <div className="grow"><div className="title">{a.title}</div></div>
                <span className="muted small">{a.views} views</span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="grid grid-2 mb-3">
        <Link href="/admin/articles" className="card card-pad">
          <div className="section-title">Article moderation</div>
          <p className="muted small">Review, approve, or reject submitted stories within your scope.</p>
        </Link>
        <Link href="/admin/reporters" className="card card-pad">
          <div className="section-title">Reporter approvals</div>
          <p className="muted small">Approve applicants and assign their region scope.</p>
        </Link>
      </div>

      {isSuper && (
        <div className="grid grid-3">
          <Link href="/admin/regions" className="card card-pad">
            <div className="section-title">Regions</div>
            <p className="muted small">Manage the State → District → Constituency → Mandal tree.</p>
          </Link>
          <Link href="/admin/app-settings" className="card card-pad">
            <div className="section-title">App &amp; Ad Settings</div>
            <p className="muted small">Contact and advertisement details.</p>
          </Link>
          <Link href="/admin/danger-zone" className="card card-pad" style={{ border: "1px solid rgba(220,38,38,.3)" }}>
            <div className="section-title" style={{ color: "var(--error)" }}>Danger Zone</div>
            <p className="muted small">Soft-delete users, hard-delete articles, audit log.</p>
          </Link>
        </div>
      )}
    </>
  );
}
