import { apiFetch, apiFetchPage } from "@/lib/api";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { ArticleRow } from "@/components/article-card";

export const revalidate = 60;

interface Category {
  id: string;
  name: string;
  slug: string;
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  return { title: `${params.slug.charAt(0).toUpperCase() + params.slug.slice(1)} news` };
}

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  let categoryId: string | null = null;
  let categoryName = params.slug;
  let items: ArticleCardType[] = [];
  try {
    const categories = await apiFetch<Category[]>("/categories", { revalidate: 300 });
    const match = categories.find((c) => c.slug === params.slug);
    categoryId = match?.id ?? null;
    categoryName = match?.name ?? params.slug;
    if (categoryId) {
      ({ items } = await apiFetchPage<ArticleCardType>(`/articles/feed?categoryId=${categoryId}&limit=20`, {
        revalidate: 60,
      }));
    }
  } catch {
    /* empty */
  }

  return (
    <main className="page">
      <h1 className="page-title">{categoryName}</h1>
      <p className="page-sub">Latest in {categoryName}.</p>
      {items.length === 0 ? (
        <div className="empty"><div className="big">&#128240;</div><div>No articles in this category yet.</div></div>
      ) : (
        items.map((a) => <ArticleRow key={a.id} article={a} />)
      )}
    </main>
  );
}
