/** Shared web types mirroring the API contract. */

export interface UserSummary {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  role: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  colorToken: string | null;
}

export interface HeroMedia {
  id: string;
  kind: "image" | "video";
  url: string | null;
  posterUrl: string | null;
  alt: string | null;
  durationSeconds: string | null;
}

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  headlineStyle: { color?: string; fontSize?: number; weight?: number } | null;
  descriptionStyle: { color?: string; fontSize?: number } | null;
  status: string;
  isBreaking: boolean;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  readingMinutes: number;
  publishedAt: string | null;
  createdAt: string;
  reporter: UserSummary | null;
  region: { id: string; name: string; type: string } | null;
  categories: Category[];
  heroMedia: HeroMedia | null;
  media?: Array<HeroMedia & { position: number; isHero: boolean }>;
}

export interface ArticleDetail extends ArticleCard {
  body: string;
  bodyFormat: "rich" | "markdown";
  tags: string[];
}

export interface SessionUser {
  id: string;
  email: string | null;
  displayName: string;
  username: string;
  role: string;
  avatarUrl: string | null;
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso).getTime();
  const diff = Date.now() - d;
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}
