import { Router } from "express";
import { z } from "zod";
import { eq } from "drizzle-orm";
import type { Request, Response } from "express";
import { db } from "../db";
import { asyncHandler, respond } from "../utils/http";
import { validate } from "../middleware/validate";
import { authenticate } from "../middleware/auth";
import { appSettingsService } from "../services/appSettings.service";
import { publicUser } from "../services/auth.service";
import { devices, users } from "../db/schema";

export const userRouter: Router = Router();

userRouter.get(
  "/me",
  authenticate,
  asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    return respond(res, 200, user ? publicUser(user) : null);
  }),
);

userRouter.patch(
  "/me",
  authenticate,
  validate({
    body: z.object({
      displayName: z.string().min(2).max(60).optional(),
      bio: z.string().max(200).optional(),
      avatarUrl: z.string().url().optional(),
      username: z
        .string()
        .regex(/^[a-z0-9_]{3,30}$/)
        .optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db.update(users).set(req.body).where(eq(users.id, req.user!.id)).returning();
    return respond(res, 200, user ? publicUser(user) : null);
  }),
);

userRouter.get(
  "/:username",
  asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.username, req.params.username as string))
      .limit(1);
    if (!user || user.isDeleted) return respond(res, 404, null);
    return respond(res, 200, publicUser(user));
  }),
);

export const deviceRouter: Router = Router();

deviceRouter.post(
  "/devices",
  authenticate,
  validate({
    body: z.object({
      deviceId: z.string().min(1),
      pushToken: z.string().min(1).optional(),
      platform: z.enum(["ios", "android", "web"]),
      appVersion: z.string().optional(),
    }),
  }),
  asyncHandler(async (req: Request, res: Response) => {
    const { deviceId, pushToken, platform, appVersion } = req.body;
    const [device] = await db
      .insert(devices)
      .values({ userId: req.user!.id, deviceId, pushToken, platform, appVersion })
      .onConflictDoUpdate({
        target: [devices.userId, devices.deviceId],
        set: { pushToken, platform, appVersion, lastSeenAt: new Date() },
      })
      .returning();
    return respond(res, 200, { id: device!.id });
  }),
);

export const appSettingsRouter: Router = Router();

appSettingsRouter.get(
  "/app-settings",
  asyncHandler(async (_req: Request, res: Response) => {
    return respond(res, 200, await appSettingsService.getPublic());
  }),
);
