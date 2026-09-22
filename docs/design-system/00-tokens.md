# Design Tokens

Single source of truth for visual values across Mobile, Web, and Admin.
Derived from the existing prototype (`newslistingscreen.html`).

> Every page doc and prototype MUST use these tokens. Do not invent colors or
> spacing values.

## 1. Color

### Brand
| Token | Value | Usage |
|---|---|---|
| `--purple` | `#8a007a` | Primary brand, buttons, active states, links |
| `--purple-dark` | `#62005a` | Pressed/active, gradients |
| `--purple-light` | `#f7eaf6` | Tinted backgrounds, hover fills |
| `--purple-tint-border` | `#eee0ed` | Borders on tinted surfaces |

### Neutrals
| Token | Value | Usage |
|---|---|---|
| `--text` | `#171717` | Primary text |
| `--text-secondary` | `#333333` | Article body |
| `--muted` | `#737373` | Meta, secondary text |
| `--muted-strong` | `#555555` | Summary text |
| `--border` | `#e8e8e8` | Dividers, inputs |
| `--background` | `#f5f5f5` | App background |
| `--white` | `#ffffff` | Surfaces/cards |
| `--scrim` | `rgba(0,0,0,0.65)` | Text over images (image counter) |

### Feedback (system)
| Token | Value | Usage |
|---|---|---|
| `--success` | `#16a34a` | Success, published status |
| `--warning` | `#d97706` | Pending status |
| `--error` | `#dc2626` | Errors, rejected status |
| `--info` | `#2563eb` | Informational |

### Category accent (optional chips)
Category chips default to `--purple`; accent map may be defined later.

## 2. Typography

See [`01-typography.md`](01-typography.md).

| Token | Mobile | Web |
|---|---|---|
| `font-family` | Inter, system fallback | Inter, system fallback |
| `font-size-title` | 24px | 34px |
| `font-size-title-sm` | 22px | — |
| `font-size-summary` | 14px | 17px |
| `font-size-body` | 15px | 16px |
| `font-size-meta` | 11–12px | 13px |
| `font-size-nav` | 13px | 14px |
| `weight-regular` | 400 | 400 |
| `weight-medium` | 500 | 500 |
| `weight-semibold` | 600 | 600 |
| `weight-bold` | 700 | 700 |
| `weight-extrabold` | 800 | 800 |
| `line-height-tight` | 1.15–1.22 | 1.15 |
| `line-height-body` | 1.65 | 1.8 |

## 3. Spacing scale

| Token | Value |
|---|---|
| `space-1` | 4px |
| `space-2` | 8px |
| `space-3` | 12px |
| `space-4` | 16px |
| `space-5` | 20px |
| `space-6` | 24px |
| `space-7` | 28px |
| `space-8` | 32px |
| `space-9` | 40px |
| `space-10` | 55px |

Content padding: mobile `16–17px`, web `35px`.

## 4. Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 7px | Chips, small badges |
| `radius-md` | 8px | Buttons, inputs |
| `radius-lg` | 12px | Next-news card |
| `radius-xl` | 16px | Article card |
| `radius-pill` | 999px | Round buttons, avatars |

## 5. Shadows

| Token | Value |
|---|---|
| `shadow-card` | `0 3px 15px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)` |
| `shadow-sm` | `0 1px 2px rgba(0,0,0,0.06)` |
| `shadow-md` | `0 4px 12px rgba(0,0,0,0.10)` |

## 6. Sizing

| Token | Value | Usage |
|---|---|---|
| `header-height-web` | 68px | Web header |
| `header-height-mobile` | 62px | Mobile header |
| `hero-height-web` | 470px | Article hero (desktop) |
| `hero-height-mobile` | 300px | Article hero (mobile) |
| `hero-height-mobile-sm` | 270px | Hero on ≤390px |
| `content-max-width` | 900px | Article card |
| `search-width` | 230px | Header search box |
| `search-height` | 40px | Header search box |
| `logo-icon` | 34px (29px mobile) | Brand mark |
| `avatar` | 27px | Author avatar |

## 7. Motion

| Token | Value | Usage |
|---|---|---|
| `dur-fast` | 120ms | Hover/press feedback |
| `dur-medium` | 200ms | Transitions, fades |
| `dur-slow` | 300ms | Page/scroll transitions |
| `ease-standard` | `cubic-bezier(0.4, 0, 0.2, 1)` | Default easing |
| `scroll-behavior` | smooth | Scroll-snap / navigation |

## 8. Breakpoints

| Name | Range | Notes |
|---|---|---|
| `xs` | 0–390px | Small phones |
| `mobile` | 0–768px | Mobile app + responsive web |
| `tablet` | 769–1024px | Web adjustments |
| `desktop` | ≥1025px | Full web layout |

## 9. Z-index

| Token | Value |
|---|---|
| `z-base` | 1 |
| `z-scroll-indicator` | 100 |
| `z-header` | 1000 |
| `z-drawer` | 1100 |
| `z-modal` | 1200 |
| `z-toast` | 1300 |

## 10. Iconography

- Prototype uses unicode glyphs (`♡`, `◯`, `⌯`, `⌷`, `⌕`, `⋮`).
- Production MUST use a consistent icon set (e.g. Lucide / Feather),
  stroke 1.75–2px, 20–24px, colored `--text`/`--muted`, active `--purple`.

## 11. CSS variables (reference block)

```css
:root {
  --purple: #8a007a;
  --purple-dark: #62005a;
  --purple-light: #f7eaf6;
  --purple-tint-border: #eee0ed;

  --text: #171717;
  --text-secondary: #333333;
  --muted: #737373;
  --muted-strong: #555555;
  --border: #e8e8e8;
  --background: #f5f5f5;
  --white: #ffffff;
  --scrim: rgba(0, 0, 0, 0.65);

  --success: #16a34a;
  --warning: #d97706;
  --error: #dc2626;
  --info: #2563eb;

  --radius-sm: 7px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;
  --radius-pill: 999px;

  --shadow-card: 0 3px 15px rgba(0,0,0,.05), 0 1px 2px rgba(0,0,0,.04);
}
```
