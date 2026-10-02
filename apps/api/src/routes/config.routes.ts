import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler, respond } from "../utils/http";
import { appSettingsService } from "../services/appSettings.service";

export const configRouter: Router = Router();

/**
 * Public bootstrap config for clients (P01 Splash / P02 Onboarding).
 * Returns non-secret app settings, feature flags, and the minimum client
 * version. Never exposes private settings.
 */
configRouter.get(
  "/config",
  asyncHandler(async (_req: Request, res: Response) => {
    const settings = await appSettingsService.getPublic();
    return respond(res, 200, {
      settings,
      features: {
        comments: true,
        reactions: true,
        bookmarks: true,
        follows: true,
        reporter: true,
        sharePoster: true,
        push: false,
      },
      minAppVersion: (settings.minAppVersion as string) ?? "0.1.0",
      onboarding: (settings.onboarding as unknown) ?? null,
    });
  }),
);
