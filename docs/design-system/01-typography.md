# Typography

Font: **Inter** (with system fallback). Values come from
[`00-tokens.md`](00-tokens.md).

## 1. Font stack

```css
font-family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
  Arial, sans-serif;
```

Mobile loads Inter via `expo-font`; web loads via `next/font`.

## 2. Type scale

| Style | Mobile | Web | Weight | Line-height | Usage |
|---|---|---|---|---|---|
| Display / Article title | 24px | 34px | 800 | 1.15–1.22 | `p09`, `p08` title |
| Title small | 22px | — | 800 | 1.22 | small-phone titles |
| Section heading | 18px | 22px | 700 | 1.3 | section titles |
| Card title | 15px | 17px | 700 | 1.35 | feed card titles |
| Summary / lead | 14px | 17px | 400 | 1.5–1.6 | article summary |
| Body | 15px | 16px | 400 | 1.65–1.8 | article body |
| Meta | 11px | 13px | 400/700 | 1.4 | author, time, views |
| Nav | 13px | 14px | 600 | 1.2 | header nav |
| Label / badge | 11px | 12px | 700–800 | 1.2 | category, status |
| Button | 14px | 14px | 600 | 1.2 | buttons |

## 3. Text colors

| Role | Token |
|---|---|
| Primary | `--text` |
| Body | `--text-secondary` |
| Summary | `--muted-strong` |
| Meta | `--muted` |
| On purple | `--white` |
| Link | `--purple` |

## 4. Truncation rules

| Context | Lines | Method |
|---|---|---|
| Feed card title | 2 | line-clamp |
| Feed card summary | 2 | line-clamp |
| Next-news title | 2 | line-clamp |
| Article title (detail) | none | full |
| Category name | 1 | ellipsis |
| Notification text | 2 | ellipsis |

## 5. Accessibility

- Minimum body size 15px.
- Minimum contrast ratio 4.5:1 for text.
- Do not go below 11px for any text.
- Support OS font scaling; layouts must not break at 130% zoom.
