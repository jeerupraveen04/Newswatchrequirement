import Link from "next/link";
import { apiFetch } from "@/lib/api";

export const revalidate = 300;
export const metadata = { title: "Categories" };

interface Category {
  id: string;
  name: string;
  slug: string;
}

export default async function CategoriesPage() {
  let categories: Category[] = [];
  try {
    categories = await apiFetch<Category[]>("/categories", { revalidate: 300 });
  } catch {
    /* empty */
  }

  return (
    <main className="page">
      <h1 className="page-title">Categories</h1>
      <p className="page-sub">Browse news by topic.</p>
      {categories.length === 0 ? (
        <div className="empty"><div className="big">&#9638;</div><div>No categories yet.</div></div>
      ) : (
        <div className="grid grid-3">
          {categories.map((c) => (
            <Link key={c.id} href={`/category/${c.slug}`} className="card card-pad center">
              <div className="section-title" style={{ marginBottom: 4 }}>{c.name}</div>
              <div className="small muted">View articles</div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
