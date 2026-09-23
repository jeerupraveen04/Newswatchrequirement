import Link from "next/link";
import type { ArticleCard as ArticleCardType } from "@/lib/types";
import { formatCount, formatRelative } from "@/lib/types";

export function ArticleTile({ article }: { article: ArticleCardType }) {
  const hero = article.heroMedia;
  const category = article.categories[0];
  return (
    <article className="card" style={{ marginBottom: 16 }}>
      <Link href={`/news/${article.slug}`} style={{ display: "block", position: "relative" }}>
        {hero?.url ? (
          hero.kind === "video" ? (
            <video
              src={hero.url}
              poster={hero.posterUrl ?? undefined}
              muted
              playsInline
              preload="metadata"
              style={{ width: "100%", height: 300, objectFit: "cover" }}
            />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={hero.url} alt={hero.alt ?? article.title} style={{ width: "100%", height: 300, objectFit: "cover" }} />
          )
        ) : (
          <div style={{ width: "100%", height: 300, background: "var(--purple-light)" }} />
        )}
        {category && (
          <span className="badge badge-purple" style={{ position: "absolute", left: 16, bottom: 16 }}>
            {category.name}
          </span>
        )}
      </Link>
      <div className="card-pad">
        <Link href={`/news/${article.slug}`}>
          <h2 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.22, color: article.headlineStyle?.color ?? undefined }}>
            {article.title}
          </h2>
        </Link>
        <p className="muted mt-1" style={{ fontSize: 14, lineHeight: 1.5, color: article.descriptionStyle?.color ?? undefined }}>
          {article.summary}
        </p>
        <div className="row mt-2 small muted">
          <b style={{ color: "var(--text)" }}>{article.reporter?.displayName ?? "NewsWatch"}</b>
          <span>{formatRelative(article.publishedAt)}</span>
          <span>{formatCount(article.viewCount)} views</span>
        </div>
      </div>
    </article>
  );
}

export function ArticleRow({ article }: { article: ArticleCardType }) {
  return (
    <Link href={`/news/${article.slug}`} className="list-row">
      {article.heroMedia?.url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="thumb" src={article.heroMedia.posterUrl ?? article.heroMedia.url} alt={article.title} />
      ) : (
        <div className="thumb" />
      )}
      <div className="grow">
        <div className="title">{article.title}</div>
        <div className="sub">
          {article.categories[0]?.name ?? "News"} · {formatRelative(article.publishedAt)} ·{" "}
          {formatCount(article.viewCount)} views
        </div>
      </div>
      {article.categories[0] && <span className="badge badge-muted">{article.categories[0].name}</span>}
    </Link>
  );
}
