/**
 * NewsWatch database schema — Drizzle ORM.
 *
 * SCHEMA + TYPES ONLY. Migrations are managed exclusively by dbmate
 * (see `apps/api/db/migrations`). Do NOT run drizzle-kit generate/push.
 *
 * Table/column names mirror the dbmate migrations exactly
 * (docs/architecture/05-database.md).
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  boolean,
  integer,
  bigint,
  smallint,
  numeric,
  timestamp,
  jsonb,
  primaryKey,
  index,
  uniqueIndex,
  customType,
} from "drizzle-orm/pg-core";

/** citext is created by dbmate; treat as text at the type level. */
const citext = customType<{ data: string; driverData: string }>({
  dataType() {
    return "citext";
  },
});


// ---------------------------------- Enums ----------------------------------

export const userRole = pgEnum("UserRole", ["user", "reporter", "admin", "super_admin"]);
export const userStatus = pgEnum("UserStatus", ["active", "suspended", "deleted"]);
export const reporterStatus = pgEnum("ReporterStatus", ["pending", "approved", "rejected", "revoked"]);
export const articleStatus = pgEnum("ArticleStatus", [
  "draft",
  "pending",
  "published",
  "rejected",
  "unpublished",
  "deleted",
]);
export const regionType = pgEnum("RegionType", ["state", "district", "constituency", "mandal"]);
export const mediaStatus = pgEnum("MediaStatus", ["pending", "processing", "ready", "failed"]);
export const mediaKind = pgEnum("MediaKind", ["image", "video"]);
export const mediaProcessingStatus = pgEnum("MediaProcessingStatus", [
  "pending",
  "processing",
  "ready",
  "failed",
]);
export const mediaPurpose = pgEnum("MediaPurpose", [
  "avatar",
  "article",
  "hero",
  "gallery",
  "poster",
  "video",
]);
export const notificationType = pgEnum("NotificationType", [
  "new_article",
  "breaking",
  "comment_reply",
  "comment_like",
  "reporter_article_status",
]);
export const otpPurpose = pgEnum("OtpPurpose", ["login", "signup", "reset"]);
export const otpChannel = pgEnum("OtpChannel", ["sms", "email"]);
export const reactionType = pgEnum("ReactionType", ["like"]);
export const followTarget = pgEnum("FollowTarget", ["reporter", "category"]);
export const bodyFormat = pgEnum("BodyFormat", ["rich", "markdown"]);
export const posterTemplate = pgEnum("PosterTemplate", [
  "classic",
  "breaking",
  "minimal",
  "gradient",
  "photo_hero",
]);

// ---------------------------------- Tables ---------------------------------

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: citext("email"),
    phone: text("phone"),
    username: text("username").notNull(),
    displayName: text("display_name").notNull(),
    passwordHash: text("password_hash"),
    role: userRole("role").default("user").notNull(),
    status: userStatus("status").default("active").notNull(),
    emailVerified: boolean("email_verified").default(false).notNull(),
    phoneVerified: boolean("phone_verified").default(false).notNull(),
    avatarUrl: text("avatar_url"),
    bio: text("bio"),
    failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
    lockedUntil: timestamp("locked_until", { withTimezone: true }),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    deletedBy: uuid("deleted_by"),
    restoredAt: timestamp("restored_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    roleIdx: index("ix_users_role").on(t.role),
  }),
);

export const roles = pgTable("roles", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const permissions = pgTable("permissions", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  description: text("description"),
});

export const rolePermissions = pgTable(
  "role_permissions",
  {
    roleId: uuid("role_id").notNull(),
    permissionId: uuid("permission_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.roleId, t.permissionId] }),
    permIdx: index("ix_role_permissions_permission_id").on(t.permissionId),
  }),
);

export const refreshTokens = pgTable(
  "refresh_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    tokenHash: text("token_hash").notNull().unique(),
    familyId: uuid("family_id").notNull(),
    deviceId: text("device_id"),
    userAgent: text("user_agent"),
    ip: text("ip"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    rotatedAt: timestamp("rotated_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    familyIdx: index("ix_refresh_tokens_family_id").on(t.familyId),
    expiresIdx: index("ix_refresh_tokens_expires_at").on(t.expiresAt),
  }),
);

export const otpCodes = pgTable(
  "otp_codes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    identifier: text("identifier").notNull(),
    channel: otpChannel("channel").notNull(),
    purpose: otpPurpose("purpose").notNull(),
    codeHash: text("code_hash").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    maxAttempts: integer("max_attempts").default(5).notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    identifierIdx: index("ix_otp_codes_identifier_purpose").on(t.identifier, t.purpose),
    expiresIdx: index("ix_otp_codes_expires_at").on(t.expiresAt),
  }),
);

export const reporterProfiles = pgTable(
  "reporter_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull().unique(),
    status: reporterStatus("status").default("pending").notNull(),
    fullName: text("full_name").notNull(),
    bio: text("bio").notNull(),
    beats: text("beats").array().notNull().default([]),
    portfolioUrl: text("portfolio_url"),
    sampleArticleUrl: text("sample_article_url"),
    phone: text("phone").notNull(),
    reviewedBy: uuid("reviewed_by"),
    reviewerNote: text("reviewer_note"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    statusIdx: index("ix_reporter_profiles_status").on(t.status),
  }),
);

export const regions = pgTable(
  "regions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    type: regionType("type").notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    parentId: uuid("parent_id"),
    sortOrder: integer("sort_order").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    parentIdx: index("ix_regions_parent_id").on(t.parentId),
    typeIdx: index("ix_regions_type").on(t.type),
  }),
);

export const adminRegionScopes = pgTable(
  "admin_region_scopes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    regionId: uuid("region_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserRegion: uniqueIndex("admin_region_scopes_user_id_region_id_key").on(t.userId, t.regionId),
  }),
);

export const reporterRegionScopes = pgTable(
  "reporter_region_scopes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    regionId: uuid("region_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserRegion: uniqueIndex("reporter_region_scopes_user_id_region_id_key").on(t.userId, t.regionId),
  }),
);

export const articles = pgTable(
  "articles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    body: text("body").notNull(),
    bodyFormat: bodyFormat("body_format").default("rich").notNull(),
    headlineStyle: jsonb("headline_style"),
    descriptionStyle: jsonb("description_style"),
    poster: jsonb("poster"),
    reporterId: uuid("reporter_id").notNull(),
    heroImageId: uuid("hero_image_id"),
    regionId: uuid("region_id").notNull(),
    status: articleStatus("status").default("draft").notNull(),
    isDeleted: boolean("is_deleted").default(false).notNull(),
    isBreaking: boolean("is_breaking").default(false).notNull(),
    viewCount: integer("view_count").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    commentCount: integer("comment_count").default(0).notNull(),
    bookmarkCount: integer("bookmark_count").default(0).notNull(),
    readingMinutes: integer("reading_minutes").default(1).notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    reviewNote: text("review_note"),
    reviewedBy: uuid("reviewed_by"),
    // `search_vector` is a DB-generated tsvector column (see db/migrations
    // 0002_extras.sql). It is intentionally omitted here so Drizzle never
    // attempts to INSERT/UPDATE it; search queries use raw SQL.
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    reporterStatusIdx: index("ix_articles_reporter_id_status").on(t.reporterId, t.status),
    regionIdx: index("ix_articles_region_id_published_at").on(t.regionId),
  }),
);

export const articleImages = pgTable(
  "article_images",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    kind: mediaKind("kind").default("image").notNull(),
    position: integer("position").default(0).notNull(),
    alt: text("alt"),
    isHero: boolean("is_hero").default(false).notNull(),
  },
  (t) => ({
    articleIdx: index("ix_article_images_article_id_position").on(t.articleId, t.position),
    mediaIdx: index("ix_article_images_media_asset_id").on(t.mediaAssetId),
  }),
);

export const articleStatusHistory = pgTable(
  "article_status_history",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id").notNull(),
    fromStatus: articleStatus("from_status"),
    toStatus: articleStatus("to_status").notNull(),
    changedBy: uuid("changed_by"),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    articleIdx: index("ix_article_status_history_article_id_created_at").on(t.articleId, t.createdAt),
  }),
);

export const categories = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull().unique(),
    slug: text("slug").notNull().unique(),
    description: text("description"),
    colorToken: text("color_token"),
    sortOrder: integer("sort_order").default(0).notNull(),
    followerCount: integer("follower_count").default(0).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    orderIdx: index("ix_categories_sort_order").on(t.sortOrder),
  }),
);

export const articleCategories = pgTable(
  "article_categories",
  {
    articleId: uuid("article_id").notNull(),
    categoryId: uuid("category_id").notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.categoryId] }),
    categoryIdx: index("ix_article_categories_category_id_article_id").on(t.categoryId, t.articleId),
  }),
);

export const tags = pgTable("tags", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull().unique(),
  slug: text("slug").notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const articleTags = pgTable(
  "article_tags",
  {
    articleId: uuid("article_id").notNull(),
    tagId: uuid("tag_id").notNull(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.articleId, t.tagId] }),
    tagIdx: index("ix_article_tags_tag_id_article_id").on(t.tagId, t.articleId),
  }),
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id").notNull(),
    authorId: uuid("author_id").notNull(),
    parentId: uuid("parent_id"),
    body: text("body").notNull(),
    depth: integer("depth").default(0).notNull(),
    likeCount: integer("like_count").default(0).notNull(),
    replyCount: integer("reply_count").default(0).notNull(),
    isHidden: boolean("is_hidden").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    articleIdx: index("ix_comments_article_id_created_at").on(t.articleId, t.createdAt),
    parentIdx: index("ix_comments_parent_id_created_at").on(t.parentId, t.createdAt),
    authorIdx: index("ix_comments_author_id").on(t.authorId),
  }),
);

export const reactions = pgTable(
  "reactions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    type: reactionType("type").default("like").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueReaction: uniqueIndex("reactions_user_id_target_type_target_id_type_key").on(
      t.userId,
      t.targetType,
      t.targetId,
      t.type,
    ),
    targetIdx: index("ix_reactions_target_type_target_id").on(t.targetType, t.targetId),
  }),
);

export const bookmarks = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    articleId: uuid("article_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueBookmark: uniqueIndex("bookmarks_user_id_article_id_key").on(t.userId, t.articleId),
    userIdx: index("ix_bookmarks_user_id_created_at").on(t.userId, t.createdAt),
  }),
);

export const follows = pgTable(
  "follows",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    targetType: followTarget("target_type").notNull(),
    targetId: uuid("target_id").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueFollow: uniqueIndex("follows_user_id_target_type_target_id_key").on(
      t.userId,
      t.targetType,
      t.targetId,
    ),
    targetIdx: index("ix_follows_target_type_target_id").on(t.targetType, t.targetId),
  }),
);

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    type: notificationType("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    entityType: text("entity_type"),
    entityId: uuid("entity_id"),
    deepLink: text("deep_link"),
    read: boolean("read").default(false).notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
    data: jsonb("data").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    userIdx: index("ix_notifications_user_id_created_at").on(t.userId, t.createdAt),
  }),
);

export const devices = pgTable(
  "devices",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id").notNull(),
    deviceId: text("device_id").notNull(),
    pushToken: text("push_token").unique(),
    platform: text("platform").notNull(),
    appVersion: text("app_version"),
    pushEnabled: boolean("push_enabled").default(true).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uniqueUserDevice: uniqueIndex("devices_user_id_device_id_key").on(t.userId, t.deviceId),
    tokenIdx: index("ix_devices_push_token").on(t.pushToken),
  }),
);

export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id").notNull(),
    purpose: mediaPurpose("purpose").notNull(),
    kind: mediaKind("kind").default("image").notNull(),
    status: mediaStatus("status").default("pending").notNull(),
    processingStatus: mediaProcessingStatus("processing_status").default("pending").notNull(),
    processingError: text("processing_error"),
    storageKey: text("storage_key").notNull(),
    url: text("url"),
    mimeType: text("mime_type").notNull(),
    codec: text("codec"),
    sizeBytes: bigint("size_bytes", { mode: "number" }).notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSeconds: numeric("duration_seconds", { precision: 10, scale: 3 }),
    posterMediaId: uuid("poster_media_id"),
    blurhash: text("blurhash"),
    variants: jsonb("variants").default({}).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
  },
  (t) => ({
    ownerIdx: index("ix_media_assets_owner_id_created_at").on(t.ownerId, t.createdAt),
    statusIdx: index("ix_media_assets_status").on(t.status),
    kindIdx: index("ix_media_assets_kind").on(t.kind),
    posterIdx: index("ix_media_assets_poster_media_id").on(t.posterMediaId),
  }),
);

export const articlePosters = pgTable(
  "article_posters",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    articleId: uuid("article_id").notNull(),
    mediaAssetId: uuid("media_asset_id").notNull(),
    template: posterTemplate("template").notNull(),
    width: integer("width"),
    height: integer("height"),
    createdBy: uuid("created_by"),
    isDefault: boolean("is_default").default(false).notNull(),
    overrides: jsonb("overrides"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    articleIdx: index("ix_article_posters_article_id").on(t.articleId),
  }),
);

export const analyticsEvents = pgTable(
  "analytics_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id"),
    eventName: text("event_name").notNull(),
    clientEventId: text("client_event_id"),
    articleId: uuid("article_id"),
    props: jsonb("props").default({}).notNull(),
    platform: text("platform"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    nameTimeIdx: index("ix_analytics_events_event_name_occurred_at").on(t.eventName, t.occurredAt),
    articleIdx: index("ix_analytics_events_article_id_occurred_at").on(t.articleId, t.occurredAt),
  }),
);

export const appSettings = pgTable("app_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  isPublic: boolean("is_public").default(false).notNull(),
  updatedBy: uuid("updated_by"),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id"),
    action: text("action").notNull(),
    targetType: text("target_type").notNull(),
    targetId: uuid("target_id"),
    meta: jsonb("meta").default({}).notNull(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    actorIdx: index("ix_audit_logs_actor_id_created_at").on(t.actorId, t.createdAt),
    targetIdx: index("ix_audit_logs_target_type_target_id").on(t.targetType, t.targetId),
  }),
);

// ----------------------------- Inferred types ------------------------------

export type UserRole = (typeof userRole.enumValues)[number];
export type ArticleStatusType = (typeof articleStatus.enumValues)[number];
export type RegionTypeValue = (typeof regionType.enumValues)[number];
export type MediaKindValue = (typeof mediaKind.enumValues)[number];

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Article = typeof articles.$inferSelect;
export type NewArticle = typeof articles.$inferInsert;
export type Region = typeof regions.$inferSelect;
export type NewRegion = typeof regions.$inferInsert;
export type Comment = typeof comments.$inferSelect;
export type MediaAsset = typeof mediaAssets.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type AppSetting = typeof appSettings.$inferSelect;
export type RefreshToken = typeof refreshTokens.$inferSelect;
export type Device = typeof devices.$inferSelect;
