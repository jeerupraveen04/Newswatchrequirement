/** Domain enums shared across API, web, and mobile. */

export const UserRole = {
  user: "user",
  reporter: "reporter",
  admin: "admin",
  super_admin: "super_admin",
} as const;
export type UserRole = (typeof UserRole)[keyof typeof UserRole];

export const RegionType = {
  state: "state",
  district: "district",
  constituency: "constituency",
  mandal: "mandal",
} as const;
export type RegionType = (typeof RegionType)[keyof typeof RegionType];

export const ArticleStatus = {
  draft: "draft",
  pending: "pending",
  published: "published",
  rejected: "rejected",
  unpublished: "unpublished",
  deleted: "deleted",
} as const;
export type ArticleStatus = (typeof ArticleStatus)[keyof typeof ArticleStatus];

export const MediaKind = {
  image: "image",
  video: "video",
} as const;
export type MediaKind = (typeof MediaKind)[keyof typeof MediaKind];

export const MediaProcessingStatus = {
  pending: "pending",
  processing: "processing",
  ready: "ready",
  failed: "failed",
} as const;
export type MediaProcessingStatus =
  (typeof MediaProcessingStatus)[keyof typeof MediaProcessingStatus];

export const PosterTemplate = {
  classic: "classic",
  breaking: "breaking",
  minimal: "minimal",
  gradient: "gradient",
  photo_hero: "photo_hero",
} as const;
export type PosterTemplate = (typeof PosterTemplate)[keyof typeof PosterTemplate];

export const ReporterStatus = {
  pending: "pending",
  approved: "approved",
  rejected: "rejected",
  revoked: "revoked",
} as const;
export type ReporterStatus = (typeof ReporterStatus)[keyof typeof ReporterStatus];
