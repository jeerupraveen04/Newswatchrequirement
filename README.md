# OneWayNews - News Listing Screen

A single-file HTML/CSS/JS prototype of a news listing screen with a
full-screen, vertical scroll-snap experience for both desktop and mobile.

File: `newslistingscreen.html`

## Requirements

### 1. General
- Single self-contained `.html` file (inline CSS and JS, no build step).
- Responsive: works on desktop and mobile browsers.
- Brand colour palette based on purple (`--purple: #8a007a`) with light/dark
  variants, plus neutral text, border and background tokens.
- Clean typography using the `Inter` font stack.

### 2. Web Header
- Fixed header at the top of the viewport.
- Logo ("oneway news") with a custom CSS logo icon.
- Desktop navigation: Home, Categories, Live TV, About.
- Header actions: search box, Login button.
- On mobile the header collapses to a solid purple bar with only the logo and
  mobile icons (search / menu); nav, search box and login are hidden.

### 3. News Scroller
- A full-height vertical scroller below the header.
- Scroll-snap behaviour (`y mandatory`, `snap-stop: always`) so each article
  fills the viewport and locks into place.
- Smooth scrolling with hidden scrollbars.
- One full-screen "page" per news article.

### 4. News Article Page
Each article must contain, in order:
- **Hero image** with:
  - Category badge (e.g. India, Sports, Business, Technology).
  - Image counter (e.g. `1/12`).
- **Content block** with:
  - Article title (large, bold).
  - Short summary paragraph.
  - Meta row: author name, relative time (e.g. "2h ago"), view count.
  - Actions row: Like (with count), Comments, Share, Save.
  - Article body paragraphs.
  - "Next News" card: thumbnail, label, next article title and arrow icon.

### 5. Next News Navigation
- Clicking a "Next News" card scrolls to the corresponding article
  (`goToNews(index)`).
- Smooth scroll to the start of the target article.

### 6. Desktop Scroll Indicator
- Fixed dot indicator on the right side.
- Active article's dot is highlighted and elongated.
- Dots update automatically as the user scrolls (IntersectionObserver,
  threshold `0.65`).

### 7. Keyboard Navigation
- `ArrowDown` / `PageDown` moves to the next article.
- `ArrowUp` / `PageUp` moves to the previous article.
- Navigation clamps at the first and last article.

### 8. Responsive Breakpoints
- **Desktop**: default styles, centred article card (max-width `900px`) with
  rounded corners and shadow, hero height `470px`.
- **Mobile (`max-width: 768px`)**: purple header, edge-to-edge article with no
  card shadow, hero height `300px`, reduced font sizes and spacing.
- **Small phones (`max-width: 390px`)**: further reduced hero height (`270px`),
  title and body font sizes.

### 9. Content
- Prototype includes 4 sample articles (India, Sports, Business, Technology).
- Images are loaded from Unsplash.

## How to Use
Open `newslistingscreen.html` directly in any modern browser.

## Deployment
Static site is deployed to GitHub Pages via GitHub Actions.

- Workflow: `.github/workflows/deploy.yml`
- Triggers on push to `main` (and manual run via `workflow_dispatch`).
- The workflow copies `newslistingscreen.html` to `index.html` and publishes
  the repository root as the site.

### Setup
1. Push this repository to GitHub.
2. Go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Push to `main`; the site will be published at
   `https://<username>.github.io/<repo>/`.
