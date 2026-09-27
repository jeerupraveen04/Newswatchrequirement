import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { posterService } from "../services/poster.service";

export const shareRouter: Router = Router();

const renderSchema = z.object({
  articleId: z.string().uuid(),
  template: z.enum(["classic", "breaking", "minimal", "gradient", "photo_hero"]),
  headlineColor: z.string().optional(),
  headlineSize: z.coerce.number().optional(),
  descColor: z.string().optional(),
  descSize: z.coerce.number().optional(),
  categoryTag: z.string().max(40).optional(),
  bgPhotoUrl: z.string().url().nullable().optional(),
});

shareRouter.post(
  "/share/poster",
  authenticate,
  validate({ body: renderSchema }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await posterService.render(req.user!, req.body);
    return respond(res, 201, result);
  }),
);

shareRouter.get(
  "/articles/:id/poster",
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await posterService.getDefault(req.params.id as string));
  }),
);
