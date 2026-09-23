import Link from "next/link";
import { apiFetchPage } from "@/lib/api";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { ArticleRow, ArticleTile } from "@/components/article-card";

export const revalidate = 30;

export default async function HomePage() {
  let articles: ArticleCardType[] = [];
  let failed = false;
  try {
    const { items } = await apiFetchPage<ArticleCardType>("/articles/feed?limit=10", { revalidate: 30 });
    articles = items;
  } catch {
    failed = true;
  }

  const [lead, ...rest] = articles;

  return (
    <main className="page">
      <div className="row-between mb-3">
        <div>
          <h1 className="page-title">Today&rsquo;s headlines</h1>
          <p className="page-sub" style={{ marginBottom: 0 }}>Swipe through the stories that matter.</p>
        </div>
        <Link href="/listing" className="btn btn-primary">Open feed →</Link>
      </div>

      <div className="row mb-3 wrap">
        <Link href="/" className="chip active">All</Link>
        <Link href="/category/india" className="chip">India</Link>
        <Link href="/category/sports" className="chip">Sports</Link>
        <Link href="/category/business" className="chip">Business</Link>
        <Link href="/category/technology" className="chip">Technology</Link>
        <Link href="/category/world" className="chip">World</Link>
      </div>

      {failed && (
        <div className="empty">
          <div className="big">&#9888;</div>
          <div>Couldn&rsquo;t load the feed.</div>
          <p className="small mt-1">Make sure the API is running at {process.env.NEXT_PUBLIC_API_URL}.</p>
        </div>
      )}

      {!failed && articles.length === 0 && (
        <div className="empty">
          <div className="big">&#128240;</div>
          <div>No published stories yet.</div>
        </div>
      )}

      {lead && <ArticleTile article={lead} />}
      {rest.map((a) => (
        <ArticleRow key={a.id} article={a} />
      ))}
    </main>
  );
}
