import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { apiFetch } from "@/lib/api";
import type { ArticleDetail } from "@/lib/types";
import { formatCount, formatRelative } from "@/lib/types";
import { ArticleActions } from "@/components/article-actions";

export const revalidate = 60;

async function getArticle(slug: string): Promise<ArticleDetail | null> {
  try {
    return await apiFetch<ArticleDetail>(`/articles/${slug}`, { revalidate: 60 });
  } catch {
    return null;
  }
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const article = await getArticle(params.slug);
  if (!article) return { title: "Article not found" };
  return {
    title: article.title,
    description: article.summary,
    openGraph: {
      title: article.title,
      description: article.summary,
      images: article.heroMedia?.url ? [{ url: article.heroMedia.url }] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const article = await getArticle(params.slug);
  if (!article) notFound();

  const hero = article.heroMedia;

  return (
    <main className="page">
      <Link href="/" className="small muted">← Back to feed</Link>
      <article className="card mt-2">
        <div className="hero">
          {hero?.url && hero.kind === "video" ? (
            <video className="news-image" src={hero.url} poster={hero.posterUrl ?? undefined} controls playsInline preload="metadata" />
          ) : hero?.url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={hero.alt ?? article.title} />
          ) : null}
          {article.categories[0] && <span className="category">{article.categories[0].name}</span>}
          {hero?.kind === "video" && (
            <span className="category" style={{ left: "auto", right: 20 }}>&#127909; Video</span>
          )}
        </div>
        <div className="card-pad">
          <h1 className="article-title" style={{ color: article.headlineStyle?.color ?? undefined, fontSize: article.headlineStyle?.fontSize ? `${article.headlineStyle.fontSize}px` : undefined }}>
            {article.title}
          </h1>
          <p className="article-summary" style={{ color: article.descriptionStyle?.color ?? undefined }}>
            {article.summary}
          </p>
          <div className="meta-row">
            <div className="row small" style={{ fontWeight: 700 }}>
              <span style={{ width: 27, height: 27, borderRadius: "50%", background: "var(--purple)", display: "inline-block" }} />
              {article.reporter?.displayName ?? "NewsWatch"}
            </div>
            <div className="meta-item">{formatRelative(article.publishedAt)}</div>
            <div className="meta-item">{formatCount(article.viewCount)} views</div>
            <div className="meta-item">{article.readingMinutes} min read</div>
          </div>
          <ArticleActions articleId={article.id} slug={article.slug} likeCount={article.likeCount} />
          <div className="article-body" dangerouslySetInnerHTML={{ __html: article.body }} />
          {article.tags.length > 0 && (
            <div className="row wrap mt-3">
              {article.tags.map((t) => (
                <span key={t} className="badge badge-muted">#{t}</span>
              ))}
            </div>
          )}
        </div>
      </article>
      <div className="row mt-3">
        <Link href="/listing" className="btn btn-secondary">Open scroller mode</Link>
      </div>
    </main>
  );
}
