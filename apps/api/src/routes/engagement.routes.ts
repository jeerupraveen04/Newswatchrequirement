import { Router } from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import {
  bookmarkService,
  commentService,
  followService,
  notificationService,
  reactionService,
} from "../services/engagement.service";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";

// ---- Comments ----
export const commentRouter: Router = Router();

commentRouter.get(
  "/articles/:articleId/comments",
  validate({ query: z.object({ limit: z.coerce.number().min(1).max(50).default(20) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number((req.query as { limit?: number }).limit ?? 20);
    const items = await commentService.list(req.params.articleId as string, { limit });
    return respond(res, 200, items);
  }),
);

commentRouter.post(
  "/articles/:articleId/comments",
  authenticate,
  validate({ body: z.object({ body: z.string().min(1).max(1000), parentId: z.string().uuid().optional() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const { body, parentId } = req.body;
    const comment = await commentService.create(req.user!, req.params.articleId as string, body, parentId);
    return respond(res, 201, comment);
  }),
);

commentRouter.patch(
  "/comments/:id",
  authenticate,
  validate({ body: z.object({ body: z.string().min(1).max(1000) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const comment = await commentService.update(req.user!, req.params.id as string, req.body.body);
    return respond(res, 200, comment);
  }),
);

commentRouter.delete(
  "/comments/:id",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const result = await commentService.remove(req.user!, req.params.id as string);
    return respond(res, 200, result);
  }),
);

// ---- Reactions (likes) ----
export const reactionRouter: Router = Router();

reactionRouter.post(
  "/like",
  authenticate,
  validate({ body: z.object({ targetType: z.enum(["article", "comment"]), targetId: z.string().uuid() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await reactionService.toggle(req.user!, req.body.targetType, req.body.targetId);
    return respond(res, 200, result);
  }),
);

// ---- Bookmarks ----
export const bookmarkRouter: Router = Router();

bookmarkRouter.post(
  "/bookmarks",
  authenticate,
  validate({ body: z.object({ articleId: z.string().uuid() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await bookmarkService.toggle(req.user!, req.body.articleId);
    return respond(res, 200, result);
  }),
);

bookmarkRouter.get(
  "/bookmarks",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await bookmarkService.list(req.user!));
  }),
);

// ---- Follows ----
export const followRouter: Router = Router();

followRouter.post(
  "/follows",
  authenticate,
  validate({ body: z.object({ targetType: z.enum(["reporter", "category"]), targetId: z.string().uuid() }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const result = await followService.toggle(req.user!, req.body.targetType, req.body.targetId);
    return respond(res, 200, result);
  }),
);

// ---- Notifications ----
export const notificationRouter: Router = Router();

notificationRouter.get(
  "/notifications",
  authenticate,
  validate({ query: z.object({ limit: z.coerce.number().min(1).max(50).default(20) }) }),
  asyncHandler(async (req: Request, res: Response) => {
    const limit = Number((req.query as { limit?: number }).limit ?? 20);
    return respond(res, 200, await notificationService.list(req.user!, limit));
  }),
);

notificationRouter.post(
  "/notifications/:id/read",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await notificationService.markRead(req.user!, req.params.id as string));
  }),
);

notificationRouter.post(
  "/notifications/read-all",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    return respond(res, 200, await notificationService.markAllRead(req.user!));
  }),
);
