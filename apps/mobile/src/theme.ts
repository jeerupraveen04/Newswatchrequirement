import { colors, radius, spacing, typography } from "@newswatch/tokens";

/** React Native theme derived from the shared design tokens. */
export const theme = {
  colors: {
    ...colors,
    white: colors.white,
  },
  radius,
  spacing,
  typography,
};

export type Theme = typeof theme;
