# Prototypes

Clickable HTML/CSS skeleton prototypes for NewsWatch. These are **visual and
behavioral references only** — not production code. Production builds (mobile
React Native, web Next.js) MUST match the UI, tokens, and behavior described in
`docs/pages/`.

## Start here

Open **[`pages/s02-navigation-shell.html`](pages/s02-navigation-shell.html)** —
it links to every screen in the prototype.

## Structure

```
prototypes/
├── pages/                    # All skeleton pages (flat, so links are simple)
│   ├── shared/
│   │   ├── app.css           # Design-system styles (tokens from docs/design-system)
│   │   └── app.js            # Injects header/tabbar/admin sidebar + interactions
│   ├── p01-splash.html … p21-about-static.html   # Reader / public
│   ├── r01-reporter-dashboard.html … r05-share-poster.html  # Reporter
│   ├── a01-admin-login.html … a07-analytics.html # Admin console (region-scoped)
│   ├── a08-region-management.html … a10-danger-zone.html  # Super admin (God mode)
│   └── s01-system-states.html, s02-navigation-shell.html
├── web/news-listing.html     # Original full prototype (standalone)
└── mobile/                   # Mobile-specific prototypes (to add)
```

## How it works

- Every page is a standalone `.html` file that includes
  `shared/app.css` and `shared/app.js`.
- `app.js` injects the shared header, mobile bottom tab bar, or admin sidebar
  based on `data-*` attributes on `<body>`:
  - `data-chrome="none"` → no chrome (auth/splash pages).
  - `data-app="true"` → show mobile bottom tab bar.
  - `data-admin="true"` → show the admin sidebar instead of the header.
  - `data-super="true"` → add the Super Admin "God mode" sidebar group
    (Regions, App & Ad Settings, Danger Zone).
  - `data-page="home|categories|live|bookmarks|profile|..."` → active states.
- All pages cross-link to each other, so the whole app is clickable.

## Interactions included

- Scroll-snap news scroller with dots + keyboard navigation (P08).
- Like toggle with optimistic count, save toggle, share/toast.
- Comment composer, bookmark removal, tab/chip switching.
- OTP auto-advance inputs.
- Responsive: mobile header + bottom tabs at ≤768px.
- Role-aware chrome: admin sidebar for `data-admin`, plus the God-mode group
  for `data-super`.

## Rules

1. Use tokens from `docs/design-system/00-tokens.md` (they live in `app.css`).
2. Keep each page a single self-contained `.html` file.
3. Behavior must mirror the matching doc in `docs/pages/`.
4. Keep the [navigation shell](pages/s02-navigation-shell.html) in sync when
   adding pages.
