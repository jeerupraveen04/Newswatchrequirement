import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { asyncHandler, respond } from "../utils/http";
import { authService, publicUser } from "../services/auth.service";
import { reporterProfiles, users } from "../db/schema";

function meta(req: Request) {
  return {
    deviceId: req.header("X-Device-Id") ?? undefined,
    userAgent: req.header("User-Agent") ?? undefined,
    ip: req.ip,
  };
}

export const authController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.register({ ...req.body, meta: meta(req) });
    return respond(res, 201, result);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.loginWithPassword({ ...req.body, meta: meta(req) });
    return respond(res, 200, result);
  }),

  otpRequest: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestOtp(req.body);
    return respond(res, 200, result);
  }),

  otpVerify: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.verifyOtp({ ...req.body, meta: meta(req) });
    return respond(res, 200, result);
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.refresh({ refreshToken: req.body.refreshToken, meta: meta(req) });
    return respond(res, 200, result);
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.logout(req.body.refreshToken);
    return respond(res, 200, result);
  }),

  forgot: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    return respond(res, 200, result);
  }),

  reset: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.resetPassword(req.body);
    return respond(res, 200, result);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const [user] = await db.select().from(users).where(eq(users.id, req.user!.id)).limit(1);
    const [profile] = user
      ? await db.select().from(reporterProfiles).where(eq(reporterProfiles.userId, user.id)).limit(1)
      : [undefined];
    return respond(res, 200, {
      user: user ? publicUser(user) : null,
      role: req.user!.role,
      regionScopes: req.user!.regionScopes,
      reporterStatus: profile?.status ?? null,
    });
  }),
};
