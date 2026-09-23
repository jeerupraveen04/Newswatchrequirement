import { apiFetchPage } from "@/lib/api";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { ArticleRow } from "@/components/article-card";

export const revalidate = 30;
export const metadata = { title: "News listing" };

export default async function ListingPage() {
  let items: ArticleCardType[] = [];
  try {
    ({ items } = await apiFetchPage<ArticleCardType>("/articles/feed?limit=20", { revalidate: 30 }));
  } catch {
    /* handled by empty state */
  }

  return (
    <main className="page">
      <h1 className="page-title">News listing</h1>
      <p className="page-sub">All the latest, newest first.</p>
      {items.length === 0 ? (
        <div className="empty"><div className="big">&#128240;</div><div>No stories yet.</div></div>
      ) : (
        items.map((a) => <ArticleRow key={a.id} article={a} />)
      )}
    </main>
  );
}
