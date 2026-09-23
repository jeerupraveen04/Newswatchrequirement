"use client";

import Link from "next/link";
import { useApiQuery, useApiMutation } from "@/lib/hooks";
import { formatRelative } from "@/lib/types";

interface BookmarkRow {
  bookmarkedAt: string;
  articleId: string;
  article: { slug: string; title: string; summary: string };
}

export default function BookmarksPage() {
  const { data, isLoading } = useApiQuery<BookmarkRow[]>(["bookmarks"], "/bookmarks");
  const remove = useApiMutation<{ bookmarked: boolean }, { articleId: string }>("/bookmarks", {
    invalidate: [["bookmarks"]],
  });

  return (
    <main className="page">
      <h1 className="page-title">Saved</h1>
      <p className="page-sub">Articles you bookmarked for later.</p>
      {isLoading && <div className="skeleton" style={{ height: 80 }} />}
      {!isLoading && (!data || data.length === 0) && (
        <div className="empty">
          <div className="big">&#9873;</div>
          <div>No saved articles yet.</div>
          <Link href="/" className="btn btn-primary mt-2">Browse news</Link>
        </div>
      )}
      {data?.map((b) => (
        <div key={b.articleId} className="list-row">
          <div className="grow">
            <Link href={`/news/${b.article.slug}`}><div className="title">{b.article.title}</div></Link>
            <div className="sub">saved {formatRelative(b.bookmarkedAt)}</div>
          </div>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => remove.mutate({ articleId: b.articleId })}
          >
            Remove
          </button>
        </div>
      ))}
    </main>
  );
}
