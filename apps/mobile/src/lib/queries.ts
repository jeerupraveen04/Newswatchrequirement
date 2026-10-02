import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, apiPage } from "./api";

export interface MediaRef {
  id: string;
  kind: "image" | "video";
  url: string | null;
  posterUrl: string | null;
  width?: number | null;
  height?: number | null;
  alt?: string | null;
}

export interface ArticleCard {
  id: string;
  slug: string;
  title: string;
  summary: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  bookmarkCount: number;
  readingMinutes: number;
  publishedAt: string | null;
  headlineStyle: { color?: string; fontSize?: number } | null;
  descriptionStyle: { color?: string; fontSize?: number } | null;
  categories: Array<{ id: string; name: string; slug: string }>;
  heroMedia: MediaRef | null;
  media?: Array<MediaRef & { position: number; isHero: boolean }>;
}

export interface ArticleDetail extends ArticleCard {
  body: string;
  bodyFormat: "rich" | "markdown";
  tags: string[];
  reporter: { displayName: string; username?: string } | null;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  followerCount?: number;
}

export interface Region {
  id: string;
  type: "state" | "district" | "constituency" | "mandal";
  name: string;
  slug: string;
  parentId: string | null;
}

export interface Comment {
  id: string;
  articleId: string;
  parentId: string | null;
  depth: number;
  body: string;
  likeCount: number;
  replyCount: number;
  createdAt: string;
  author: { id: string; displayName: string; username: string; avatarUrl: string | null; role: string } | null;
  replies: Comment[];
}

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  deepLink: string | null;
  read: boolean;
  createdAt: string;
}

export interface ReporterArticle {
  id: string;
  slug: string;
  title: string;
  summary: string;
  status: "draft" | "pending" | "published" | "rejected" | "unpublished";
  regionId: string;
  viewCount: number;
  likeCount: number;
  reviewNote: string | null;
  submittedAt: string | null;
  publishedAt: string | null;
  updatedAt: string;
}

export interface ReporterProfile {
  id: string;
  userId: string;
  status: "pending" | "approved" | "rejected" | "revoked";
  fullName: string;
  bio: string;
  phone: string;
  beats: string[];
  portfolioUrl: string | null;
  sampleArticleUrl: string | null;
  reviewerNote: string | null;
}

// ------------------------------- Reader ----------------------------------

export function useFeed(categoryId?: string, regionId?: string) {
  return useQuery({
    queryKey: ["feed", categoryId ?? "all", regionId ?? "all"],
    queryFn: async () => {
      const { data, meta } = await apiPage<ArticleCard[]>("/articles/feed", {
        query: { limit: 20, categoryId, regionId },
      });
      return { items: data, nextCursor: meta.nextCursor, hasMore: meta.hasMore };
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
    queryFn: () => api<Category[]>("/categories"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCategoryArticles(slug: string) {
  return useQuery({
    queryKey: ["category", slug, "articles"],
    queryFn: () => api<{ categoryId: string; articleIds: string[] }>(`/categories/${slug}/articles`),
    enabled: Boolean(slug),
  });
}

export function useSearch(q: string) {
  return useQuery({
    queryKey: ["search", q],
    queryFn: () => api<Array<{ id: string; slug: string; title: string; summary: string }>>("/articles/search", { query: { q } }),
    enabled: q.trim().length > 0,
  });
}

export interface BookmarkRow {
  articleId: string;
  bookmarkedAt: string;
  article: { id: string; slug: string; title: string; summary: string; viewCount: number; publishedAt: string | null; status: string };
}

export function useBookmarks() {
  return useQuery({
    queryKey: ["bookmarks"],
    queryFn: () => api<BookmarkRow[]>("/bookmarks"),
  });
}

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    queryFn: () => api<{ items: Notification[]; unread: number }>("/notifications", { query: { limit: 30 } }),
  });
}

export function useComments(articleId: string) {
  return useQuery({
    queryKey: ["comments", articleId],
    queryFn: () => api<Comment[]>(`/articles/${articleId}/comments`, { query: { limit: 50 } }),
    enabled: Boolean(articleId),
  });
}

// ------------------------------ Reporter ---------------------------------

export function useReporterProfile() {
  return useQuery({
    queryKey: ["reporter", "profile"],
    queryFn: () => api<ReporterProfile | null>("/reporter/profile"),
  });
}

export function useReporterStats() {
  return useQuery({
    queryKey: ["reporter", "stats"],
    queryFn: () =>
      api<{ published: number; pending: number; draft: number; rejected: number; unpublished: number; views: number; likes: number }>(
        "/reporter/stats",
      ),
  });
}

export function useReporterCounts() {
  return useQuery({
    queryKey: ["reporter", "counts"],
    queryFn: () => api<Record<string, number>>("/reporter/counts"),
  });
}

export function useReporterRegions() {
  return useQuery({
    queryKey: ["reporter", "regions"],
    queryFn: () => api<Region[]>("/reporter/regions"),
  });
}

export function useMyArticles(status?: string, regionId?: string) {
  return useQuery({
    queryKey: ["reporter", "articles", status ?? "all", regionId ?? "all"],
    queryFn: () => api<ReporterArticle[]>("/reporter/articles", { query: { status, regionId } }),
  });
}

export function useReporterArticle(id: string) {
  return useQuery({
    queryKey: ["reporter", "article", id],
    queryFn: () => api<ArticleDetail & { status: string }>(`/reporter/articles/${id}`),
    enabled: Boolean(id),
  });
}

export function useSubmitArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/reporter/articles/${id}/submit`, { method: "POST" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reporter"] });
    },
  });
}

export function useDeleteArticle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/reporter/articles/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["reporter"] });
    },
  });
}

export function useToggleLike() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { targetType: "article" | "comment"; targetId: string }) =>
      api<{ liked: boolean }>("/like", { method: "POST", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["article"] });
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });
}

export function useToggleBookmark() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (articleId: string) => api<{ bookmarked: boolean }>("/bookmarks", { method: "POST", body: { articleId } }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["bookmarks"] });
      void qc.invalidateQueries({ queryKey: ["article"] });
    },
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api(`/notifications/${id}/read`, { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api("/notifications/read-all", { method: "POST" }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useToggleFollow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { targetType: "reporter" | "category"; targetId: string }) =>
      api<{ following: boolean }>("/follows", { method: "POST", body: input }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["follows"] }),
  });
}

export function usePostComment(articleId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { body: string; parentId?: string }) =>
      api<Comment>(`/articles/${articleId}/comments`, { method: "POST", body: input }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["comments", articleId] });
      void qc.invalidateQueries({ queryKey: ["article"] });
    },
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

export function formatCount(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

export function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

export function wordCount(text: string): number {
  return stripHtml(text).split(/\s+/).filter(Boolean).length;
}
