"use client";

import { useApiQuery } from "@/lib/hooks";

interface Summary {
  totals: { published: number; views: number; likes: number; comments: number; bookmarks: number } | null;
  topArticles: Array<{ id: string; title: string; views: number }>;
}

export default function AnalyticsPage() {
  const { data, isLoading } = useApiQuery<Summary>(["analytics"], "/admin/analytics/summary");

  return (
    <>
      <h1 className="page-title" style={{ marginBottom: 2 }}>Analytics</h1>
      <p className="page-sub">Region-scoped traffic and engagement.</p>

      {isLoading && <div className="skeleton" style={{ height: 100 }} />}

      {data && (
        <>
          <div className="grid grid-4 mb-3">
            <div className="kpi"><div className="num">{data.totals?.published ?? 0}</div><div className="lbl">Published</div></div>
            <div className="kpi"><div className="num">{data.totals?.views ?? 0}</div><div className="lbl">Page views</div></div>
            <div className="kpi"><div className="num">{data.totals?.likes ?? 0}</div><div className="lbl">Likes</div></div>
            <div className="kpi"><div className="num">{data.totals?.comments ?? 0}</div><div className="lbl">Comments</div></div>
          </div>

          <div className="card card-pad">
            <div className="section-title">Top articles</div>
            <table className="table">
              <thead><tr><th>Title</th><th>Views</th></tr></thead>
              <tbody>
                {data.topArticles.map((a) => (
                  <tr key={a.id}><td>{a.title}</td><td>{a.views}</td></tr>
                ))}
                {data.topArticles.length === 0 && <tr><td colSpan={2} className="muted">No published articles yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
