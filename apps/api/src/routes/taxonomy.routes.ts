import { Router } from "express";
import { z } from "zod";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client";
import { articleCategories, categories, regions } from "../db/schema";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate, requireRole } from "../middleware/auth";
import { slugify } from "../utils/text";

// ============================ Categories ============================

export const categoryRouter: Router = Router();

categoryRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(categories)
      .where(isNull(categories.deletedAt))
      .orderBy(asc(categories.sortOrder));
    return respond(res, 200, rows);
  }),
);

const categoryBody = z.object({
  name: z.string().min(2).max(60),
  slug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  description: z.string().max(500).optional(),
  colorToken: z.string().max(40).optional(),
  sortOrder: z.coerce.number().int().min(0).max(999).optional(),
});

categoryRouter.post(
  "/",
  authenticate,
  requireRole("admin", "super_admin"),
  validate({ body: categoryBody }),
  asyncHandler(async (req: Request, res: Response) => {
    const b = req.body as z.infer<typeof categoryBody>;
    const slug = b.slug ?? slugify(b.name);
    const [existing] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, slug), isNull(categories.deletedAt)))
      .limit(1);
    if (existing) return respond(res, 409, existing);
    const [row] = await db
      .insert(categories)
      .values({
        name: b.name,
        slug,
        description: b.description ?? null,
        colorToken: b.colorToken ?? null,
        sortOrder: b.sortOrder ?? 0,
      })
      .returning();
    return respond(res, 201, row);
  }),
);

categoryRouter.patch(
  "/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  validate({ body: categoryBody.partial() }),
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db
      .update(categories)
      .set(req.body)
      .where(eq(categories.id, req.params.id as string))
      .returning();
    if (!row) return respond(res, 404, null);
    return respond(res, 200, row);
  }),
);

categoryRouter.delete(
  "/:id",
  authenticate,
  requireRole("admin", "super_admin"),
  asyncHandler(async (req: Request, res: Response) => {
    const [row] = await db
      .update(categories)
      .set({ deletedAt: new Date() })
      .where(eq(categories.id, req.params.id as string))
      .returning();
    if (!row) return respond(res, 404, null);
    return respond(res, 200, { deleted: true });
  }),
);

categoryRouter.get(
  "/:slug/articles",
  asyncHandler(async (req: Request, res: Response) => {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, req.params.slug as string), isNull(categories.deletedAt)))
      .limit(1);
    if (!category) return respond(res, 404, null);
    const links = await db
      .select({ articleId: articleCategories.articleId })
      .from(articleCategories)
      .where(eq(articleCategories.categoryId, category.id));
    return respond(res, 200, { categoryId: category.id, articleIds: links.map((l) => l.articleId) });
  }),
);

// ============================ Regions ============================

export const regionRouter: Router = Router();

regionRouter.get(
  "/",
  asyncHandler(async (_req: Request, res: Response) => {
    const rows = await db.select().from(regions).orderBy(asc(regions.sortOrder));
    return respond(res, 200, rows);
  }),
);

regionRouter.get(
  "/:id/children",
  asyncHandler(async (req: Request, res: Response) => {
    const rows = await db
      .select()
      .from(regions)
      .where(eq(regions.parentId, req.params.id as string))
      .orderBy(asc(regions.sortOrder));
    return respond(res, 200, rows);
  }),
);
