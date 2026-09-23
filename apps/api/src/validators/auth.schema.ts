import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(2).max(60),
  phone: z.string().min(6).max(20).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const otpRequestSchema = z.object({
  identifier: z.string().min(3),
  channel: z.enum(["sms", "email"]),
  purpose: z.enum(["login", "signup", "reset"]).default("login"),
});

export const otpVerifySchema = z.object({
  identifier: z.string().min(3),
  code: z.string().length(6),
  purpose: z.enum(["login", "signup", "reset"]).default("login"),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(10),
});

export const forgotSchema = z.object({
  email: z.string().email(),
});

export const resetSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z.string().min(8).max(128),
});
