# LLM Implementation Prompt — NewsWatch

Copy everything inside the box below and give it to an LLM/agent along with this
repository.

---

```
You are a senior full-stack engineer. Build the NewsWatch platform from the
documentation in THIS repository. Do not invent features or change requirements.
This repo is the single source of truth.

## Step 0 — Read before writing any code
Read, in this order:
1. README.md
2. docs/00-overview.md
3. docs/01-page-index.md
4. docs/02-conventions.md
5. docs/architecture/08-roles-regions-and-deletion.md   (roles, regions, deletion — authoritative)
6. docs/architecture/00-overview.md
7. docs/architecture/01-mobile-architecture.md
8. docs/architecture/02-web-architecture.md
9. docs/architecture/03-backend-architecture.md
10. docs/architecture/04-api.md            (build the API EXACTLY as specified)
11. docs/architecture/05-database.md        (build the schema EXACTLY as specified)
12. docs/architecture/06-auth-and-authorization.md
13. docs/architecture/07-third-party-integrations.md
14. docs/design-system/00-tokens.md, 01-typography.md, 02-components.md
15. docs/flows/00-index.md and flows 01–10
16. EVERY file in docs/pages/ (p*, r*, a*, s*)
17. The HTML in prototypes/pages/ (UI/UX + interaction reference)

## What to build
Three deliverables in the same monorepo:
- apps/mobile  — React Native (Expo)
- apps/web     — Next.js (React) + the Admin/Super-Admin console
- apps/api     — Node.js + Express + PostgreSQL (with workers)

Use this stack (do not substitute):
Mobile: React Native (Expo) · Web: Next.js (React) · Backend: Node.js + Express ·
DB: PostgreSQL · Media storage: CLOUDFLARE R2 (images + video; S3-compatible API,
presigned uploads, multipart for large video, public bucket via Cloudflare CDN) ·
Cache/queue: Redis + BullMQ · Realtime: Socket.IO · Auth: JWT access + refresh,
OTP, OAuth (Google/Apple) · Push: Firebase Cloud Messaging · Email/SMS: provider
adapters. NO payments/subscriptions. NO Live TV / live streaming.

## Hard rules
- Roles are exactly: `user`, `reporter`, `admin` (region-scoped), `super_admin`
  (Guest = unauthenticated). Enforce RBAC server-side on every endpoint.
- Geography: State → District → Constituency → Mandal (`regions` + scope tables).
  Admins act only within their scope + descendants; reporters publish only in
  assigned regions. Only `super_admin` manages regions.
- Deletion: users = SOFT delete (`users.is_deleted=true`), super-admin only,
  restorable + purge. Articles = HARD delete, super-admin only.
- App contact/advertisement details: `super_admin` only (`app_settings`).
- Media: images (JPG/PNG/WebP ≤10MB) and video (MP4 H.264/AAC + WebM, ≤200MB,
  ≤3 min). Videos are transcoded server-side and get a generated poster; readers
  play UPLOADED videos inline. There is no live streaming.
- Post articles MUST support: rich-text body (bold/italic/underline, H2/H3,
  lists, quote, link, text colour, highlight), headline colour + font size,
  description colour + font size, and 5 share-poster templates
  (Classic, Breaking, Minimal, Gradient, Photo Hero).
- Use the API contract in docs/architecture/04-api.md verbatim: base `/api/v1`,
  `Authorization: Bearer <accessToken>`, envelope
  `{ "success", "data", "meta", "error" }`, cursor pagination, documented error
  codes. Use the DB schema in 05-database.md verbatim (tables, constraints,
  indexes, enums).
- Use ONLY design tokens from docs/design-system/00-tokens.md. Match the
  prototypes' layout/interaction; production may use a real icon set (Lucide/
  Feather), not the unicode glyphs.
- Follow the mandatory page-doc sections; each page must satisfy its REQ-* rows.
  Keep REQ IDs traceable in code comments/tests.

## Build order (do it in these phases, verify each before moving on)
P0 Foundation
  1. Monorepo scaffold (pnpm workspaces), lint/format/typecheck, env loading.
  2. PostgreSQL schema + migrations from 05-database.md; seed regions, roles,
     categories, and one super_admin + one admin + one reporter + one user.
P1 Backend core
  3. Express app: middleware chain (auth, RBAC, regionScope, superAdminGuard,
     validation, rate limit, error envelope, audit log), config, logging.
  4. Auth: signup, login (email/password + OTP), OAuth, refresh rotation, logout,
     forgot/reset, `GET /auth/me` with role + region scopes.
  5. Articles CRUD + submit/review/publish/reject (region-scoped), categories,
     regions, search, comments, likes, bookmarks, notifications, follows.
  6. Media: R2 presigned + multipart upload, probe, transcode (MP4/WebM), poster,
     processing status + webhook/polling.
  7. Poster render endpoint; app-settings; audit logs; danger-zone (soft
     delete/restore/purge, article hard delete).
P2 Web (Next.js)
  8. Reader pages P01–P13, P15–P21 + shells; SSR/ISR for SEO; auth handling.
  9. Reporter console R01–R05 (composer with rich text + styling, media upload,
     poster editor, my-articles, application).
  10. Admin console A01–A10 (region-scoped moderation/users/approvals/analytics,
      regions, app settings, danger zone).
P3 Mobile (Expo)
  11. Navigation shell (bottom tabs: Home, Categories, Search, Saved, Profile),
      auth, feed, scroll-snap reader (P08), article detail with video, comments,
      bookmarks, notifications, profile/settings.
  12. Reporter + admin surfaces as specified in their page docs.
P4 Hardening
  13. Tests (unit + API integration + e2e for critical flows), seed/demo data,
      error/empty/loading states, accessibility, observability (Sentry),
      CI (lint/typecheck/test/build), docs for running locally and deploying.

## Page + flow compliance
- Implement every page in docs/01-page-index.md (P01–P13, P15–P21; R01–R05;
  A01–A10; S01–S02). P14 is retired — do not create it.
- Implement the flows in docs/flows/ exactly (auth, user, browsing, reading,
  reporter, admin, navigation, API interaction, share poster, media upload).

## Definition of done
- All P0/P1 requirements in every docs/pages/*.md are implemented.
- API matches docs/architecture/04-api.md; schema matches 05-database.md.
- RBAC + region scoping + deletion policy enforced server-side and tested.
- Web and mobile UI match the prototypes and use design tokens.
- Image + uploaded-video publishing/playing works end-to-end via Cloudflare R2.
- Rich-text + headline/description styling + 5 poster templates work.
- Lint, typecheck, and tests pass; a fresh clone runs with documented commands.

## How to work
- Do NOT stop to ask questions for anything already specified in the docs; only
  ask if a genuine contradiction exists, and cite the files.
- Work phase by phase; after each phase, run the build/tests and report status.
- If something is ambiguous, choose the option most consistent with the docs and
  note the decision in an IMPLEMENTATION_NOTES.md at the repo root.
- Never add payments, subscriptions, paywalls, or live streaming.
- Never remove documented features.

Start by confirming you have read the files in Step 0, then output a short
implementation plan mapped to the phases above, and begin Phase P0.
```

---

## Quick usage

1. Open a fresh chat with your coding LLM/agent in this repository.
2. Paste the box above (or say: "Read `IMPLEMENTATION_PROMPT.md` and execute it").
3. Let it work phase by phase; review after each phase.
