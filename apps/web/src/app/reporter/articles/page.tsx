"use client";

import Link from "next/link";
import { useState } from "react";
import { useApiQuery } from "@/lib/hooks";
import { formatRelative } from "@/lib/types";

interface ReporterArticle {
  id: string;
  slug: string;
  title: string;
  status: string;
  reviewNote: string | null;
  updatedAt: string;
  viewCount: number;
}

const STATUS_BADGE: Record<string, string> = {
  draft: "badge-muted",
  pending: "badge-warning",
  published: "badge-success",
  rejected: "badge-error",
  unpublished: "badge-muted",
};

const FILTERS = ["all", "draft", "pending", "published", "rejected"];

export default function MyArticlesPage() {
  const [filter, setFilter] = useState("all");
  const path = filter === "all" ? "/reporter/articles" : `/reporter/articles?status=${filter}`;
  const { data, isLoading } = useApiQuery<ReporterArticle[]>(["reporter-articles", filter], path);

  return (
    <main className="page">
      <div className="row-between mb-2">
        <h1 className="page-title" style={{ marginBottom: 0 }}>My articles</h1>
        <Link href="/reporter/compose" className="btn btn-primary btn-sm">+ New</Link>
      </div>
      <p className="page-sub">Track every story from draft to published.</p>

      <div className="row mb-3 wrap">
        {FILTERS.map((f) => (
          <button key={f} className={`chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {isLoading && <div className="skeleton" style={{ height: 80 }} />}
      {!isLoading && (!data || data.length === 0) && (
        <div className="empty"><div className="big">&#128240;</div><div>No articles in this filter.</div></div>
      )}

      {data?.map((a) => (
        <div
          key={a.id}
          className="list-row"
          style={a.status === "rejected" ? { borderColor: "rgba(220,38,38,.4)", background: "rgba(220,38,38,.03)" } : undefined}
        >
          <div className="grow">
            <div className="title">{a.title}</div>
            <div className="sub">
              Updated {formatRelative(a.updatedAt)} · {a.viewCount} views
              {a.reviewNote && <span style={{ color: "var(--error)" }}> · {a.reviewNote}</span>}
            </div>
          </div>
          <span className={`badge ${STATUS_BADGE[a.status] ?? "badge-muted"}`}>{a.status}</span>
          <div className="end">
            {a.status === "rejected" || a.status === "draft" ? (
              <Link href={`/reporter/compose?id=${a.id}`} className="btn btn-secondary btn-sm">Edit</Link>
            ) : (
              <Link href={`/news/${a.slug}`} className="btn btn-ghost btn-sm">View</Link>
            )}
          </div>
        </div>
      ))}
    </main>
  );
}
