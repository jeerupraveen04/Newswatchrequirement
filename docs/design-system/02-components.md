# Components

Shared component inventory used across pages. Each component lists variants,
states, tokens, and the pages that use it. Page docs reference these by name.

## 1. Layout

| Component | Description | Used by |
|---|---|---|
| `AppHeader` | Web header: logo, nav, search, auth actions. 68px. | All web pages (S02) |
| `MobileHeader` | Purple bar, logo + actions. 62px. | All mobile pages (S02) |
| `BottomTabBar` | 4 tabs: Home, Categories, Bookmarks, Profile. | Mobile (S02) |
| `SideNav` | Admin console sidebar navigation. | Admin (A02–A07) |
| `PageContainer` | Content wrapper, max-width 900px, centered. | Web content pages |
| `ScrollScroller` | Full-height scroll-snap container. | P08 |

## 2. Navigation

| Component | Description | Used by |
|---|---|---|
| `NavLink` | Text link; hover/active purple. | S02 |
| `ScrollIndicator` | Right-side vertical dots; active elongated. | P08 |
| `BackButton` | Stack back affordance. | Detail pages |
| `Breadcrumb` | Web/admin path trail. | Admin |

## 3. Content

| Component | Description | Used by |
|---|---|---|
| `ArticleCard` | Image, category, title, summary, meta, actions. | P07, P11, P13, P15 |
| `ArticleHero` | Image + category badge + image counter. | P08, P09 |
| `ArticleBody` | Rich paragraph renderer. | P08, P09 |
| `NextNewsCard` | Thumbnail + label + title + arrow. | P08, P09 |
| `CategoryChip` | Pill for category / filter. | P07, P10, P11 |
| `CategoryCard` | Icon/image + name + count. | P10 |
| `MetaRow` | Author avatar, time, views. | Article pages |
| `StatsCard` | KPI number + label. | R01, A02, A07 |
| `StatusBadge` | draft/pending/published/rejected with token colors. | R03, A03 |

## 4. Actions

| Component | Description | States | Used by |
|---|---|---|---|
| `PrimaryButton` | Purple filled; radius-md. | default/hover/active/disabled/loading | All forms |
| `SecondaryButton` | Outline/ghost. | same | All |
| `IconButton` | Circular icon action (like, comment, share, save). | default/active(purple)/disabled | P08, P09 |
| `ActionBar` | Row of `IconButton`s with counts. | — | P08, P09 |
| `LikeButton` | Toggles like, optimistic count. | unliked/liked | Article pages |
| `BookmarkButton` | Toggles save. | unsaved/saved | Article pages |
| `ShareButton` | Native share / copy link. | — | Article pages |
| `FollowButton` | Follow category/reporter. | follow/following | P10, P11, P18 |
| `FloatingActionButton` | "New Article". | — | R01 |

## 5. Inputs

| Component | Description | Validation |
|---|---|---|
| `TextInput` | Labeled text field. | required, length |
| `PasswordInput` | Masked + visibility toggle + strength. | strength rules |
| `SearchInput` | Search with clear + submit. | min chars |
| `OTPInput` | 6 boxes, auto-advance, paste support. | 6 digits |
| `TextArea` | Multiline body/summary. | min/max length |
| `Select` / `Dropdown` | Category, role, sort. | required |
| `MultiSelect` | Categories, tags. | ≥1 |
| `Toggle` / `Switch` | Settings, active flags. | — |
| `Checkbox` / `Radio` | Terms, options. | required where noted |
| `DatePicker` | Analytics range, schedule. | valid range |
| `ImageUploader` | Drag-drop / picker, crop, progress, alt. | type, size, count |

## 6. Feedback

| Component | Description | Used by |
|---|---|---|
| `Skeleton` | Shimmer placeholder (card, list, article). | All loading |
| `Spinner` | Inline loading. | Buttons, pages |
| `EmptyState` | Illustration + message + CTA. | Lists, bookmarks, search |
| `ErrorState` | Message + Retry. | All data pages |
| `Toast` | Transient success/error/info. | Actions, forms |
| `Banner` | Offline / maintenance. | S01 |
| `Modal` | Confirm dialogs, forms. | Admin, delete actions |
| `BottomSheet` | Mobile share/options. | Mobile |
| `ConfirmDialog` | Destructive confirm. | Delete/logout |

## 7. Media

| Component | Description | Used by |
|---|---|---|
| `ResponsiveImage` | Lazy, aspect-ratio, blur placeholder. | All |
| `ImageGallery` | Swipe gallery + counter. | P09 |
| `UploadedVideoPlayer` | Inline player for uploaded article videos (progressive MP4/WebM) with native controls + poster frame. | P08, P09 |
| `Avatar` | User image with fallback initials. | Profile, comments |

## 8. Component states (standard)

Every interactive component must define:
- **default**, **hover** (web), **active/pressed**, **focus-visible**
  (web, accessibility), **disabled**, **loading** (where async).

## 9. Naming

- Components are `PascalCase`; tokens `--kebab-case`.
- Page docs must reference components by the names in this file so pages stay
  consistent and reusable.
