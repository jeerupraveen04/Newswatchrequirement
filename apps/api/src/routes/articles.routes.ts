import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { articleService } from "../services/article.service";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { optionalAuth, authenticate, requireRole, requireApprovedReporter } from "../middleware/auth";
import { encodeCursor } from "@newswatch/shared";

export const articleRouter: Router = Router();

const listQuery = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().min(1).max(50).default(20),
  categoryId: z.string().uuid().optional(),
  regionId: z.string().uuid().optional(),
});

articleRouter.get(
  "/feed",
  optionalAuth,
  validate({ query: listQuery }),
  asyncHandler(async (req: Request, res: Response) => {
    const q = req.query as unknown as z.infer<typeof listQuery>;
    const result = await articleService.getFeed(q);
    return respond(res, 200, result.items, result.meta);
  }),
);

articleRouter.get(
  "/feed/breaking",
  optionalAuth,
  validate({ query: z.object({ limit: z.coerce.number().min(1).max(20).default(5) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number((req.query as { limit?: number }).limit ?? 5);
    return respond(res, 200, await articleService.getBreaking(limit));
  }),
);

articleRouter.get(
  "/search",
  optionalAuth,
  validate({
    query: z.object({
      q: z.string().min(1),
      limit: z.coerce.number().min(1).max(50).default(20),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { q, limit } = req.query as unknown as { q: string; limit: number };
    const items = await articleService.search(q, limit);
    return respond(res, 200, items, { nextCursor: null, hasMore: false, limit });
  }),
);

articleRouter.get(
  "/:slug",
  optionalAuth,
  asyncHandler(async (req: Request, res: Response) => {
    const article = await articleService.getBySlug(req.params.slug as string, req.user ?? null);
    return respond(res, 200, article);
  }),
);

// ---- Reporter authoring ----

const createSchema = z.object({
  title: z.string().min(5).max(140),
  summary: z.string().min(1).max(300),
  body: z.string().min(1),
  bodyFormat: z.enum(["rich", "markdown"]).default("rich"),
  regionId: z.string().uuid(),
  categoryIds: z.array(z.string().uuid()).optional(),
  tags: z.array(z.string().min(1).max(30)).max(10).optional(),
  headlineStyle: z.unknown().optional(),
  descriptionStyle: z.unknown().optional(),
  poster: z.unknown().optional(),
});

articleRouter.post(
  "/",
  authenticate,
  requireRole("reporter", "admin", "super_admin"),
  requireApprovedReporter(),
  validate({ body: createSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const article = await articleService.createDraft(req.user!, req.body);
    return respond(res, 201, article);
  }),
);

articleRouter.post(
  "/:id/submit",
  authenticate,
  requireRole("reporter", "admin", "super_admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const article = await articleService.submit(req.user!, req.params.id as string);
    return respond(res, 200, article);
  }),
);

const moderateSchema = z.object({
  action: z.enum(["publish", "reject", "unpublish"]),
  note: z.string().max(500).optional(),
});

articleRouter.post(
  "/:id/moderate",
  authenticate,
  requireRole("admin", "super_admin"),
  validate({ body: moderateSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const { action, note } = req.body as z.infer<typeof moderateSchema>;
    const article = await articleService.moderate(req.user!, req.params.id as string, action, note);
    return respond(res, 200, article);
  }),
);

// Keep encodeCursor referenced for future cursor helpers in this module.
void encodeCursor;
