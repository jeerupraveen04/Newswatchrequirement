import { z } from "zod";
import "dotenv/config";

const EnvSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().default(4000),
  API_BASE_PATH: z.string().default("/api/v1"),
  LOG_LEVEL: z.string().default("info"),

  DATABASE_URL: z.string().min(1),
  PG_POOL_MAX: z.coerce.number().default(10),
  REDIS_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z.string().min(8),
  JWT_REFRESH_SECRET: z.string().min(8),
  ACCESS_TTL: z.string().default("15m"),
  REFRESH_TTL: z.string().default("30d"),

  R2_ACCOUNT_ID: z.string().optional().default(""),
  R2_ACCESS_KEY_ID: z.string().optional().default(""),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(""),
  R2_BUCKET: z.string().default("newswatch-media"),
  R2_ENDPOINT: z.string().optional().default(""),
  R2_PUBLIC_BASE_URL: z.string().optional().default(""),
  R2_SIGNED_URL_TTL: z.coerce.number().default(600),

  OTP_TTL: z.coerce.number().default(300),
  OTP_LENGTH: z.coerce.number().default(6),
  SMS_PROVIDER_KEY: z.string().optional().default(""),
  EMAIL_PROVIDER_KEY: z.string().optional().default(""),
  EMAIL_FROM: z.string().default("no-reply@newswatch.app"),

  GOOGLE_CLIENT_ID: z.string().optional().default(""),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(""),
  APPLE_CLIENT_ID: z.string().optional().default(""),
  APPLE_TEAM_ID: z.string().optional().default(""),
  APPLE_KEY_ID: z.string().optional().default(""),
  APPLE_PRIVATE_KEY: z.string().optional().default(""),

  FIREBASE_PROJECT_ID: z.string().optional().default(""),
  FIREBASE_CLIENT_EMAIL: z.string().optional().default(""),
  FIREBASE_PRIVATE_KEY: z.string().optional().default(""),

  SOCKET_CORS_ORIGIN: z.string().default("*"),
  SOCKET_PATH: z.string().default("/socket.io"),
  SENTRY_DSN: z.string().optional().default(""),

  // Media processing binaries (optional; workers degrade gracefully if absent).
  FFMPEG_PATH: z.string().optional().default(""),
  FFPROBE_PATH: z.string().optional().default(""),
  MEDIA_WORKER_ENABLED: z
    .string()
    .optional()
    .default("true")
    .transform((v) => v === "true"),
});

export type Env = z.infer<typeof EnvSchema>;

function loadEnv(): Env {
  const parsed = EnvSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error("Invalid environment configuration:", parsed.error.flatten().fieldErrors);
    process.exit(1);
  }
  return parsed.data;
}

export const env = loadEnv();
export const isProd = env.NODE_ENV === "production";
export const isTest = env.NODE_ENV === "test";
