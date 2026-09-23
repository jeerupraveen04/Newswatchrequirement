import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";

export interface AccessTokenPayload {
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

export function signAccessToken(userId: string, role: string): string {
  return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    return jwt.verify(token, env.JWT_ACCESS_SECRET) as AccessTokenPayload;
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, 401);
    }
    throw new AppError(ErrorCode.TOKEN_INVALID, 401);
  }
}

export function signRefreshToken(userId: string, familyId: string): string {
  return jwt.sign({ sub: userId, fam: familyId, jti: crypto.randomUUID() }, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TTL as jwt.SignOptions["expiresIn"],
  });
}

export function verifyRefreshToken(token: string): { sub: string; fam: string } {
  try {
    return jwt.verify(token, env.JWT_REFRESH_SECRET) as { sub: string; fam: string };
  } catch (e) {
    if (e instanceof jwt.TokenExpiredError) {
      throw new AppError(ErrorCode.TOKEN_EXPIRED, 401);
    }
    throw new AppError(ErrorCode.TOKEN_INVALID, 401);
  }
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function newFamilyId(): string {
  return crypto.randomUUID();
}
