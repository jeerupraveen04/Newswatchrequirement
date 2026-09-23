import Link from "next/link";
import { apiFetch, apiFetchPage } from "@/lib/api";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { ArticleRow } from "@/components/article-card";

export const metadata = { title: "Search" };

interface SearchResult {
  id: string;
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
}

export default async function SearchPage({ searchParams }: { searchParams: { q?: string } }) {
  const q = (searchParams.q ?? "").trim();
  let results: SearchResult[] = [];
  let categories: Array<{ id: string; name: string; slug: string }> = [];

  if (q) {
    try {
      results = await apiFetch<SearchResult[]>(`/articles/search?q=${encodeURIComponent(q)}&limit=20`, {
        revalidate: 0,
      });
    } catch {
      /* empty */
    }
  } else {
    try {
      categories = await apiFetch<Array<{ id: string; name: string; slug: string }>>("/categories", {
        revalidate: 300,
      });
    } catch {
      /* empty */
    }
  }

  void apiFetchPage;

  return (
    <main className="page">
      <h1 className="page-title">Search</h1>
      <p className="page-sub">Find articles, categories and reporters.</p>
      <form className="search-box" style={{ width: "100%", height: 48, marginBottom: 26 }} action="/search">
        <span>&#9906;</span>
        <input type="text" name="q" defaultValue={q} placeholder="Search news..." autoFocus />
      </form>

      {q ? (
        results.length === 0 ? (
          <div className="empty">
            <div className="big">&#128269;</div>
            <div>No results for &ldquo;{q}&rdquo;.</div>
            <div className="small mt-1">Try a different keyword or browse categories.</div>
          </div>
        ) : (
          <>
            <p className="muted small mb-2">{results.length} result(s) for &ldquo;{q}&rdquo;</p>
            {results.map((r) => (
              <Link key={r.id} href={`/news/${r.slug}`} className="list-row">
                <div className="grow">
                  <div className="title">{r.title}</div>
                  <div className="sub">{r.summary}</div>
                </div>
              </Link>
            ))}
          </>
        )
      ) : (
        <>
          <div className="section-title">Suggested categories</div>
          <div className="row wrap">
            {categories.map((c) => (
              <Link key={c.id} href={`/category/${c.slug}`} className="chip">{c.name}</Link>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
