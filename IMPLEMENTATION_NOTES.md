# NewsWatch — Implementation Notes

Tracks decisions and progress while building from the spec in `docs/`.
Phases mirror the `IMPLEMENTATION_PROMPT.md` build order.

## Status

| Phase | Status | Notes |
|---|---|---|
| **P0** Foundation | ✅ Done | Monorepo, **Drizzle schema (types only)**, **dbmate migrations**, seed, docker-compose (PGMQ image) |
| **P1** Backend | ✅ Core done | Auth, articles, regions, media, admin, danger zone, app-settings, audit, **pgmq queue** |
| **P1b** Workers + Realtime | ✅ Done | pgmq consumer loops (media probe/transcode/poster/delete, notifications, email/SMS, scheduled publish) + **Socket.IO** gateway with Redis adapter |
| **P2** Web (Next.js) | ✅ Done | Reader, reporter console (R01–R05), admin/super-admin console (A01–A10), auth cookies, authenticated proxy |
| **P3** Mobile (Expo) | ⬜ Not started | |
| **P4** Hardening | ⬜ Not started | |

> **Data layer (changed from Prisma):** schema + types are defined with
> **Drizzle ORM** (`apps/api/src/db/schema.ts`); **migrations are owned by
> dbmate** (`apps/api/db/migrations/*.sql`); background jobs use **pgmq**
> (PostgreSQL message-queue extension) instead of BullMQ/Redis.

## Layout

```
apps/api          Express + Drizzle + dbmate + pgmq backend + Socket.IO (working)
apps/web          Next.js (pending)
apps/mobile       Expo (pending)
packages/shared   Types, Zod schemas, error codes, cursor helpers
packages/tokens   Design tokens (docs/design-system/00-tokens.md)
packages/config   Shared tsconfig/eslint/prettier
infra/            docker-compose (Postgres, Redis, MinIO)
```

## What is implemented and verified (P0 + P1)

**Database** (`apps/api/src/db/schema.ts` + `apps/api/db/migrations/*.sql`)
- All tables/enums from `docs/architecture/05-database.md`: users, roles,
  permissions, refresh_tokens, otp_codes, reporter_profiles, regions,
  admin/reporter_region_scopes, articles, article_images, article_status_history,
  categories, tags, comments, reactions, bookmarks, follows, notifications,
  devices, media_assets, article_posters, analytics_events, app_settings,
  audit_logs.
- Postgres extras: pgcrypto/citext/pg_trgm, `updated_at` trigger, partial unique
  indexes on users, generated `articles.search_vector` + GIN, partial indexes,
  type-aware `media_assets` size CHECK + duration CHECK.
- Idempotent seed: roles+permissions, region tree (Telangana → Hyderabad →
  Secunderabad → mandals), 7 categories, static pages, and one user per role.

**API** (`apps/api/src`) — all typechecked and smoke-tested:
- Middleware chain: requestContext, helmet, cors, json, compression, rateLimit,
  auth (resolves role + region scopes), optionalAuth, rbac, superAdminGuard,
  approved-reporter guard, validate (Zod), errorHandler, notFound.
- Auth: register, login (email+password with lockout), OTP request/verify,
  refresh with rotation + reuse detection, logout, forgot/reset, `/auth/me`.
- Articles: feed (cursor), breaking, search (tsvector), detail, reporter
  create/submit (region-scoped + sanitized rich text), admin moderate
  (publish/reject/unpublish, region-scoped, audited).
- Taxonomy: categories, regions + children.
- Engagement: comments (depth ≤2, counters in tx), likes (reactions),
  bookmarks, follows, notifications.
- Users: `/users/me` get/patch, public profile, device registration.
- Media: `/media/sign` (kind/size validation), `/media/:id/complete`,
  `/media/:id`, `/media/:id` delete; R2 (S3) client + presign.
- Admin: region CRUD (super only), moderation queue (region-scoped),
  danger zone (soft delete/restore/purge user, hard delete article),
  app-settings (super write), audit log.
- Public: `/app-settings`, `/health`, `/health/ready`.

**Verified behaviors**
- Full content pipeline: reporter draft → submit → reporter self-publish blocked
  (403) → region-scoped admin publish → feed/detail/search.
- Cross-scope denial: admin scoped to Hyderabad cannot approve an article filed
  at Telangana state (403 OUT_OF_SCOPE).
- Refresh rotation works; reused refresh token is rejected (401).
- Soft-deleted user cannot authenticate; restore works.
- Region delete blocked when children/articles exist.
- Oversized video rejected at sign (413 VIDEO_TOO_LARGE).
- Standard envelope + Zod validation errors (422) everywhere.

## P2 — Next.js web (implemented & verified)

`apps/web` — App Router, RSC-first, builds cleanly (33 routes):

**Reader (public):** P07 Home feed (SSR, ISR 30s), P08 `/listing`, P09
`/news/[slug]` (SSR + OG metadata, rich text + inline video hero), P10
`/categories`, P11 `/category/[slug]`, P12/P13 `/search`, P15 `/bookmarks`
(client, auth), P16 comments (realtime-ready), P17 `/notifications`, P18/P20
`/profile` + `/settings`, P21 `/about/[page]`, P03–P06 `/login`, `/signup`,
`/forgot-password`.

**Reporter (auth + role):** `/reporter/dashboard` (R01), `/reporter/articles`
(R03, status filters), `/reporter/compose` (R02: rich-text toolbar, headline +
description colour/size with live preview, region cascade, categories, tags,
media upload via signed R2), `/reporter/apply` (R04).

**Admin / Super Admin (auth + role):** `/admin/login` (A01), `/admin` (A02),
`/admin/articles` (A03 moderation with reject-reason modal), `/admin/categories`
(A04), `/admin/users` (A05 soft delete), `/admin/reporters` (A06 approve +
assign region scope), `/admin/analytics` (A07), plus super-admin-only
`/admin/regions` (A08), `/admin/app-settings` (A09), `/admin/danger-zone` (A10:
restore/purge users, hard-delete articles, audit log).

**Auth:** httpOnly cookies (`nw_access`, `nw_refresh`) set by
`/api/auth/login`; `/api/auth/session`, `/api/auth/logout`; `middleware.ts`
guards `/reporter`, `/admin`, `/bookmarks`, `/notifications`, `/profile`,
`/settings`. Client mutations go through the authenticated same-origin proxy
`/api/proxy/[...path]`.

**Verified:** `next build` passes; home SSR renders live API data; login +
session cookies work; super-admin `/admin` renders the full sidebar; the proxy
authenticates; unauthenticated `/admin` → 307 `/admin/login`.

## P1b — Workers + Realtime (implemented & verified)

**pgmq consumers** (`src/jobs/worker.ts`, run with `pnpm --filter @newswatch/api worker`):
- `media_probe` → ffprobe (duration/dimensions/codec)
- `media_transcode` → progressive H.264/AAC MP4 (image assets short-circuit to ready)
- `media_poster` → extract JPEG poster, store as an image `media_assets` row, link `poster_media_id`
- `media_delete` → delete originals/renditions/poster objects from R2
- `notification_push` → resolve devices, emit Socket.IO, FCM hook (no-op until creds)
- `email_send`, `sms_send` → provider adapter stubs (log when unconfigured)
- `article_scheduled_publish` → publish due `scheduled_at` articles

Retry/dead-letter: messages retry via pgmq visibility timeout up to `maxAttempts`
(default 5), then are dead-lettered (`runWorker`), preventing poison-message loops.

**Socket.IO** (`src/realtime/io.ts`, initialised in `server.ts`):
- Handshake verifies the JWT (guests allowed for public rooms)
- Redis adapter for multi-instance fan-out
- Rooms `article:<id>` and `user:<id>`; events `comment:new`, `comment:updated`,
  `comment:deleted`, `reaction:update`, `comment:count`, `notification:new`,
  `article:status`. Comments emit `comment:new` on create.

**Media processing** (`src/media/`):
- `ffmpeg.ts` wraps ffmpeg/ffprobe (`FFMPEG_PATH`/`FFPROBE_PATH`); when a binary is
  absent it degrades gracefully so the pipeline still reaches `ready`
- `media.service.complete` enqueues `media_probe` (video) or `media_transcode`
  (image) instead of marking ready synchronously

**Verified**: image pipeline sign→upload→complete→worker→`ready`; video pipeline
probe→transcode→poster→`ready` (ffmpeg-absent fallback exercised); all 8 worker
loops start; notification worker resolves devices without crashing; Socket.IO
`comment:new` broadcast received by a live client; queues drain to 0.

> **ffmpeg note:** ffmpeg/ffprobe are not installed in this environment and cannot
> be installed without sudo. The workers are written to use them when present
> (`FFMPEG_PATH`/`FFPROBE_PATH`); install with `apt-get install ffmpeg` (or point
> at a binary) to enable real transcoding. Until then video uses the original as
> the canonical source.

## Decisions (ambiguous points resolved)

1. **Region scoping uses recursive descendant expansion** — an actor assigned
   to a region may act on it and all descendants (`regionRepo.expandScope`).
   `super_admin` gets `["*"]`, bypassing checks.
2. **Audit `target_id` is UUID-only** — app-settings changes audit with
   `target_id = null` and the key in `meta`, since settings keys are strings.
3. **OTP in dev prints the code to the server log** rather than requiring an SMS
   provider; provider adapters are TODO in a worker.
4. **Media processing is asynchronous** — `complete` enqueues the pgmq pipeline
   (`media_probe`/`media_transcode`/`media_poster`); the asset reaches `ready`
   only after the workers finish (see P1b).
5. **Admin scope seed** = Hyderabad district; **reporter scope seed** = Telangana
   state — chosen to demonstrate scope-or-descendant enforcement.

## Not yet implemented (tracked)

- OAuth (Google/Apple) token exchange.
- Real FCM push send (hook present; needs Firebase credentials).
- Real email/SMS provider send (adapters stubbed).
- Image blurhash + responsive variants (currently pass-through; ffmpeg/`sharp` pending).
- `/api/v1` endpoints not yet mounted: follows list, settings,
  analytics ingestion, health of individual services.
- Web (`apps/web`) and mobile (`apps/mobile`) applications (P2/P3).

## How to run (local)

```bash
# 1. install
corepack enable && pnpm install

# 2. infra (uses mapped ports 55432/56379 to avoid host conflicts)
docker compose -f infra/docker-compose.yml up -d postgres redis

# 3. env + db
cp apps/api/.env.example apps/api/.env
pnpm --filter @newswatch/api db:up           # dbmate up (applies all migrations)
pnpm --filter @newswatch/api db:seed         # Drizzle seed (idempotent)

# 4. run API
pnpm --filter @newswatch/api dev             # http://localhost:4010/api/v1

# 5. smoke tests
node apps/api/scripts/smoke-auth.mjs
node apps/api/scripts/smoke-content.mjs
node apps/api/scripts/smoke-admin.mjs
```

Seed logins (password `Password123!`):
`super@newswatch.app`, `admin@newswatch.app`, `reporter@newswatch.app`,
`user@newswatch.app`.

> Note: local Postgres/Redis run on host ports **55432** and **56379** to avoid
> clashing with other services on this machine; see `infra/docker-compose.yml`.
