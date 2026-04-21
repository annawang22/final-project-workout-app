/**
 * Design tokens — single source of truth for UI (UI Phase 3).
 * Light palette only; UI Phase 4 can swap in a dark palette using the same keys.
 */

export const COLORS = {
  background: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  primary: "#FC4C02",
  border: "#E5E5E5",
  card: "#F8F8F8",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

/** Screen title row + content that aligns with `AppHeader` horizontal inset. */
export const SCREEN_HORIZONTAL = SPACING.md;

export const typography = {
  header: {
    fontSize: 28,
    fontWeight: "700",
  },
  subheader: {
    fontSize: 20,
    fontWeight: "600",
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
  },
};

/** Tab bar label — size between spacing steps; kept here for one import. */
export const TAB_BAR = {
  labelFontSize: 12,
  labelFontWeight: "600",
  labelLetterSpacing: 0.2,
};

/** Extra scroll/list bottom padding above tab bar + FAB (tokenized lengths). */
export const CONTENT_BOTTOM = {
  homeList: SPACING.xl * 3 + SPACING.xs,
  goalsList: SPACING.xl * 2 + SPACING.lg,
};
