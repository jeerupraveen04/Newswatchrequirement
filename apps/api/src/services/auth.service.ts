import crypto from "node:crypto";
import argon2 from "argon2";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { env } from "../config/env";
import { ErrorCode } from "@newswatch/shared";
import { AppError } from "../errors/AppError";
import { otpCodes, refreshTokens, users, type User } from "../db/schema";
import {
  hashToken,
  newFamilyId,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "./token.service";
import { slugify } from "../utils/text";

const MAX_FAILED = 5;
const LOCK_MINUTES = 15;

function ttlToMs(ttl: string): number {
  const m = /^(\d+)([smhd])$/.exec(ttl.trim());
  if (!m) return 15 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2];
  const mult = unit === "s" ? 1000 : unit === "m" ? 60_000 : unit === "h" ? 3_600_000 : 86_400_000;
  return n * mult;
}

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

async function issueTokens(
  userId: string,
  role: string,
  familyId: string,
  meta: { deviceId?: string; userAgent?: string; ip?: string },
): Promise<IssuedTokens> {
  const accessToken = signAccessToken(userId, role);
  const refreshToken = signRefreshToken(userId, familyId);
  await db.insert(refreshTokens).values({
    userId,
    tokenHash: hashToken(refreshToken),
    familyId,
    deviceId: meta.deviceId,
    userAgent: meta.userAgent,
    ip: meta.ip,
    expiresAt: new Date(Date.now() + ttlToMs(env.REFRESH_TTL)),
  });
  return { accessToken, refreshToken, expiresIn: Math.floor(ttlToMs(env.ACCESS_TTL) / 1000) };
}

export function publicUser(u: {
  id: string;
  email: string | null;
  phone: string | null;
  username: string;
  displayName: string;
  role: string;
  avatarUrl: string | null;
  bio: string | null;
  emailVerified: boolean;
  phoneVerified: boolean;
}) {
  return {
    id: u.id,
    email: u.email,
    phone: u.phone,
    username: u.username,
    displayName: u.displayName,
    role: u.role,
    avatarUrl: u.avatarUrl,
    bio: u.bio,
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
  };
}

async function generateUniqueUsername(base: string): Promise<string> {
  const root = slugify(base).replace(/-/g, "_").slice(0, 24) || "user";
  let candidate = root.length >= 3 ? root : `user_${root}`;
  let i = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const [exists] = await db
      .select({ id: users.id })
      .from(users)
      .where(and(eq(users.username, candidate), eq(users.isDeleted, false)))
      .limit(1);
    if (!exists) return candidate;
    i += 1;
    candidate = `${root}_${i}`;
  }
}

async function findUserByEmail(email: string): Promise<User | null> {
  const [row] = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
  return row ?? null;
}

async function findUserByPhoneOrEmail(identifier: string): Promise<User | null> {
  const isEmail = identifier.includes("@");
  const [row] = isEmail
    ? await db.select().from(users).where(eq(users.email, identifier.toLowerCase())).limit(1)
    : await db.select().from(users).where(eq(users.phone, identifier)).limit(1);
  return row ?? null;
}

export const authService = {
  async register(input: {
    email: string;
    password: string;
    displayName: string;
    phone?: string;
    meta: { deviceId?: string; userAgent?: string; ip?: string };
  }) {
    const existing = await findUserByEmail(input.email);
    if (existing && !existing.isDeleted) {
      throw new AppError(ErrorCode.CONFLICT, 409, "Email already registered");
    }

    const username = await generateUniqueUsername(input.displayName || input.email.split("@")[0] || "user");
    const [user] = await db
      .insert(users)
      .values({
        email: input.email.toLowerCase(),
        phone: input.phone,
        username,
        displayName: input.displayName,
        passwordHash: await argon2.hash(input.password),
        role: "user",
      })
      .returning();
    const tokens = await issueTokens(user!.id, user!.role, newFamilyId(), input.meta);
    return { user: publicUser(user!), ...tokens };
  },

  async loginWithPassword(input: {
    email: string;
    password: string;
    meta: { deviceId?: string; userAgent?: string; ip?: string };
  }) {
    const user = await findUserByEmail(input.email);
    if (!user || !user.passwordHash) throw new AppError(ErrorCode.INVALID_CREDENTIALS, 401);
    if (user.isDeleted || user.status === "deleted") throw new AppError(ErrorCode.ACCOUNT_DELETED, 401);
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(ErrorCode.ACCOUNT_LOCKED, 423, "Account locked. Try again later.");
    }
    const valid = await argon2.verify(user.passwordHash, input.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      await db
        .update(users)
        .set({
          failedLoginAttempts: attempts,
          lockedUntil: attempts >= MAX_FAILED ? new Date(Date.now() + LOCK_MINUTES * 60_000) : null,
        })
        .where(eq(users.id, user.id));
      throw new AppError(ErrorCode.INVALID_CREDENTIALS, 401);
    }
    await db
      .update(users)
      .set({ failedLoginAttempts: 0, lockedUntil: null, lastLoginAt: new Date() })
      .where(eq(users.id, user.id));
    const tokens = await issueTokens(user.id, user.role, newFamilyId(), input.meta);
    return { user: publicUser(user), ...tokens };
  },

  async requestOtp(input: { identifier: string; channel: "sms" | "email"; purpose: "login" | "signup" | "reset" }) {
    const code = String(crypto.randomInt(0, 10 ** env.OTP_LENGTH)).padStart(env.OTP_LENGTH, "0");
    const user = await findUserByPhoneOrEmail(input.identifier);
    await db.insert(otpCodes).values({
      userId: user?.id ?? null,
      identifier: input.identifier,
      channel: input.channel,
      purpose: input.purpose,
      codeHash: hashToken(code),
      expiresAt: new Date(Date.now() + env.OTP_TTL * 1000),
    });
    if (env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.log(`[OTP] ${input.identifier} (${input.purpose}) = ${code}`);
    }
    // TODO(P1b): enqueue SMS/email via pgmq `sms_send` / `email_send`.
    return { requestId: hashToken(code).slice(0, 16), expiresInSec: env.OTP_TTL, resendAfterSec: 30 };
  },

  async verifyOtp(input: {
    identifier: string;
    code: string;
    purpose: "login" | "signup" | "reset";
    meta: { deviceId?: string; userAgent?: string; ip?: string };
  }) {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(
          eq(otpCodes.identifier, input.identifier),
          eq(otpCodes.purpose, input.purpose),
          isNull(otpCodes.consumedAt),
        ),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    if (!otp) throw new AppError(ErrorCode.OTP_INVALID, 400);
    if (otp.expiresAt < new Date()) throw new AppError(ErrorCode.OTP_INVALID, 400, "OTP expired");
    if (otp.attempts >= otp.maxAttempts) throw new AppError(ErrorCode.OTP_INVALID, 400);

    if (hashToken(input.code) !== otp.codeHash) {
      await db.update(otpCodes).set({ attempts: otp.attempts + 1 }).where(eq(otpCodes.id, otp.id));
      throw new AppError(ErrorCode.OTP_INVALID, 400);
    }
    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));

    if (input.purpose === "reset") return { resetVerified: true };

    const isEmail = input.identifier.includes("@");
    let user = await findUserByPhoneOrEmail(input.identifier);
    if (!user) {
      const localPart = input.identifier.split("@")[0] || "user";
      const username = await generateUniqueUsername(localPart);
      const [created] = await db
        .insert(users)
        .values({
          email: isEmail ? input.identifier.toLowerCase() : null,
          phone: isEmail ? null : input.identifier,
          username,
          displayName: isEmail ? localPart : "NewsWatch User",
          role: "user",
          emailVerified: isEmail,
          phoneVerified: !isEmail,
        })
        .returning();
      user = created!;
    }
    if (user.isDeleted || user.status === "deleted") throw new AppError(ErrorCode.ACCOUNT_DELETED, 401);
    const tokens = await issueTokens(user.id, user.role, newFamilyId(), input.meta);
    return { user: publicUser(user), ...tokens };
  },

  async refresh(input: { refreshToken: string; meta: { deviceId?: string; userAgent?: string; ip?: string } }) {
    const payload = verifyRefreshToken(input.refreshToken);
    const [record] = await db
      .select()
      .from(refreshTokens)
      .where(eq(refreshTokens.tokenHash, hashToken(input.refreshToken)))
      .limit(1);
    if (!record) throw new AppError(ErrorCode.TOKEN_INVALID, 401);

    if (record.revokedAt) {
      await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(and(eq(refreshTokens.familyId, record.familyId), isNull(refreshTokens.revokedAt)));
      throw new AppError(ErrorCode.TOKEN_INVALID, 401, "Refresh token reuse detected");
    }
    if (record.expiresAt < new Date()) throw new AppError(ErrorCode.TOKEN_EXPIRED, 401);

    const [user] = await db.select().from(users).where(eq(users.id, payload.sub)).limit(1);
    if (!user || user.isDeleted) throw new AppError(ErrorCode.ACCOUNT_DELETED, 401);

    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date(), rotatedAt: new Date() })
      .where(eq(refreshTokens.id, record.id));
    const tokens = await issueTokens(user.id, user.role, record.familyId, input.meta);
    return { user: publicUser(user), ...tokens };
  },

  async logout(refreshToken: string) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(and(eq(refreshTokens.tokenHash, hashToken(refreshToken)), isNull(refreshTokens.revokedAt)));
    return { loggedOut: true };
  },

  async forgotPassword(email: string) {
    await this.requestOtp({ identifier: email, channel: "email", purpose: "reset" });
    return { sent: true };
  },

  async resetPassword(input: { email: string; code: string; newPassword: string }) {
    const [otp] = await db
      .select()
      .from(otpCodes)
      .where(
        and(eq(otpCodes.identifier, input.email), eq(otpCodes.purpose, "reset"), isNull(otpCodes.consumedAt)),
      )
      .orderBy(desc(otpCodes.createdAt))
      .limit(1);
    if (!otp || otp.expiresAt < new Date() || hashToken(input.code) !== otp.codeHash) {
      throw new AppError(ErrorCode.OTP_INVALID, 400);
    }
    await db.update(otpCodes).set({ consumedAt: new Date() }).where(eq(otpCodes.id, otp.id));
    const user = await findUserByEmail(input.email);
    if (!user) throw new AppError(ErrorCode.USER_NOT_FOUND, 404);
    await db
      .update(users)
      .set({ passwordHash: await argon2.hash(input.newPassword), failedLoginAttempts: 0, lockedUntil: null })
      .where(eq(users.id, user.id));
    return { reset: true };
  },
};
