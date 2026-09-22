# 07 — Navigation Map

The complete page-to-page navigation map for **mobile**, **web**, and the
**admin console**, including mobile bottom-tab structure, stack screens, web
header/sidebar, deep-link URL mapping, and back/forward behavior.

| Field | Value |
|---|---|
| Roles | Guest, User, Reporter, Admin, Super Admin |
| Shell page | S02 Global Navigation Shell |
| Requirement area | `SYS`, `REG`, `ADS`, `DEL` |

---

## 1. Requirement map

| ID | Requirement | Priority |
|---|---|---|
| REQ-SYS-010 | Mobile MUST use a bottom tab bar with 5 tabs (Home, Categories, Search, Bookmarks, Profile). | P0 |
| REQ-SYS-011 | The tab bar MUST be hidden on full-screen reader (P09) and auth screens. | P0 |
| REQ-SYS-012 | Web MUST use a fixed top header with primary nav, search, and account menu. | P0 |
| REQ-SYS-013 | Admin console MUST use a fixed left sidebar. | P1 |
| REQ-SYS-014 | Every primary page MUST have a unique, shareable URL on web. | P0 |
| REQ-SYS-015 | Deep links MUST resolve to the correct page on mobile and web. | P0 |
| REQ-SYS-016 | Back MUST return to the previous in-app screen, preserving list scroll state. | P0 |
| REQ-SYS-017 | Tab switches MUST reset that tab's stack to its root. | P0 |
| REQ-SYS-018 | Protected pages MUST redirect guests to P03 with a `returnTo` parameter. | P0 |
| REQ-SYS-019 | 404/unknown routes MUST show a not-found state linking to P07. | P0 |

---

## 2. Mobile navigation structure

### 2.1 Bottom tabs (S02)

```mermaid
flowchart TD
  ROOT([App root Tabs]) --> T1[Tab: Home]
  ROOT --> T2[Tab: Categories]
  ROOT --> T3[Tab: Search]
  ROOT --> T4[Tab: Bookmarks]
  ROOT --> T5[Tab: Profile]
  T1 --> H0[P07 Home Feed]
  T2 --> C0[P10 Categories]
  T3 --> S0[P12 Search]
  T4 --> B0[P15 Bookmarks]
  T5 --> PR0[P18 Profile]
```

| Tab | Icon | Root page | Auth required |
|---|---|---|---|
| Home | `home` | P07 | No |
| Categories | `grid` | P10 | No |
| Search | `search` | P12 | No |
| Bookmarks | `bookmark` | P15 | Yes (prompt if guest) |
| Profile | `user` | P18 | Yes (guest sees login CTA) |

### 2.2 Home tab stack

```mermaid
flowchart TD
  H[P07 Home Feed] --> HL[P08 News Listing]
  H --> HD[P09 Article Detail]
  H --> HS[P12 Search]
  HS --> HR[P13 Search Results] --> HD
  H --> HN[P17 Notifications] --> HD
  HL --> HD
  HD --> HC[P16 Comments]
```

### 2.3 Categories tab stack

```mermaid
flowchart TD
  C[P10 Categories] --> CL[P11 Category Listing]
  CL --> CD[P09 Article Detail]
  CD --> CC[P16 Comments]
```

### 2.4 Search tab stack

```mermaid
flowchart TD
  S[P12 Search] --> SR[P13 Search Results]
  SR --> SD[P09 Article Detail]
  SD --> SC[P16 Comments]
```

### 2.5 Bookmarks tab stack

```mermaid
flowchart TD
  B[P15 Bookmarks] --> BD[P09 Article Detail]
  BD --> BC[P16 Comments]
```

### 2.6 Profile tab stack

```mermaid
flowchart TD
  P[P18 Profile] --> PE[P19 Edit Profile]
  P --> PS[P20 Settings]
  P --> PA[P21 About / Static]
  P --> RA[R04 Reporter Application]
  P --> RD[R01 Reporter Dashboard]
  RD --> RC[R02 Article Composer]
  RD --> RM[R03 My Articles]
  RM --> RC
  RC --> RP[R05 Share Poster]
  RM --> RP
  RP --> RC
```

### 2.7 Full-screen (tab bar hidden) routes

| Route | Page | Reason |
|---|---|---|
| Auth stack | P01–P06 | No tab chrome during auth |
| Reader | P09 | Immersive scroll-snap (REQ-SYS-011) |
| Modals | image viewer, share sheet, filter sheet | Overlay presentation |

---

## 3. Mobile root stack

```mermaid
flowchart TD
  SPLASH[P01 Splash] --> ONB[P02 Onboarding]
  SPLASH --> TABS[Main Tabs S02]
  ONB --> AUTHSTACK[Auth Stack]
  ONB --> TABS
  AUTHSTACK --> L[P03 Login]
  AUTHSTACK --> SU[P04 Sign Up]
  AUTHSTACK --> O[P05 OTP]
  AUTHSTACK --> F[P06 Forgot/Reset]
  L --> TABS
  SU --> TABS
  O --> TABS
  F --> TABS
  TABS --> READER[P09 Reader full-screen]
  TABS --> MODALS[Modals]
```

Navigation library assumption: Expo Router / React Navigation native stack +
bottom tabs. Each tab owns an independent stack; the root stack owns auth and
modal groups.

---

## 4. Web navigation structure

### 4.1 Public/reader header (S02)

```mermaid
flowchart LR
  HDR[Web Header 68px] --> LOGO[Logo -> P07]
  HDR --> NAV["Nav: Home, Categories, Search"]
  HDR --> SEARCH[Search box -> P13]
  HDR --> BELL[Bell -> P17]
  HDR --> AV[Avatar menu]
  AV --> AL[P03 Login - guest]
  AV --> AP[P18 Profile]
  AV --> AB[P15 Bookmarks]
  AV --> AS[P20 Settings]
  AV --> AR[R01/R03 if reporter]
  AV --> AOUT[Logout]
```

- Header is `position: fixed`, height `header-height-web` (68px),
  `z-header` (1000), content offset by 68px.
- Search box: `search-width` 230px, `search-height` 40px; Enter → P13.
- Below `mobile` (≤768px), primary nav collapses into a hamburger drawer
  (`z-drawer` 1100) with the same destinations.

### 4.2 Reader web page map

```mermaid
flowchart TD
  HOME[P07 Home] --> LIST[P08 Listing]
  HOME --> CAT[P10 Categories] --> CATL[P11 Category]
  HOME --> SRCH[P12 Search] --> SRES[P13 Results]
  HOME --> ART[P09 Article]
  CATL --> ART
  SRES --> ART
  ART --> CMT[P16 Comments]
  HOME --> NOTI[P17 Notifications] --> ART
  HOME --> BOOK[P15 Bookmarks] --> ART
  HOME --> PROF[P18 Profile] --> EDIT[P19 Edit] 
  PROF --> SET[P20 Settings]
  PROF --> ABOUT[P21 About]
```

### 4.3 Admin console sidebar (A01–A10)

```mermaid
flowchart TD
  ADMIN[Rendered only when token role is admin or super_admin] --> DASH[A02 Dashboard]
  DASH --> MOD[A03 Article Moderation]
  DASH --> CAT[A04 Category Management]
  DASH --> USR[A05 User Management]
  DASH --> APP[A06 Reporter Approvals]
  DASH --> ANA[A07 Analytics]
  DASH --> SA{Role == super_admin?}
  SA -- yes --> REG[A08 Region Management]
  SA -- yes --> SET[A09 App Contact & Ad Settings]
  SA -- yes --> DZ[A10 Danger Zone]
```

Regular admins see A02–A07 only, scoped to their assigned regions. The
Super Admin sidebar **adds Regions, App Settings, and Danger Zone** (A08–A10);
these items are hidden otherwise, and the server still enforces access
(REQ-ADM-010, REQ-ADM-013..015).

---

## 5. Deep-link URL mapping

| Page | Mobile route (scheme `newswatch://`) | Web URL (`https://newswatch.app`) |
|---|---|---|
| P01 Splash | — (app internal) | `/` (redirects to feed) |
| P02 Onboarding | `/onboarding` | `/onboarding` |
| P03 Login | `/auth/login` | `/login` |
| P04 Sign Up | `/auth/signup` | `/signup` |
| P05 OTP | `/auth/otp?identifier=` | `/verify?identifier=` |
| P06 Forgot/Reset | `/auth/reset?token=` | `/reset?token=` |
| P07 Home Feed | `/home` | `/home` |
| P08 News Listing | `/news` | `/news` |
| P09 Article Detail | `/article/{id}` or `/a/{slug}` | `/a/{slug}` |
| P10 Categories | `/categories` | `/categories` |
| P11 Category Listing | `/category/{id}` or `/c/{slug}` | `/c/{slug}` |
| P12 Search | `/search` | `/search` |
| P13 Search Results | `/search?q=` | `/search?q=` |
| P15 Bookmarks | `/bookmarks` | `/bookmarks` |
| P16 Comments | `/article/{id}/comments` | `/a/{slug}#comments` |
| P17 Notifications | `/notifications` | `/notifications` |
| P18 Profile | `/profile` | `/profile` |
| P19 Edit Profile | `/profile/edit` | `/profile/edit` |
| P20 Settings | `/profile/settings` | `/settings` |
| P21 About / Static | `/about/{page}` | `/about/{page}` |
| R01 Reporter Dashboard | `/reporter` | `/reporter` |
| R02 Article Composer | `/reporter/compose` or `/reporter/compose/{id}` | `/reporter/compose` |
| R03 My Articles | `/reporter/articles` | `/reporter/articles` |
| R04 Reporter Application | `/reporter/apply` | `/reporter/apply` |
| R05 Share Poster | `/reporter/articles/{id}/poster` (`Composer → Make poster`) | `/reporter/articles/:id/poster` |
| A01 Admin Login | — (web only) | `/admin/login` |
| A02 Admin Dashboard | — | `/admin` |
| A03 Article Moderation | — | `/admin/articles` |
| A04 Category Management | — | `/admin/categories` |
| A05 User Management | — | `/admin/users` |
| A06 Reporter Approvals | — | `/admin/reporters` |
| A07 Analytics | — | `/admin/analytics` |
| A08 Region Management | — | `/admin/regions` |
| A09 App Contact & Ad Settings | — | `/admin/app-settings` |
| A10 Danger Zone | — | `/admin/danger-zone` |
| S01 System States | — | `/error/{code}` |
| S02 Nav Shell | app shell | layout wrapper |

Query parameters: `q` (search), `type`, `sort`, `from`, `to`, `cursor` (list
state). Unknown IDs/slugs route to the not-found state (REQ-SYS-019).

---

## 6. Deep-link resolution

```mermaid
sequenceDiagram
  autonumber
  participant OS as OS / Browser
  participant App as Client
  participant API as Backend
  participant Nav as Navigator

  OS->>App: open link (scheme or universal)
  App->>App: parse path + params
  App->>App: check auth requirement
  alt requires auth and guest
    App->>Nav: redirect to P03 with returnTo=original
  else allowed
    App->>API: resolve entity if needed (slug -> id)
    API-->>App: entity or 404
    alt found
      App->>Nav: push target page
    else not found
      App->>Nav: show not-found state -> P07
    end
  end
```

Web resolves server-side via Next.js routing + `getServerSideProps`/RSC for
article SEO metadata; mobile resolves client-side after cold start.

---

## 7. Back / forward behavior

| Context | Mobile back | Web back |
|---|---|---|
| Tab root (P07/P10/P12) | Android: exit app; iOS: no-op | Browser history / previous site |
| Push screen (P08/P09/P11/P13) | Pop to previous screen, restore scroll | History back, restore scroll |
| Article from list | Return to list at same index | History back to list, restore scroll |
| Deep link cold start | Back goes to P07 root | Back goes to referrer or `/home` |
| Auth success | Replace auth stack with target; back does not return to login | `router.replace` target; back skips login |
| Logout | Reset all stacks to guest P07 | Redirect to P07 (`replace`) |
| Tab switch | Each tab keeps its own stack (REQ-SYS-017 resets on re-tap) | Full navigation, header persists |
| Modal/overlay | Back/gesture dismisses overlay only | Esc or back closes overlay |

Rules:

- Prefer `push` for forward navigation; use `replace` for auth completion,
  logout, and redirects so back never re-enters a transient screen.
- List scroll position is cached per list identity (`surface + filters`) and
  restored on back (REQ-SYS-016).
- Unknown/expired deep links fall back to P07 with a toast, not a blank screen.

---

## 8. Protected-route gate

```mermaid
flowchart TD
  NAV[Navigate to route] --> PUB{Public route?}
  PUB -- yes --> SHOW[Render page]
  PUB -- no --> AUTH{Authenticated?}
  AUTH -- no --> RED[Redirect P03 with returnTo]
  RED --> LOGIN[Login success]
  LOGIN --> RESUME[Navigate to returnTo]
  AUTH -- yes --> ROLE{Role allowed?}
  ROLE -- no --> FORBID[Show 403 state -> P07]
  ROLE -- yes --> SHOW
```

Public routes: P01, P02, P03–P06, P07, P08, P09, P10, P11, P12, P13,
P21. Gated: P15, P16 (write), P17, P18–P20, R01–R05, A01–A10. A08–A10 require
`super_admin` specifically; A02–A07 require `admin` or `super_admin` (in-scope
for admin).

---

## 9. Complete page connectivity graph

```mermaid
flowchart TD
  P01[P01 Splash] --> P02[P02 Onboarding]
  P01 --> P07[P07 Home Feed]
  P02 --> P03[P03 Login]
  P02 --> P07
  P03 --> P04[P04 Sign Up]
  P03 --> P05[P05 OTP]
  P03 --> P06[P06 Forgot/Reset]
  P04 --> P05
  P05 --> P07
  P06 --> P03
  P07 --> P08[P08 News Listing]
  P07 --> P09[P09 Article Detail]
  P07 --> P10[P10 Categories]
  P07 --> P12[P12 Search]
  P07 --> P17[P17 Notifications]
  P08 --> P09
  P10 --> P11[P11 Category Listing]
  P11 --> P09
  P12 --> P13[P13 Search Results]
  P13 --> P09
  P17 --> P09
  P17 --> P11
  P09 --> P16[P16 Comments]
  P09 --> P15[P15 Bookmarks]
  P07 --> P18[P18 Profile]
  P18 --> P19[P19 Edit Profile]
  P18 --> P20[P20 Settings]
  P18 --> P21[P21 About]
  P18 --> R04[R04 Reporter Application]
  P18 --> R01[R01 Reporter Dashboard]
  R01 --> R02[R02 Article Composer]
  R01 --> R03[R03 My Articles]
  R03 --> R02
  R02 --> R03
  R03 --> R05[R05 Share Poster]
  R02 --> R05
  R05 --> R02
  R05 --> P09
  A01[A01 Admin Login] --> A02[A02 Admin Dashboard]
  A02 --> A03[A03 Article Moderation]
  A02 --> A04[A04 Category Management]
  A02 --> A05[A05 User Management]
  A02 --> A06[A06 Reporter Approvals]
  A02 --> A07[A07 Analytics]
  A02 --> A08[A08 Region Management - super_admin]
  A02 --> A09[A09 App Settings - super_admin]
  A02 --> A10[A10 Danger Zone - super_admin]
  A08 --> A08
  A09 --> A09
  A10 --> A10
  A10 --> A03
  A03 --> P09
  R04 --> A06
```

---

## 10. Analytics events

| Event | Trigger | Properties |
|---|---|---|
| `nav_tab_select` | Tab changed | `tab`, `fromTab` |
| `nav_push` | New screen pushed | `from`, `to` |
| `nav_back` | Back used | `from`, `to` |
| `nav_deeplink` | Deep link opened | `path`, `resolved`, `source` |
| `nav_not_found` | Unknown route | `path` |
| `nav_guard_redirect` | Auth/role gate triggered | `route`, `reason` |

---

## 11. Open questions

- Do we need a persistent "Continue reading" bar across tabs?
- Should web support browser forward navigation fully or use replace semantics?
- Are admin routes served from a subdomain (`admin.`) or path (`/admin`)?
