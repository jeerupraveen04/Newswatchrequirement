export const API_BASE_PATH = "/api/v1";

export const LIMITS = {
  imageMaxBytes: 10 * 1024 * 1024,
  videoMaxBytes: 200 * 1024 * 1024,
  videoMaxSeconds: 180,
  galleryMaxItems: 10,
  titleMin: 5,
  titleMax: 140,
  summaryMax: 300,
  bodyMinWords: 200,
  tagsMax: 10,
  commentMin: 1,
  commentMax: 1000,
  otpTtlSeconds: 300,
  otpLength: 6,
  accessTtl: "15m",
  refreshTtl: "30d",
  defaultPageLimit: 20,
  maxPageLimit: 50,
} as const;

export const IMAGE_MIME = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_MIME = ["video/mp4", "video/webm", "video/quicktime"] as const;
