# NewsWatch — Implementation Notes

Tracks decisions and progress while building from the spec in `docs/`.
Phases mirror the `IMPLEMENTATION_PROMPT.md` build order.

## Status

| Phase | Status | Notes |
|---|---|---|
| **P0** Foundation | ✅ Done | Monorepo, **Drizzle schema (types only)**, **dbmate migrations**, seed, docker-compose (PGMQ image) |
| **P1** Backend | ✅ Core done | Auth, articles, regions, media, admin, danger zone, app-settings, audit, **pgmq queue** |
| **P1b** Workers + Realtime | ✅ Done | pgmq consumer loops (media probe/transcode/poster/delete, notifications, email/SMS, scheduled publish) + **Socket.IO** gateway (in-memory adapter) |
| **P2** Web (Next.js) | ✅ Done | Reader, comments, reporter console (R01–R05), admin/super-admin console (A01–A10), poster editor, auth cookies, authenticated proxy |
| **P3** Mobile (Expo) | ✅ Done | Auth, home feed, article, categories, search, bookmarks, notifications, profile, settings; typechecks |
| **P4** Hardening | 🟡 Partial | Vitest unit+API tests (20), CI workflow, `/metrics`; lint/Sentry/e2e pending |

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
infra/            docker-compose (Postgres, MinIO)
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
- In-memory adapter (single instance; no Redis)
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

## P3 — Expo mobile (implemented & typechecks)

`apps/mobile` — Expo (managed) + React Navigation (tabs + stack) + React Query +
Zustand + expo-secure-store.

**Coverage (rebuilt end-to-end after an audit found only 10 shallow screens for
27 mobile pages):**

| Area | Pages implemented |
|---|---|
| Auth | P01 Splash, P02 Onboarding, P03 Login, P04 Signup, P05 OTP, P06 Forgot/Reset |
| Reader | P07 Home feed (category chips), P08 News Listing (scroll-snap), P09 Article (action bar + tags), P10 Categories, P11 Category Listing, P12/P13 Search, P15 Bookmarks, P16 Comments, P17 Notifications, P18 Profile, P19 Edit Profile, P20 Settings, P21 About |
| Reporter | R01 Dashboard, R02 Article Composer (create/edit), R03 My Articles, R04 Application, R05 Share Poster |
| Shell | S02 bottom tabs (Home, Categories, Search, Bookmarks, Profile) + stack |

- **Navigation:** typed `navigation.navigate(...)` everywhere (no `<Link>`), all
  routes registered in `RootNavigator.tsx`, lowercase deep-link paths in
  `linking.ts`.
- **Auth:** `expo-secure-store` tokens, refresh-on-hydrate, OTP + forgot/reset
  flows, reporter-status aware.
- **Lib:** `api.ts` supports query params + full envelope (`apiPage`) for cursor
  meta; `queries.ts` covers feed/articles/categories/comments/bookmarks/notifs/
  reporter CRUD/like/bookmark with React Query invalidation.
- Fixed during audit: `expo-constants` dep, RN vs expo-image `contentFit`, App.tsx
  paths (`./src/...`), navigation param typing, shared `Buffer`.
- **Navigation bug fixed:** screens used `<Link to="/Login">` (capitalised) while
  the linking config mapped lowercase `login`/`signup`, so tapping Login/Signup
  produced an unparseable path and exited the app. All in-app navigation now uses
  typed `navigation.navigate(...)`.
- **Form components:** `components/form.tsx` (`TextField`, `PasswordField` with
  show/hide, `PrimaryButton`, `FormError`).

### Backend additions for the reporter flow

`apps/api` gained endpoints the composer needed (all under `/api/v1/reporter`):

| Method | Path | Purpose |
|---|---|---|
| POST | `/reporter/articles` | create draft (approved reporters) |
| GET | `/reporter/articles/:id` | full article (any status) for edit |
| PATCH | `/reporter/articles/:id` | update draft/rejected |
| DELETE | `/reporter/articles/:id` | soft-delete own draft/rejected |
| POST | `/reporter/articles/:id/submit` | submit for review |
| GET | `/reporter/stats` | dashboard aggregates |
| GET | `/reporter/counts` | per-status counts for R03 pills |

`POST /reporter/apply` is now open to **any authenticated user** (previously the
router-level `requireRole` blocked normal users, so R04 was unreachable). The
remaining reporter routes keep `requireRole("reporter","admin","super_admin")`.
`GET /bookmarks` now hydrates article rows (title/slug/summary) instead of IDs.

## P5 — End-to-end verification audit (API + Web + Mobile)

A full audit read every route, page, and screen (not just filenames) and found
real defects, not only "thin" coverage. Fixed since:

**API correctness bugs**
- Comment list crashed with `malformed array literal` — `= ANY(${array}::uuid[])`
  does not serialize with postgres.js. Replaced with Drizzle `inArray` (replies
  and authors). This path had never been exercised by tests.
- Deleting a **reply** decremented the article `comment_count` (only top-level
  comments should count) — fixed.
- **Unfollowing** a category never decremented `followerCount` — fixed.
- Feed `categoryId` filter was applied **after `LIMIT`**, producing wrong pages
  and `hasMore`. Moved into SQL (`EXISTS` subquery).
- Notification producers were missing: added `reporter_article_status` on
  moderation and `comment_reply` on replies (`notificationService.create`).
- Added `GET /config` (feature flags + `minAppVersion` from public settings) and
  `POST /analytics/events` (analytics ingestion into `analytics_events`).

**Web defects**
- **Signup was broken** — posted to `/api/auth/register`, which has no handler;
  now posts to `/api/auth/session`.
- Reporter dashboard read the **public feed** and showed global data; now uses
  `/reporter/stats` + `/reporter/articles` (own data) via the proxy.
- Admin dashboard (A02) was a pure placeholder (em-dash KPIs); now fetches
  `/admin/analytics/summary` + `/admin/moderation/queue` for real KPIs.
- The authenticated proxy never refreshed the 15-min access token; added a
  single-flight refresh-and-retry on 401 (rotating tokens, re-reading the body).

**Mobile**
- Article composer had **no media upload at all**; added `expo-image-picker` and
  `lib/media.ts` implementing sign → PUT → complete, with a hero-image picker
  wired into the composer and `media` persisted via PATCH.
- Notifications were non-interactive: added mark-read / mark-all-read, deep-link
  handling, and unread styling.
- Comments gained like (`POST /like` with `targetType: comment`).

**Verified:** `pnpm -r typecheck` (all 6 packages), API tests 20/20,
`expo export:embed` bundles 823 modules, and live smoke tests of
`/config`, `/analytics/events`, category-filtered feed, and the
comment create/list/reply/delete flow.

### Known remaining gaps (documented, not yet built)

- **Async side-channels are stubs**: OTP delivery, email, SMS, and FCM push log
  instead of calling providers; `analytics_ingest`, `poster_render`,
  `media_delete`, and `article_scheduled_publish` have no producers/workers.
- **No scheduled-publish / breaking-flag endpoints** (no route sets
  `scheduledAt` / `isBreaking`).
- **In-memory cache, rate-limit, and Socket.IO** are single-instance.
- **Mobile/Web missing pages**: P13 Search Results (merged), S01 system states
  (maintenance/offline/404/error), P19 has no dedicated web route, P01/P02/P05
  absent on web.
- **OAuth** (Google/Apple) is not implemented in API or clients.
- **No tests** for reporter/admin/media/jobs; web has no tests or ESLint config.

## P4 — Hardening (partial)

- **Tests:** Vitest in `apps/api` — 20 tests (unit: slugify/wordCount/sanitize;
  integration: envelope, 404, auth, RBAC, validation, catalogue). Run:
  `pnpm --filter @newswatch/api test`. A routing bug (catch-all `/:username`
  swallowing unknown routes) was found and fixed by these tests.
- **CI:** `.github/workflows/ci.yml` — spins up PGMQ Postgres, runs
  dbmate migrations (proving fresh-DB forward compatibility), seed, recursive
  typecheck, API tests, API build, web build.
- **Observability:** `GET /api/v1/metrics` reports db/cache health, ffmpeg
  availability, memory, and pgmq queue depths per queue; `/health` (liveness) and
  `/ready` (db+cache) per REQ-SYS-413.
- **No external cache:** Redis was removed; rate limits and readiness use a
  process-local in-memory store (`src/config/cache.ts`). Jobs already used PGMQ.
  Single-instance only (REQ-SYS-346 fail-soft).
- **Still pending:** ESLint pass, Sentry wiring, Playwright/Detox e2e, load tests.

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

# 2. infra (uses mapped port 55432 to avoid host conflicts)
docker compose -f infra/docker-compose.yml up -d postgres

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

> Note: local Postgres runs on host port **55432** to avoid clashing with other
> services on this machine; see `infra/docker-compose.yml`.
