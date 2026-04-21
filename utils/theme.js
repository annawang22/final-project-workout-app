/**
 * Design tokens — UI Phase 3 spacing/typography + UI Phase 4 light/dark colors.
 * Runtime UI colors use `getTheme(isDark)` / `useTheme().colors`, except
 * `PROFILE_DARK_MODE_SWITCH` (fixed Switch chrome) and legacy `COLORS` alias.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";

export const LIGHT_COLORS = {
  background: "#FFFFFF",
  textPrimary: "#000000",
  textSecondary: "#666666",
  primary: "#FC4C02",
  border: "#E5E5E5",
  card: "#F8F8F8",
};

export const DARK_COLORS = {
  background: "#000000",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAAAAA",
  primary: "#FC4C02",
  border: "#222222",
  card: "#111111",
};

/** Extra semantic colors (same keys in light/dark) — not duplicated in LIGHT/DARK base. */
const LIGHT_EXTRA = {
  link: "#0066CC",
  danger: "#CC0000",
  overlay: "rgba(0,0,0,0.4)",
  surface: "#FFFFFF",
  textMuted: "#888888",
  dividerStrong: "#DDDDDD",
  interactiveStrong: "#222222",
  onInteractive: "#FFFFFF",
  rowMeta: "#555555",
  placeholder: "#999999",
  neutralBorder: "#888888",
  neutralBorderSoft: "#444444",
  checkboxTrack: "#EEEEEE",
  goalRowBorder: "#D9D9D9",
  goalRowBg: "#FFFFFF",
  goalRowPressed: "#F5F5F5",
  goalRowActive: "#E8F4FF",
  goalAccent: "#0A66C2",
  goalSwipeActive: "#CDE6FF",
  goalSwipeInactive: "#EDF2F6",
  goalSwipeLabelInactive: "#6C7785",
  debugHeading: "#AA6600",
  onPrimary: "#FFFFFF",
};

const DARK_EXTRA = {
  link: "#64B5F6",
  danger: "#FF453A",
  overlay: "rgba(0,0,0,0.65)",
  surface: "#1C1C1E",
  textMuted: "#888888",
  dividerStrong: "#38383A",
  interactiveStrong: "#FFFFFF",
  onInteractive: "#000000",
  rowMeta: "#AAAAAA",
  placeholder: "#666666",
  neutralBorder: "#666666",
  neutralBorderSoft: "#888888",
  checkboxTrack: "#2C2C2E",
  goalRowBorder: "#333333",
  goalRowBg: "#111111",
  goalRowPressed: "#2C2C2E",
  goalRowActive: "#1A2A3A",
  goalAccent: "#5AC8FA",
  goalSwipeActive: "#1A3A5C",
  goalSwipeInactive: "#2C2C2E",
  goalSwipeLabelInactive: "#8E8E93",
  debugHeading: "#FFB020",
  onPrimary: "#FFFFFF",
};

/**
 * @param {boolean} isDarkMode
 * @returns {typeof LIGHT_COLORS & typeof LIGHT_EXTRA}
 */
export function getTheme(isDarkMode) {
  const base = isDarkMode ? DARK_COLORS : LIGHT_COLORS;
  const extra = isDarkMode ? DARK_EXTRA : LIGHT_EXTRA;
  return { ...base, ...extra };
}

/**
 * Legacy alias — same merged shape as `getTheme(false)`.
 * Fixes `import { COLORS } from "../utils/theme"` from older UI passes / cached bundles.
 */
export const COLORS = getTheme(false);

/**
 * Profile "Dark Mode" row `Switch` only — fixed chrome so track/thumb props do
 * not change when global theme updates mid-drag (avoids native thumb pop).
 * On-track uses app primary (identical in light/dark base palettes).
 */
export const PROFILE_DARK_MODE_SWITCH = {
  trackColor: { false: "#E9E9EA", true: LIGHT_COLORS.primary },
  thumbColor: "#FFFFFF",
  ios_backgroundColor: "#E9E9EA",
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

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
  /** Profile display name / short hero line */
  display: {
    fontSize: 22,
    fontWeight: "700",
  },
  /** Secondary lines, exercise previews, meta */
  caption: {
    fontSize: 14,
    fontWeight: "400",
  },
  /** Form field labels, small controls */
  label: {
    fontSize: 14,
    fontWeight: "600",
  },
  /** Tiny badges / swipe hints */
  overline: {
    fontSize: 12,
    fontWeight: "700",
  },
  /** Sheet titles */
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
  },
};

export const TAB_BAR = {
  labelFontSize: 12,
  labelFontWeight: "600",
  labelLetterSpacing: 0.2,
};

export const CONTENT_BOTTOM = {
  homeList: SPACING.xl * 3 + SPACING.xs,
  goalsList: SPACING.xl * 2 + SPACING.lg,
  /** Goal detail exercise list + FAB */
  goalDetailList: SPACING.xl * 2 + SPACING.lg,
};

export const DARK_MODE_STORAGE_KEY = "app_ui_dark_mode_v1";

export async function loadDarkModePreference() {
  try {
    const v = await AsyncStorage.getItem(DARK_MODE_STORAGE_KEY);
    return v === "1";
  } catch {
    return false;
  }
}

export async function saveDarkModePreference(value) {
  try {
    await AsyncStorage.setItem(DARK_MODE_STORAGE_KEY, value ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/**
 * Login / Signup form styles — uses merged theme colors from `getTheme`.
 * @param {ReturnType<typeof getTheme>} colors
 */
export function createAuthFormStyles(colors) {
  return StyleSheet.create({
    flex: {
      flex: 1,
      backgroundColor: colors.background,
    },
    container: {
      flex: 1,
      padding: SPACING.lg,
      justifyContent: "center",
    },
    label: {
      marginBottom: SPACING.sm,
      ...typography.label,
      color: colors.textPrimary,
    },
    input: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: SPACING.sm,
      paddingHorizontal: SPACING.md - SPACING.xs,
      paddingVertical: SPACING.sm + SPACING.xs,
      marginBottom: SPACING.md,
      ...typography.body,
      color: colors.textPrimary,
    },
    error: {
      color: colors.danger,
      marginBottom: SPACING.md,
    },
    primaryBtn: {
      backgroundColor: colors.interactiveStrong,
      paddingVertical: SPACING.md - SPACING.xs,
      borderRadius: SPACING.sm,
      alignItems: "center",
    },
    primaryBtnText: {
      color: colors.onInteractive,
      ...typography.body,
      fontWeight: "600",
    },
    linkWrap: {
      marginTop: SPACING.md,
      alignItems: "center",
    },
    link: {
      color: colors.link,
      ...typography.body,
    },
  });
}
