import type { Request, Response, NextFunction } from "express";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { reporterProfiles, users, type User, type UserRole } from "../db/schema";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { verifyAccessToken } from "../services/token.service";
import { regionRepo } from "../repositories/region.repo";

export interface Principal {
  id: string;
  role: UserRole;
  isDeleted: boolean;
  regionScopes: string[]; // expanded region ids; ['*'] for super_admin
  isApprovedReporter: boolean;
  reporterStatus: string | null;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: Principal;
    }
  }
}

async function resolvePrincipal(user: User): Promise<Principal> {
  let regionScopes: string[] = [];
  if (user.role === "super_admin") {
    regionScopes = ["*"];
  } else if (user.role === "admin") {
    const seeds = await regionRepo.adminScopeRegionIds(user.id);
    regionScopes = [...(await regionRepo.expandScope(seeds))];
  } else if (user.role === "reporter") {
    const seeds = await regionRepo.reporterScopeRegionIds(user.id);
    regionScopes = [...(await regionRepo.expandScope(seeds))];
  }

  let reporterStatus: string | null = null;
  if (user.role === "reporter") {
    const [profile] = await db
      .select({ status: reporterProfiles.status })
      .from(reporterProfiles)
      .where(eq(reporterProfiles.userId, user.id))
      .limit(1);
    reporterStatus = profile?.status ?? null;
  }

  return {
    id: user.id,
    role: user.role,
    isDeleted: user.isDeleted,
    regionScopes,
    isApprovedReporter: reporterStatus === "approved",
    reporterStatus,
  };
}

async function loadUser(userId: string, tokenRole: string): Promise<Principal> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 401);
  if (user.isDeleted || user.status === "deleted") {
    throw new AppError(ErrorCode.ACCOUNT_DELETED, 401, "Account has been deleted");
  }
  if (user.status === "suspended") {
    throw new AppError(ErrorCode.FORBIDDEN, 403, "Account suspended");
  }
  void tokenRole; // DB role is authoritative
  return resolvePrincipal(user);
}

/** Require a valid access token. */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.header("Authorization");
    if (!header?.startsWith("Bearer ")) throw new AppError(ErrorCode.AUTH_REQUIRED, 401);
    const payload = verifyAccessToken(header.slice(7));
    req.user = await loadUser(payload.sub, payload.role);
    next();
  } catch (e) {
    next(e);
  }
}

/** Populate req.user if a token is present; otherwise continue as guest. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.header("Authorization");
  if (!header?.startsWith("Bearer ")) return next();
  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = await loadUser(payload.sub, payload.role);
  } catch {
    // ignore invalid token on optional routes
  }
  next();
}

export function requireRole(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(ErrorCode.AUTH_REQUIRED, 401));
    if (!roles.includes(req.user.role)) return next(new AppError(ErrorCode.FORBIDDEN, 403));
    next();
  };
}

export function requireSuperAdmin() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(ErrorCode.AUTH_REQUIRED, 401));
    if (req.user.role !== "super_admin") return next(new AppError(ErrorCode.FORBIDDEN, 403));
    next();
  };
}

export function requireApprovedReporter() {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError(ErrorCode.AUTH_REQUIRED, 401));
    if (req.user.role !== "reporter" || !req.user.isApprovedReporter) {
      return next(new AppError(ErrorCode.REPORTER_NOT_APPROVED, 403));
    }
    next();
  };
}

/** True if the actor may act on the given region id. */
export function actorInScope(user: Principal, regionId: string): boolean {
  if (user.role === "super_admin") return true;
  return user.regionScopes.includes(regionId);
}
