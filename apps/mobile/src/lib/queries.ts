import { useQuery } from "@tanstack/react-query";
import { api } from "./api";

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  viewCount: number;
  likeCount: number;
  publishedAt: string | null;
  headlineStyle: { color?: string; fontSize?: number } | null;
  descriptionStyle: { color?: string; fontSize?: number } | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  heroMedia: { id: string; kind: "image" | "video"; url: string | null; posterUrl: string | null } | null;
}

export interface ArticleDetail extends ArticleCard {
  body: string;
  tags: string[];
  reporter: { displayName: string } | null;
}

export function useFeed(categoryId?: string) {
  return useQuery({
    queryKey: ["feed", categoryId ?? "all"],
    queryFn: async () => {
      const data = await api<ArticleCard[]>(`/articles/feed?limit=20${categoryId ? `&categoryId=${categoryId}` : ""}`);
      return data;
    },
  });
}

export function useArticle(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: () => api<ArticleDetail>(`/articles/${slug}`),
    enabled: Boolean(slug),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: () => api<Array<{ id: string; name: string; slug: string }>>("/categories"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api<Array<{ id: string; slug: string; title: string; summary: string }>>(`/articles/search?q=${encodeURIComponent(q)}`),
    enabled: q.trim().length > 0,
  });
}

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () =>
      api<Array<{ articleId: string; article: { slug: string; title: string; summary: string } }>>("/bookmarks"),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () =>
      api<{ items: Array<{ id: string; title: string; body: string; read: boolean; deepLink: string | null }>; unread: number }>(
        "/notifications?limit=30",
      ),
  });
}

export function formatRelative(iso: string | null): string {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}
