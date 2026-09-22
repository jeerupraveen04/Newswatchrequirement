# 00 — Project Overview

## 1. Vision

NewsWatch is a mobile-first news platform that delivers a fast, immersive
reading experience: full-screen articles you can swipe through like a feed,
organised by category, searchable, with community engagement (comments, likes,
bookmarks).

## 2. Goals

| # | Goal |
|---|---|
| G1 | Let a user open the app and reach a readable article in ≤ 2 taps. |
| G2 | Provide a continuous, swipeable news browsing experience. |
| G3 | Support real, staff-written content via a reporter workflow. |
| G4 | Give region-scoped admins control of content, categories, and users in their area. |
| G5 | Keep the app and web UI/UX consistent. |
| G6 | Be implementation-ready for an LLM/engineer. |
| G7 | Publish news scoped to India's geography (State → District → Constituency → Mandal). |
| G8 | Give a Super Admin (God user) full, audited control including soft/hard deletes. |

## 3. Product pillars

1. **Speed** — rapid load, cached feed, skeleton states.
2. **Immersiveness** — full-screen scroll-snapped reading.
3. **Trust** — verified reporter content, clear authorship.
4. **Engagement** — likes, comments, bookmarks, follows, notifications.
5. **Consistency** — same design language across mobile and web.

## 4. Non-goals (v1)

- No payments, subscriptions, or paywalls.
- No user-generated article submission by ordinary readers.
- No offline full-text archive (only cached recent feed).
- No non-English localisation (English only), though copy is i18n-ready.

## 5. Personas

### Persona A — Aarav, casual reader (Mobile)
- Age 27, commutes daily, reads on phone.
- Wants a quick, swipeable feed; saves articles for later.
- Low patience for slow loads.

### Persona B — Meera, news enthusiast (Web)
- Age 34, reads on desktop at work.
- Browses categories, searches topics, reads articles.
- Comments occasionally, follows topics.

### Persona C — Rahul, reporter
- Submits 2–4 articles/day with images, region, and category.
- Needs to see status (draft / pending / published / rejected) and feedback.

### Persona D — Sana, regional admin
- Approves/rejects/publishes articles for her region (e.g. a constituency).
- Manages reporters and users within her scope; sees scoped analytics.

### Persona E — Vikram, super admin (God user)
- Unrestricted access across all regions.
- Soft-deletes users, hard-deletes articles, manages regions, and updates app
  contact / advertisement details. All actions audited.

## 6. Glossary

| Term | Meaning |
|---|---|
| **Article / News** | A single news story with title, summary, body, images. |
| **Feed** | Ordered list of articles (home, category, search results). |
| **Scroller** | Full-screen scroll-snap reading UI (see prototype). |
| **Category** | Topic grouping (India, Sports, Business, Technology, ...). |
| **Hero image** | Primary image shown at top of an article. |
| **Next-news card** | In-article card linking to another article. |
| **Bookmark / Save** | User-saved article for later. |
| **Like** | Positive reaction with count. |
| **Follow** | Subscribe to a category or reporter for updates. |
| **Reporter** | Content creator role. Adds news within assigned regions. |
| **Admin** | Region-scoped manager: approves/publishes news, manages users/reporters in scope. |
| **Super Admin** | "God user". Unrestricted; soft-deletes users, hard-deletes articles, manages regions and app contact/ad details. |
| **Region** | A node in the geography tree: state, district, constituency, or mandal. |
| **Regional scope** | The set of regions (and descendants) an admin/reporter may act on. |
| **Soft delete** | Marks a record deleted (`is_deleted=true`) without removing rows. |
| **Hard delete** | Permanently removes a row and its dependents (super admin only). |
| **Draft** | Article saved but not submitted. |
| **Pending** | Submitted, awaiting admin review. |
| **Published** | Live and visible to readers. |
| **Rejected** | Reviewed and declined, with reason. |
| **JWT** | JSON Web Token used for auth (access + refresh). |

## 7. Platforms

| Platform | Who | Primary device |
|---|---|---|
| Mobile app (React Native/Expo) | Users, Reporters | iOS / Android |
| Web app (React/Next.js) | Users, Reporters, Admins | Desktop / tablet |
| Backend API (Node/Express) | All clients | Server |
| Admin console (web) | Admins, Super Admins | Desktop |

## 8. High-level features

- Authentication (OTP, email/password, Google/Apple).
- Home feed with scroll-snap cards.
- Full article reader with image, meta, actions, body, next-news.
- Categories browsing.
- Search (articles, categories, reporters).
- Uploaded article videos (MP4/WebM, transcoded, poster, inline playback).
- Bookmark/Save + My Bookmarks.
- Comments (with replies) and likes.
- Notifications (push + in-app).
- User profile & settings.
- Reporter dashboard + article composer + article status.
- Region hierarchy (state → district → constituency → mandal) with region-scoped
  admin approval.
- Admin dashboard, region-scoped moderation, category management, user
  management, reporter approvals, analytics.
- Super Admin console: region management, soft-delete/restore users, hard-delete
  articles, app contact & advertisement settings, full audit log.

## 9. Success metrics

- Time-to-first-article < 3s.
- Feed scroll engagement (articles per session) ≥ 5.
- Bookmark/comment rate per article.
- Reporter publish turnaround time.
- Crash-free sessions > 99.5%.

## 10. Related documents

- Page index: [`01-page-index.md`](01-page-index.md)
- Conventions: [`02-conventions.md`](02-conventions.md)
- Roles, regions & deletion: [`architecture/08-roles-regions-and-deletion.md`](architecture/08-roles-regions-and-deletion.md)
- Flows: [`flows/00-index.md`](flows/00-index.md)
- Architecture: [`architecture/00-overview.md`](architecture/00-overview.md)
