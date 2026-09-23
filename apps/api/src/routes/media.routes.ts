import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { mediaService } from "../services/media.service";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

export const mediaRouter: Router = Router();

mediaRouter.post(
  "/sign",
  authenticate,
  validate({
    body: z.object({
      kind: z.enum(["image", "video"]),
      contentType: z.string().min(3),
      sizeBytes: z.coerce.number().int().positive(),
      purpose: z.enum(["avatar", "article", "hero", "gallery", "poster", "video"]).default("article"),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await mediaService.sign({ principal: req.user!, ...req.body });
    return respond(res, 201, result);
  }),
);

mediaRouter.post(
  "/:id/complete",
  authenticate,
  validate({ body: z.object({ durationSeconds: z.coerce.number().optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await mediaService.complete({
      principal: req.user!,
      assetId: req.params.id as string,
      durationSeconds: req.body.durationSeconds,
    });
    return respond(res, 200, result);
  }),
);

mediaRouter.get(
  "/:id",
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await mediaService.get(req.params.id as string));
  }),
);

mediaRouter.delete(
  "/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await mediaService.remove(req.user!, req.params.id as string));
  }),
);
