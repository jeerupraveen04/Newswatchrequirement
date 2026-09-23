import { Router } from "express";
import { asyncHandler, respond } from "../utils/http";
import { pingDb } from "../config/db";
import { pingRedis } from "../config/redis";

export const healthRouter: Router = Router();

healthRouter.get("/health", (_req, res) => {
  res.status(200).json({ success: true, data: { status: "ok" }, meta: {}, error: null });
});

healthRouter.get(
  "/ready",
  asyncHandler(async (_req, res) => {
    await pingDb();
    await pingRedis();
    return respond(res, 200, { status: "ready", db: "up", redis: "up" });
  }),
);
