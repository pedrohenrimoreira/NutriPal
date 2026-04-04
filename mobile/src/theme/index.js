/**
 * NutriPal design tokens — dark / light color system.
 *
 * Dark: soft graphite, not pure black.
 * Light: warm pastel inspired by #80694f.
 *
 * Backward-compatible — `colors` still exports dark palette.
 * For reactive theme switching, use the `useThemeColors` hook.
 */
import { StyleSheet, useColorScheme } from "react-native";

const darkColors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  bgPrimary:   "#141414",
  bgSecondary: "#1e1e1e",
  bgTertiary:  "#272727",

  // ── System grays (iOS dark) ────────────────────────────────────────────────
  systemGray:  "#8e8e93",
  systemGray2: "#636366",
  systemGray3: "#48484a",
  systemGray4: "#3a3a3c",
  systemGray5: "#2c2c2e",
  systemGray6: "#1c1c1e",

  // ── Separators ───────────────────────────────────────────────────────────
  separator:       "rgba(255,255,255,0.08)",
  separatorOpaque: "#2e2e30",

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   "#f5f5f5",
  textSecondary: "#8e8e93",
  textTertiary:  "#48484a",

  // ── Accents ──────────────────────────────────────────────────────────────
  accentOrange: "#f97316",
  accentGreen:  "#22c55e",
  accentBlue:   "#3b82f6",
  accentPurple: "#a855f7",
  accentRed:    "#ef4444",
  accentCyan:   "#06b6d4",
  accentPink:   "#ec4899",
  accentYellow: "#eab308",

  // ── Liquid glass ─────────────────────────────────────────────────────────
  glassBg:       "rgba(255,255,255,0.08)",
  glassBgHover:  "rgba(255,255,255,0.13)",
  glassBorder:   "rgba(255,255,255,0.12)",
  glassDeep:     "rgba(255,255,255,0.05)",

  // ── Macros ────────────────────────────────────────────────────────────────
  carbs:   "#06b6d4",
  protein: "#a855f7",
  fat:     "#eab308",
};

const lightColors = {
  // ── Surfaces — warm pastel inspired by #80694f ────────────────────────────
  bgPrimary:   "#f5f0e8",   // warm cream canvas
  bgSecondary: "#ebe4d8",   // slightly deeper warm
  bgTertiary:  "#e0d7c8",   // elevated warm

  // ── System grays (iOS light, warm-shifted) ────────────────────────────────
  systemGray:  "#8e8e93",
  systemGray2: "#aeaeb2",
  systemGray3: "#c7c7cc",
  systemGray4: "#d1d1d6",
  systemGray5: "#e5e5ea",
  systemGray6: "#f2f2f7",

  // ── Separators ───────────────────────────────────────────────────────────
  separator:       "rgba(0,0,0,0.08)",
  separatorOpaque: "#d6cfc3",

  // ── Text ─────────────────────────────────────────────────────────────────
  textPrimary:   "#1c1a16",
  textSecondary: "#6b6560",
  textTertiary:  "#a09888",

  // ── Accents (same vibrant accents work on light) ─────────────────────────
  accentOrange: "#e86a0a",
  accentGreen:  "#16a34a",
  accentBlue:   "#2563eb",
  accentPurple: "#9333ea",
  accentRed:    "#dc2626",
  accentCyan:   "#0891b2",
  accentPink:   "#db2777",
  accentYellow: "#ca8a04",

  // ── Liquid glass (dark tint on light background) ─────────────────────────
  glassBg:       "rgba(0,0,0,0.05)",
  glassBgHover:  "rgba(0,0,0,0.08)",
  glassBorder:   "rgba(0,0,0,0.10)",
  glassDeep:     "rgba(0,0,0,0.03)",

  // ── Macros ────────────────────────────────────────────────────────────────
  carbs:   "#0891b2",
  protein: "#9333ea",
  fat:     "#ca8a04",
};

// Default export for backward compatibility — dark mode
export const colors = darkColors;

// Hook for components that need reactive theme switching
export function useThemeColors() {
  const scheme = useColorScheme();
  return scheme === "light" ? lightColors : darkColors;
}

// Direct access
export { darkColors, lightColors };

export const spacing = {
  xs:  4,
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  xxl: 24,
};

export const radius = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  26,
  full: 9999,
};

export const typography = StyleSheet.create({
  largeTitle: {
    fontSize: 34, fontWeight: "700",
    letterSpacing: 0.37, color: colors.textPrimary,
  },
  title1: {
    fontSize: 28, fontWeight: "700",
    letterSpacing: 0.36, color: colors.textPrimary,
  },
  title2: {
    fontSize: 22, fontWeight: "700",
    letterSpacing: 0.35, color: colors.textPrimary,
  },
  title3: {
    fontSize: 20, fontWeight: "600",
    letterSpacing: 0.38, color: colors.textPrimary,
  },
  headline: {
    fontSize: 17, fontWeight: "600",
    letterSpacing: -0.41, color: colors.textPrimary,
  },
  body: {
    fontSize: 17, fontWeight: "400",
    letterSpacing: -0.41, color: colors.textPrimary,
  },
  callout: {
    fontSize: 16, fontWeight: "400",
    letterSpacing: -0.32, color: colors.textPrimary,
  },
  subhead: {
    fontSize: 15, fontWeight: "400",
    letterSpacing: -0.24, color: colors.textPrimary,
  },
  footnote: {
    fontSize: 13, fontWeight: "400",
    letterSpacing: -0.08, color: colors.textSecondary,
  },
  caption1: {
    fontSize: 12, fontWeight: "400",
    letterSpacing: 0, color: colors.textSecondary,
  },
  caption2: {
    fontSize: 11, fontWeight: "400",
    letterSpacing: 0.07, color: colors.textTertiary,
  },
});
