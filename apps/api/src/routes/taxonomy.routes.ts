import { Router } from "express";
import { and, asc, eq, isNull } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db/client";
import { categories, regions } from "../db/schema";
import { asyncHandler, respond } from "../utils/http";

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

categoryRouter.get(
  "/:slug/articles",
  asyncHandler(async (req: Request, res: Response) => {
    const [category] = await db
      .select()
      .from(categories)
      .where(and(eq(categories.slug, req.params.slug as string), isNull(categories.deletedAt)))
      .limit(1);
    if (!category) return respond(res, 404, null);
    return respond(res, 200, { categoryId: category.id });
  }),
);

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
