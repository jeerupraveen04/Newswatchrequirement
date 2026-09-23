/**
 * NewsWatch design tokens — single source of truth.
 * Mirrors docs/design-system/00-tokens.md exactly.
 */

export const colors = {
  purple: "#8a007a",
  purpleDark: "#62005a",
  purpleLight: "#f7eaf6",
  purpleTintBorder: "#eee0ed",

  text: "#171717",
  textSecondary: "#333333",
  muted: "#737373",
  mutedStrong: "#555555",
  border: "#e8e8e8",
  background: "#f5f5f5",
  white: "#ffffff",
  scrim: "rgba(0,0,0,0.65)",

  success: "#16a34a",
  warning: "#d97706",
  error: "#dc2626",
  info: "#2563eb",
} as const;

export const radius = {
  sm: 7,
  md: 8,
  lg: 12,
  xl: 16,
  pill: 999,
} as const;

export const spacing = {
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 40,
  10: 55,
} as const;

export const shadows = {
  sm: "0 1px 2px rgba(0,0,0,0.06)",
  md: "0 4px 12px rgba(0,0,0,0.10)",
  card: "0 3px 15px rgba(0,0,0,0.05), 0 1px 2px rgba(0,0,0,0.04)",
} as const;

export const typography = {
  fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif",
  titleMobile: 24,
  titleWeb: 34,
  summaryMobile: 14,
  summaryWeb: 17,
  bodyMobile: 15,
  bodyWeb: 16,
  metaMobile: 12,
  metaWeb: 13,
  navMobile: 13,
  navWeb: 14,
} as const;

export const breakpoints = {
  xs: 390,
  mobile: 768,
  tablet: 1024,
} as const;

export const sizes = {
  headerWeb: 68,
  headerMobile: 62,
  contentMax: 900,
} as const;

export type Colors = typeof colors;
