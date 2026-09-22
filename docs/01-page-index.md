# 01 — Master Page Index

Every page in the platform. Each links to its combined documentation file in
`docs/pages/`. Each page doc follows
[`03-page-template.md`](03-page-template.md).

Legend: **M** = Mobile app, **W** = Web, **A** = Admin console (web).
Priority: **P0** = must-have for v1, **P1** = important, **P2** = nice-to-have.

> **P14 is retired/removed** and intentionally omitted from the tables
> below. IDs are not renumbered; the gap at P14 is expected.

---

## Reader / Public pages

| ID | Page | Platforms | Priority | Doc |
|---|---|---|---|---|
| P01 | Splash / App Launch | M, W | P0 | [p01-splash.md](pages/p01-splash.md) |
| P02 | Onboarding | M, W | P0 | [p02-onboarding.md](pages/p02-onboarding.md) |
| P03 | Login | M, W | P0 | [p03-login.md](pages/p03-login.md) |
| P04 | Sign Up | M, W | P0 | [p04-signup.md](pages/p04-signup.md) |
| P05 | OTP Verification | M, W | P0 | [p05-otp.md](pages/p05-otp.md) |
| P06 | Forgot / Reset Password | M, W | P1 | [p06-forgot-password.md](pages/p06-forgot-password.md) |
| P07 | Home / News Feed | M, W | P0 | [p07-home-feed.md](pages/p07-home-feed.md) |
| P08 | News Listing (Scroll Reader) | M, W | P0 | [p08-news-listing.md](pages/p08-news-listing.md) |
| P09 | Article Detail / Reader | M, W | P0 | [p09-article-detail.md](pages/p09-article-detail.md) |
| P10 | Categories | M, W | P0 | [p10-categories.md](pages/p10-categories.md) |
| P11 | Category Listing | M, W | P0 | [p11-category-listing.md](pages/p11-category-listing.md) |
| P12 | Search | M, W | P0 | [p12-search.md](pages/p12-search.md) |
| P13 | Search Results | M, W | P0 | [p13-search-results.md](pages/p13-search-results.md) |
| P15 | Bookmarks / Saved | M, W | P1 | [p15-bookmarks.md](pages/p15-bookmarks.md) |
| P16 | Comments | M, W | P1 | [p16-comments.md](pages/p16-comments.md) |
| P17 | Notifications | M, W | P1 | [p17-notifications.md](pages/p17-notifications.md) |
| P18 | Profile | M, W | P0 | [p18-profile.md](pages/p18-profile.md) |
| P19 | Edit Profile | M, W | P1 | [p19-edit-profile.md](pages/p19-edit-profile.md) |
| P20 | Settings | M, W | P1 | [p20-settings.md](pages/p20-settings.md) |
| P21 | About / Static Pages | M, W | P2 | [p21-about-static.md](pages/p21-about-static.md) |

## Reporter pages

| ID | Page | Platforms | Priority | Doc |
|---|---|---|---|---|
| R01 | Reporter Dashboard | M, W | P1 | [r01-reporter-dashboard.md](pages/r01-reporter-dashboard.md) |
| R02 | Article Composer (Create/Edit) | M, W | P1 | [r02-article-composer.md](pages/r02-article-composer.md) |
| R03 | My Articles (Status List) | M, W | P1 | [r03-my-articles.md](pages/r03-my-articles.md) |
| R04 | Reporter Application | M, W | P2 | [r04-reporter-application.md](pages/r04-reporter-application.md) |
| R05 | Share Poster (Poster Templates) | M, W | P0 | [r05-share-poster.md](pages/r05-share-poster.md) |

## Admin pages (web console)

| ID | Page | Platforms | Priority | Doc |
|---|---|---|---|---|
| A01 | Admin Login | A | P1 | [a01-admin-login.md](pages/a01-admin-login.md) |
| A02 | Admin Dashboard | A | P1 | [a02-admin-dashboard.md](pages/a02-admin-dashboard.md) |
| A03 | Article Moderation (region-scoped) | A | P1 | [a03-article-moderation.md](pages/a03-article-moderation.md) |
| A04 | Category Management | A | P1 | [a04-category-management.md](pages/a04-category-management.md) |
| A05 | User Management | A | P1 | [a05-user-management.md](pages/a05-user-management.md) |
| A06 | Reporter Approvals | A | P1 | [a06-reporter-approvals.md](pages/a06-reporter-approvals.md) |
| A07 | Analytics | A | P2 | [a07-analytics.md](pages/a07-analytics.md) |

## Super Admin pages (web console, God user)

| ID | Page | Platforms | Priority | Doc |
|---|---|---|---|---|
| A08 | Region Management | A | P1 | [a08-region-management.md](pages/a08-region-management.md) |
| A09 | App Contact & Advertisement Settings | A | P1 | [a09-app-settings-contacts.md](pages/a09-app-settings-contacts.md) |
| A10 | Danger Zone (soft-deleted users, hard-delete articles, audit log) | A | P1 | [a10-danger-zone.md](pages/a10-danger-zone.md) |

## System / Global

| ID | Page | Platforms | Priority | Doc |
|---|---|---|---|---|
| S01 | Splash / Error / Maintenance states | M, W | P0 | [s01-system-states.md](pages/s01-system-states.md) |
| S02 | Global Navigation Shell (bottom tabs / sidebar / header) | M, W, A | P0 | [s02-navigation-shell.md](pages/s02-navigation-shell.md) |

---

## Cross-cutting flows

| Flow | Doc |
|---|---|
| Authentication | [flows/01-authentication-flow.md](flows/01-authentication-flow.md) |
| User journey | [flows/02-user-flow.md](flows/02-user-flow.md) |
| News browsing | [flows/03-news-browsing-flow.md](flows/03-news-browsing-flow.md) |
| News reading | [flows/04-news-reading-flow.md](flows/04-news-reading-flow.md) |
| Reporter | [flows/05-reporter-flow.md](flows/05-reporter-flow.md) |
| Admin | [flows/06-admin-flow.md](flows/06-admin-flow.md) |
| Navigation map | [flows/07-navigation-map.md](flows/07-navigation-map.md) |
| API interaction | [flows/08-api-interaction-flow.md](flows/08-api-interaction-flow.md) |
