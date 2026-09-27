import { eq } from "drizzle-orm";
import { db } from "../db/client";
import { articles, articlePosters, mediaAssets, regions } from "../db/schema";
import { ErrorCode, PosterTemplate } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { putObject, publicUrl } from "../config/r2";
import type { Principal } from "../middleware/auth";

/**
 * Server-side poster rendering (R05, REQ-POSTER-001..014).
 * Renders an SVG poster (1080×1350) from a fixed set of 5 templates, uploads it
 * to R2 as an image media asset, and records it in `article_posters`.
 *
 * SVG is used so rendering needs no native image libraries; it is a valid
 * delivered image and can be rasterised later via sharp/resvg if desired.
 */

export type TemplateName = (typeof PosterTemplate)[keyof typeof PosterTemplate];

interface TemplateStyle {
  bg: string;
  fg: string;
  desc: string;
  accentTop?: boolean;
}

const TEMPLATES: Record<TemplateName, TemplateStyle> = {
  classic: { bg: "#8a007a", fg: "#ffffff", desc: "#f3d9ef" },
  breaking: { bg: "#dc2626", fg: "#ffffff", desc: "#ffe0e0" },
  minimal: { bg: "#ffffff", fg: "#8a007a", desc: "#555555", accentTop: true },
  gradient: { bg: "url(#grad)", fg: "#ffffff", desc: "#e5def2" },
  photo_hero: { bg: "#222222", fg: "#ffffff", desc: "#e0e0e0" },
};

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c] as string,
  );
}

function wrap(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > maxChars) {
      lines.push(line.trim());
      line = w;
      if (lines.length === maxLines) break;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line && lines.length < maxLines) lines.push(line);
  return lines;
}

export const posterService = {
  templates: Object.keys(TEMPLATES) as TemplateName[],

  async render(
    principal: Principal,
    input: {
      articleId: string;
      template: TemplateName;
      headlineColor?: string;
      headlineSize?: number;
      descColor?: string;
      descSize?: number;
      categoryTag?: string;
      bgPhotoUrl?: string | null;
    },
  ) {
    if (!(input.template in TEMPLATES)) throw new AppError(ErrorCode.INVALID_TEMPLATE, 422);

    const [article] = await db.select().from(articles).where(eq(articles.id, input.articleId)).limit(1);
    if (!article) throw new AppError(ErrorCode.ARTICLE_NOT_FOUND, 404);

    const [region] = await db.select().from(regions).where(eq(regions.id, article.regionId)).limit(1);

    const style = TEMPLATES[input.template];
    const fg = input.headlineColor ?? style.fg;
    const descColor = input.descColor ?? style.desc;
    const hSize = Math.min(64, Math.max(24, input.headlineSize ?? 40));
    const dSize = Math.min(32, Math.max(14, input.descSize ?? 20));
    const tag = escapeXml(input.categoryTag ?? region?.name ?? "NEWS");

    const headlineLines = wrap(article.title, 22, 5);
    const descLines = wrap(article.summary, 34, 3);

    const width = 1080;
    const height = 1350;
    const headlineTop = 880 - (headlineLines.length - 1) * (hSize + 6);
    const headlineSvg = headlineLines
      .map((l, i) => `<text x="80" y="${headlineTop + i * (hSize + 6)}" fill="${fg}" font-size="${hSize}" font-weight="800" font-family="Arial, Helvetica, sans-serif">${escapeXml(l)}</text>`)
      .join("");
    const descTop = headlineTop + headlineLines.length * (hSize + 6) + 24;
    const descSvg = descLines
      .map((l, i) => `<text x="80" y="${descTop + i * (dSize + 8)}" fill="${descColor}" font-size="${dSize}" font-family="Arial, Helvetica, sans-serif">${escapeXml(l)}</text>`)
      .join("");

    const bgImage =
      input.template === "photo_hero" && input.bgPhotoUrl
        ? `<image href="${input.bgPhotoUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/><rect width="${width}" height="${height}" fill="rgba(0,0,0,0.55)"/>`
        : "";

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="grad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#8a007a"/><stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  ${bgImage || `<rect width="${width}" height="${height}" fill="${style.bg}"/>`}
  ${style.accentTop ? `<rect width="${width}" height="16" fill="#8a007a"/>` : ""}
  <circle cx="100" cy="100" r="26" fill="${input.template === "minimal" ? "#8a007a" : "#ffffff"}"/>
  <text x="140" y="112" fill="${fg}" font-size="40" font-weight="800" font-family="Arial, Helvetica, sans-serif">newswatch</text>
  <rect x="880" y="76" rx="16" width="140" height="48" fill="rgba(255,255,255,0.9)"/>
  <text x="950" y="110" text-anchor="middle" fill="#8a007a" font-size="22" font-weight="700" font-family="Arial, Helvetica, sans-serif">${tag}</text>
  ${headlineSvg}
  ${descSvg}
  <text x="80" y="1270" fill="${descColor}" font-size="22" font-weight="700" font-family="Arial, Helvetica, sans-serif">newswatch.com</text>
  <text x="1000" y="1270" text-anchor="end" fill="${descColor}" font-size="22" font-family="Arial, Helvetica, sans-serif">${new Date().toISOString().slice(0, 10)}</text>
</svg>`;

    const key = `media/poster/${article.id}-${input.template}.svg`;
    await putObject(key, Buffer.from(svg, "utf8"), "image/svg+xml");

    const [asset] = await db
      .insert(mediaAssets)
      .values({
        ownerId: principal.id,
        purpose: "poster",
        kind: "image",
        status: "ready",
        processingStatus: "ready",
        storageKey: key,
        url: publicUrl(key),
        mimeType: "image/svg+xml",
        sizeBytes: Buffer.byteLength(svg, "utf8"),
        width,
        height,
      })
      .returning();

    // Upsert the default poster for this article.
    const existing = await db.select().from(articlePosters).where(eq(articlePosters.articleId, article.id));
    if (existing[0]) {
      await db
        .update(articlePosters)
        .set({ mediaAssetId: asset!.id, template: input.template, width, height, createdBy: principal.id, overrides: input })
        .where(eq(articlePosters.id, existing[0].id));
    } else {
      await db.insert(articlePosters).values({
        articleId: article.id,
        mediaAssetId: asset!.id,
        template: input.template,
        width,
        height,
        createdBy: principal.id,
        isDefault: true,
        overrides: input,
      });
    }

    // Store the choice on the article too (REQ-REP-090).
    await db
      .update(articles)
      .set({ poster: input as unknown as object })
      .where(eq(articles.id, article.id));

    return { url: publicUrl(key), template: input.template, width, height };
  },

  async getDefault(articleId: string) {
    const [row] = await db.select().from(articlePosters).where(eq(articlePosters.articleId, articleId));
    if (!row) return null;
    const [asset] = await db.select().from(mediaAssets).where(eq(mediaAssets.id, row.mediaAssetId)).limit(1);
    return { template: row.template, url: asset?.url ?? null, width: row.width, height: row.height };
  },
};
