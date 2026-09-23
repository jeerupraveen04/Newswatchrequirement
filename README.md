# NewsWatch — Requirements & UI/UX Documentation Repository

> **This repository is NOT the final application.**
> It is the complete, implementation-ready **requirements, UI/UX, flow, and
> architecture documentation** for the NewsWatch platform. Once finalized, it
> can be handed to an LLM or engineering team to build the **mobile app, web
> application, backend, and database** exactly as specified.

---

## 1. What this project is

NewsWatch is a news platform with a fast, swipeable news-reading experience,
category browsing, search, bookmarks, comments, notifications, and a
reporter + admin content pipeline.

This repo documents **what to build, how each page must look, how each page must
behave, and how all pages/modules connect** — in enough detail that no design or
product decision is left ambiguous.

### In scope
- Functional requirements for every page (reader, reporter, admin).
- UI/UX specs for **mobile app** and **web** with responsive rules.
- Complete flow diagrams (authentication, browsing, reading, reporter, admin,
  navigation, API/backend interaction).
- Architecture docs (mobile, web, backend, database, API, auth, integrations).
- Reference HTML/CSS prototypes for key pages.
- Central README + per-page documentation + clear folder structure.

### Out of scope
- No production application code (this is spec only).
- **No payments or subscription/paywall** — all content is free in v1.

---

## 2. Target technology stack

| Layer | Technology |
|---|---|
| Mobile app | React Native (Expo) |
| Web app | React (Next.js) |
| Backend | Node.js + Express |
| Database | PostgreSQL |
| Schema / types | Drizzle ORM (schema + types only) |
| Migrations | dbmate (plain SQL, forward-only) |
| Queue / jobs | pgmq (PostgreSQL message queue extension) |
| Media storage (images + video) | **Cloudflare R2** (Cloudflare CDN) |
| Auth | JWT access + refresh tokens, OTP login, OAuth (Google/Apple) |
| Push notifications | Firebase Cloud Messaging (FCM) |
| Realtime | WebSocket / Socket.IO (live comments) |
| Cache | Redis |
| Analytics | Firebase Analytics + backend events |

See [`docs/architecture/00-overview.md`](docs/architecture/00-overview.md) for the
full architecture and [`docs/architecture/04-api.md`](docs/architecture/04-api.md)
for the API contract.

---

## 3. Roles

| Role (`users.role`) | Description |
|---|---|
| **Guest** | Unauthenticated. Can browse feed, read, search, open categories. |
| **User** (`user`) | Normal user. Can like, comment, bookmark, follow, manage profile. |
| **Reporter** (`reporter`) | Can add news. Creates and submits articles within assigned regions, tracks status. |
| **Admin** (`admin`) | Approves/publishes news for a **specific region** (state → district → constituency → mandal). Manages users/reporters within scope. |
| **Super Admin** (`super_admin`, God user) | Unrestricted. Can do anything any role can, plus: **soft-delete users** (`is_deleted=true`), **hard-delete articles**, manage **regions**, and update **app contact / advertisement details**. |

> Full role matrix, region scoping, and deletion policy:
> [`docs/architecture/08-roles-regions-and-deletion.md`](docs/architecture/08-roles-regions-and-deletion.md).

---

## 4. Repository structure

```
Newswatchrequirement/
├── README.md                     # This file — project overview
├── newslistingscreen.html        # Existing combined prototype (legacy location)
├── docs/
│   ├── 00-overview.md            # Goals, scope, glossary, personas
│   ├── 01-page-index.md          # Master list of all pages + links
│   ├── 02-conventions.md         # Doc format, naming, requirement IDs
│   ├── 03-page-template.md       # Template every page doc follows
│   ├── flows/                    # Flow diagrams (all connectivity)
│   │   ├── 00-index.md
│   │   ├── 01-authentication-flow.md
│   │   ├── 02-user-flow.md
│   │   ├── 03-news-browsing-flow.md
│   │   ├── 04-news-reading-flow.md
│   │   ├── 05-reporter-flow.md
│   │   ├── 06-admin-flow.md
│   │   ├── 07-navigation-map.md
│   │   └── 08-api-interaction-flow.md
│   ├── architecture/
│   │   ├── 00-overview.md
│   │   ├── 01-mobile-architecture.md
│   │   ├── 02-web-architecture.md
│   │   ├── 03-backend-architecture.md
│   │   ├── 04-api.md             # REST API contract
│   │   ├── 05-database.md        # Schema + ERD
│   │   ├── 06-auth-and-authorization.md
│   │   ├── 08-roles-regions-and-deletion.md  # Roles, region scope, deletion policy
│   │   └── 07-third-party-integrations.md
│   ├── design-system/
│   │   ├── 00-tokens.md          # Colors, spacing, radius, shadows
│   │   ├── 01-typography.md
│   │   └── 02-components.md      # Shared component inventory
│   └── pages/                    # One combined doc per page
│       ├── ...                   # See docs/01-page-index.md
└── prototypes/
    ├── README.md                 # Prototype guide
    ├── pages/                    # Clickable skeleton pages (start here)
    │   ├── shared/               # app.css (tokens) + app.js (chrome/interactions)
    │   ├── index / s02-navigation-shell.html  # Links to every screen
    │   ├── p01…p21 / r01…r05 / a01…a10 / s01–s02   # P14 removed (retired)
    ├── web/                      # Original standalone web prototype
    └── mobile/                   # Mobile-specific prototypes (to add)
```

---

## 5. How to read this repo

1. Start with [`docs/00-overview.md`](docs/00-overview.md) for goals, personas,
   and glossary.
2. Read [`docs/01-page-index.md`](docs/01-page-index.md) to see every page and
   open the page you care about.
3. Read the relevant flow in [`docs/flows/`](docs/flows/00-index.md) to
   understand how pages connect.
4. Read [`docs/architecture/`](docs/architecture/00-overview.md) before
   implementing backend/database.
5. Use [`docs/design-system/`](docs/design-system/00-tokens.md) for visual
   consistency.
6. Reference prototypes in [`prototypes/`](prototypes/README.md) for exact UI.
   Open [`prototypes/pages/s02-navigation-shell.html`](prototypes/pages/s02-navigation-shell.html)
   to click through every screen.

---

## 5b. Clickable skeleton prototype

A full set of **linked HTML skeleton pages** implementing every documented
screen lives in [`prototypes/pages/`](prototypes/pages/). All pages share one
design-system stylesheet (`shared/app.css`) and one script (`shared/app.js`)
that injects the header, mobile bottom tabs, or admin/super-admin sidebar.
Interactions (scroll-snap scroller, likes, saves, tabs, OTP inputs) are wired
end-to-end. It includes dedicated screens for the region hierarchy, app contact
settings, and the super-admin danger zone (soft-delete users / hard-delete
articles). The current set covers **37 pages** — P01–P13 and P15–P21 (reader),
R01–R05, A01–A10, S01–S02; **P14 is retired/removed**.

---

## 6. How to use this repo with an LLM

Prompt pattern:

> "Using the documentation in this repository, implement the NewsWatch
> [mobile app / web app / backend / database]. Follow
> `docs/architecture/`, `docs/flows/`, and each page document in `docs/pages/`
> exactly. Match the UI in `prototypes/`. Do not add features not documented."

Each page doc contains: Purpose, UI structure, Features, User flow,
Dependencies, API/data requirements, and Navigation to other pages — everything
needed to build that page without further clarification.

---

## 7. Requirement ID convention

`REQ-<AREA>-<n>` (e.g. `REQ-AUTH-003`). Areas: `AUTH`, `FEED`, `READ`,
`CAT`, `SEARCH`, `BOOK`, `NOTIF`, `COMMENT`, `PROF`, `SET`, `REP`,
`ADM`, `SYS`. See [`docs/02-conventions.md`](docs/02-conventions.md).

---

## 8. Status

| Section | Status |
|---|---|
| Overview & conventions | ✅ |
| Page index | ✅ |
| Reader/Public pages | ✅ |
| Reporter pages | ✅ |
| Admin pages | ✅ |
| Flows | ✅ |
| Architecture | ✅ |
| Design system | ✅ |
| Prototypes | ✅ 37 linked skeleton pages (P14 removed) |
