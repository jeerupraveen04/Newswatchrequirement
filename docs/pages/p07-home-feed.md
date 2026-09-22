# P07 — Home / News Feed

## Metadata

| Field | Value |
|---|---|
| Page ID | P07 |
| Platforms | Mobile / Web |
| Roles | Guest / User / Reporter / Admin |
| Priority | P0 |
| Route / Path | Mobile: `/home` (tab 1). Web: `/` / `/home` |
| Prototype | `newslistingscreen.html` (header/nav tokens), `prototypes/home/feed.html` (TBD) |

## Purpose

The Home feed is the platform's primary discovery surface. It presents a
continuously scrollable list of article cards grouped under a category chip row,
with a top header (logo, search, notifications, profile) and the S02 bottom tab
bar on mobile. It exists to let any user reach readable content in under two
taps, to surface fresh/personalised stories, and to capture engagement (like,
comment, save, share) directly from the feed. Guests see the same feed with
auth-gated actions prompting login.

## UI Structure

### Mobile
- **Top header (62px, `header-height-mobile`):** solid `--purple` background,
  no bottom border. Left: `logo-icon` 29px white + "newswatch" wordmark white
  `font-size` 19px `weight-extrabold`. Right (`space-4` gap): search icon and
  overflow `⋮` icon in white (unicode glyphs `⌕`, `⋮` in prototype; Lucide in
  production, stroke 2px). The `--white` header variant is used in the article
  scroller (P08).
- **Category chip row:** horizontal `ScrollView`, height ~44px, sticky under the
  header; chips `radius-pill`, `--white` surface with `--border` default,
  active chip `--purple` background with `--white` text; `space-2` gaps,
  `space-4` horizontal padding; "For You" chip first (personalised), then
  categories from P10.
- **Feed:** vertical `FlatList` of article cards with `space-4` gutters and
  `space-4` vertical gaps.
  - **Article card** (`radius-xl`, `--white`, `shadow-card`):
    - Image (16:9, full card width, top corners `radius-xl`), lazy-loaded with a
      `--background` shimmer placeholder.
    - Category label overlaid bottom-left of the image: `--purple` background,
      `--white` text, `radius-sm`, `font-size-meta` `weight-bold`.
    - Body padding `space-4`: **Title** (`font-size-title-sm` 22px → but card
      titles use ~18px `weight-bold`, `line-height-tight`, max 3 lines),
      **Summary** (`font-size-summary` 14px, `--muted-strong`, max 2 lines),
      **Meta row** (`--muted`, `font-size-meta` 11–12px): author avatar 27px
      (`avatar`, `--purple` circle) + "NewsWatch"/reporter name, "◷ 2h ago"
      (client-computed relative), "◉ 24.8K views" (abbreviated counts).
    - **Action row** (icon+label, 34px `--purple-light` circles on
      press): Like (heart + count), Comments, Share, Save. Active states
      (liked/saved) use filled `--purple` icons and count increments.
- **Pull-to-refresh:** `RefreshControl` tinted `--purple`; refreshing shows the
  three-dot purple loader.
- **Infinite scroll:** on reaching `onEndReachedThreshold` (0.5), fetch the next
  cursor page; a footer spinner appears while loading; "You're all caught up"
  footer at the end.
- **Offline:** a `--warning`-tinted banner "You're offline — showing cached
  stories" above the feed; cached feed still scrolls.
- **Bottom tab bar (S02, ~56px + safe area):** Home (active `--purple`),
  Categories, Search, Bookmarks, Profile. Label `font-size-nav` 13px; active
  icon/label `--purple`, inactive `--muted`. Hidden when a modal/scroller is
  full-screen (P08 uses its own immersive chrome).

### Web
- **Web header (68px, `header-height-web`):** fixed, `rgba(255,255,255,0.97)`
  background, `1px solid var(--border)` bottom border, `40px` horizontal padding.
  - Left: purple `logo-icon` 34px (20° rotated with white notch) + "newswatch
    news" `--purple` 23px `weight-extrabold`.
  - Center-left desktop nav (`space-7` gaps, 14px `weight-semibold` #444):
    Home, Categories, Search, About; hover `--purple`.
  - Right (`space-4` gaps): **search box** 230×40, `--border` border,
    `radius-md`, magnifier glyph; **Login** button `--purple` white
    `weight-semibold` `radius-md` (replaced by avatar + notification bell when
    logged in).
- **Feed layout (≥1025px):** centered column max-width `content-max-width`
  (900px), `space-9` top padding. Cards use the full 900px width with
  `shadow-card`, `space-6` internal padding, title ~22px `weight-bold`.
  Optional right rail (P2) for "Trending" at ≥1280px.
- **Category chips** render as a centered row under the header with the same
  pill styling; web hover lifts chips `shadow-sm` and tints `--purple-light`.
- **Guest vs logged-in:** guests see "Login" and action taps route to P03 with a
  `redirect` back to the feed; logged-in users see an avatar menu (Profile,
  Bookmarks, Settings, Logout) and notification bell with unread badge.

### Responsive behavior
- `xs` (0–390px): card title 17px; hero images 16:9; meta hides views if space
  is tight; header icons condensed.
- `mobile` (≤768px): purple mobile header, bottom tab bar, single column.
- `tablet` (769–1024px): single column max-width ~680px, desktop header but no
  right rail.
- `desktop` (≥1025px): 900px column + optional trending rail.

## Features / Functional Requirements

| ID | Requirement | Priority |
|---|---|---|
| REQ-FEED-001 | The Home feed MUST show a paginated, cursor-based list of published articles ordered by recency (default) or personalisation ("For You"). | P0 |
| REQ-FEED-002 | The feed MUST provide a horizontal category chip row; tapping a chip filters the feed in place (or deep-links to P11). | P0 |
| REQ-FEED-003 | Each article card MUST show image, category, title, summary, author, relative time, views, and the four actions. | P0 |
| REQ-FEED-004 | The feed MUST support pull-to-refresh that resets to the first page. | P0 |
| REQ-FEED-005 | The feed MUST support infinite scroll using `meta.nextCursor` / `meta.hasMore`. | P0 |
| REQ-FEED-006 | The top header MUST provide logo, search, notifications, and profile/login per auth state. | P0 |
| REQ-FEED-007 | Guests MUST be able to browse; tapping Like/Save/Comment/Share MUST prompt login via P03 with a return redirect. | P0 |
| REQ-FEED-008 | Like and Save MUST optimistically update and reconcile with the server; failures revert. | P0 |
| REQ-FEED-009 | The feed MUST render shimmer skeletons while loading first page and next-page spinners for pagination. | P0 |
| REQ-FEED-010 | The feed MUST show a first-run empty state with a "Refresh" CTA, and an error state with retry on fetch failure. | P0 |
| REQ-FEED-011 | The feed MUST cache the last successful page set for offline viewing with an offline banner. | P1 |
| REQ-FEED-012 | The feed MUST persist scroll position when returning from an article so the user resumes where they left off. | P1 |
| REQ-FEED-013 | The mobile bottom tab bar (S02) MUST highlight Home when active and provide navigation to Categories, Search, Bookmarks, and Profile. | P0 |
| REQ-FEED-014 | The feed MUST surface a notification unread badge on the header bell. | P1 |
| REQ-FEED-015 | Card images MUST lazy-load with progressive placeholders and use an image CDN with width params. | P1 |
| REQ-FEED-016 | Tapping a card MUST open the article; the default reader is P08 for trending/immersive, P09 for standard. | P0 |
| REQ-FEED-017 | The "For You" tab MUST reflect follows/interests for logged-in users and fall back to recency for guests. | P1 |

## User Interactions

- **Pull-to-refresh:** drag > 60px triggers refresh; `RefreshControl` tint
  `--purple`; on release the spinner rotates until the first page resolves
  (`dur-medium` minimum).
- **Infinite scroll:** footer loader fades in `dur-medium`; new cards mount with
  a subtle `opacity 0→1` + `translateY 8→0` over `dur-medium`.
- **Chip tap:** active chip pill animates background `--white → --purple`
  (`dur-fast`) and the list cross-fades to the filtered set; the horizontal row
  auto-scrolls the active chip into view.
- **Card tap:** card scales `1.0 → 0.98` on press (`dur-fast`, native) / hover
  `shadow-md` + `translateY -2px` (web) before navigating.
- **Like:** icon scales `1→1.2→1` bounce (`dur-medium`) and fills `--purple`;
  count increments optimistically; unauthenticated taps open login sheet.
- **Save:** icon fills `--purple`; a toast "Saved to bookmarks" with an
  "Undo" action appears at the bottom (`z-toast`).
- **Comment:** opens P16 comments (or the article's comment sheet).
- **Share:** opens the native share sheet (mobile) / OS share or copy-link
  popover (web) with deep link.
- **Long-press card (mobile):** context menu with Save, Share, Hide, Report.
- **Header:** search icon opens P12; bell opens P17; profile opens P18.
- **Double-tap image:** quick-like (`--purple` heart burst, `dur-medium`).
- **Reduced motion:** disable bounce/bursts; keep fades.

## Validation & Error States

| Field/Action | Rule | Error message |
|---|---|---|
| Initial feed fetch | Must succeed within 10s | "Couldn't load stories" + Retry |
| Next-page fetch | Must return valid cursor | Footer "Tap to retry" |
| Like API | Auth required | Guest → prompt login, no error toast |
| Like/Save API failure | Revert optimistic change | "Couldn't save. Try again." |
| Cursor/params | Valid UUID cursor | "Something went wrong" + retry |
| Offline | No connectivity | "You're offline — showing cached stories" |
| Empty category | No articles | "No stories in this category yet" |

## Loading, Empty, Success States

- **Loading:** first page → 4–6 card skeletons (grey `--background` blocks with
  shimmer for image, title, summary, meta, actions). Pagination → centered
  3-dot `--purple` footer spinner.
- **Empty:** illustration + "No stories yet" + "Pull to refresh or explore
  categories" + a "Browse categories" CTA → P10.
- **Error:** `--error` icon, "Couldn't load stories", "Retry" button.
- **Success:** full card feed; optimistic like/save reflected immediately;
  end-of-list footer "You're all caught up".

## User Flow

```mermaid
flowchart TD
  A[Home Feed] --> B{First page cached?}
  B -- yes --> C[Render cached + revalidate]
  B -- no --> D[Show skeletons -> fetch]
  D --> C
  C --> E{User action}
  E -->|Pull| F[Refresh first page]
  E -->|Scroll| G[Fetch next cursor page]
  E -->|Tap card| H{User}
  H -->|Standard| I[/article/:slug/ P09]
  H -->|Immersive| J[/scroller/ P08]
  E -->|Like/Save as guest| K[/login/ -> back]
  E -->|Chip| L[Filter feed]
```

1. User lands on Home after splash or tab switch.
2. Client renders cached feed (if any) then revalidates page 1.
3. User scrolls; the next cursor page loads automatically.
4. User interacts: opens an article, likes/saves (auth-gated), or filters by chip.
5. Returning from an article restores scroll position.

## Dependencies

- **Screens:** P01 Splash, P03 Login, P08 News Listing, P09 Article Detail,
  P10 Categories, P11 Category Listing, P12 Search, P15 Bookmarks, P16 Comments,
  P17 Notifications, P18 Profile, S02 Navigation Shell.
- **Components:** `AppHeader`, `SearchBox`, `NotificationBell`, `CategoryChips`,
  `ArticleCard`, `ActionBar`, `FeedSkeleton`, `EmptyState`, `ErrorState`,
  `OfflineBanner`, `BottomTabBar` (S02), `Toast`.
- **Services/stores:** `FeedStore`, `AuthStore`, `BookmarkStore`,
  `LikeStore`, `QueryClient` (cache), `AnalyticsService`, `SocketService`
  (live view/engagement updates).
- **Backend endpoints:** `/api/v1/articles`, `/api/v1/categories`,
  `/api/v1/articles/:id/like`, `/api/v1/bookmarks`, `/api/v1/notifications/unread-count`.

## API / Data Requirements

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/v1/articles?cursor=&limit=10&category=&tab=for_you` | Paginated feed |
| GET | `/api/v1/categories` | Category chip row |
| POST | `/api/v1/articles/:id/like` | Like / unlike |
| POST | `/api/v1/bookmarks` | Save article |
| DELETE | `/api/v1/bookmarks/:articleId` | Unsave article |
| GET | `/api/v1/notifications/unread-count` | Bell badge |

`GET /api/v1/articles` response:

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "uuid",
        "slug": "pm-modi-inaugurates-projects",
        "title": "PM Modi Inaugurates New Infrastructure Projects in Andhra Pradesh",
        "summary": "The Prime Minister laid the foundation stone for several infrastructure projects...",
        "heroImage": "https://cdn/.../hero.jpg",
        "category": { "id": "uuid", "name": "India", "slug": "india" },
        "author": { "id": "uuid", "name": "NewsWatch", "avatar": null },
        "publishedAt": "2026-09-22T08:15:00Z",
        "viewCount": 24800,
        "likeCount": 1200,
        "commentCount": 48,
        "liked": false,
        "saved": false
      }
    ]
  },
  "meta": { "nextCursor": "uuid-or-null", "hasMore": true },
  "error": null
}
```

## Navigation

| Action | From | To |
|---|---|---|
| Tab: Home | S02 | P07 Home Feed |
| Tab: Categories | S02 | P10 Categories |
| Tab: Search | S02 | P12 Search |
| Tab: Bookmarks | S02 | P15 Bookmarks |
| Tab: Profile | S02 | P18 Profile |
| Tap card | P07 Home | P09 Article Detail (or P08) |
| Tap chip | P07 Home | P07 filtered / P11 Category Listing |
| Search icon | P07 Home | P12 Search |
| Bell icon | P07 Home | P17 Notifications |
| Login / avatar | P07 Home | P03 Login / P18 Profile |
| Guest action | P07 Home | P03 Login (redirect back) |

## Analytics Events

| Event | Trigger | Properties |
|---|---|---|
| `home_view` | Page mount | `tab`, `authState` |
| `feed_load` | Page fetch | `cursor`, `category`, `count`, `ms` |
| `feed_load_failure` | Fetch error | `code`, `cursor` |
| `feed_refresh` | Pull-to-refresh | `category` |
| `feed_scroll_depth` | Next page loaded | `page`, `articlesSeen` |
| `card_click` | Card tap | `articleId`, `position`, `category` |
| `card_like` | Like/unlike | `articleId`, `liked` |
| `card_save` | Save/unsave | `articleId`, `saved` |
| `card_share` | Share | `articleId`, `channel` |
| `chip_select` | Chip tap | `categoryId`, `tab` |
| `guest_gate_shown` | Guest action | `action` |

## Open Questions

- Is the immersive scroll reader (P08) the default on card tap, or the standard
  article detail (P09)?
- "For You" personalisation inputs at v1: follows only, or reading history?
- Right-rail "Trending" for desktop — in scope for v1 or P2?
- Infinite scroll page size (10 vs 20) and prefetch threshold?
