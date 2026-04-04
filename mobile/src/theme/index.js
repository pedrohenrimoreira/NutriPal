/**
 * NutriPal design tokens — dark graphite system.
 *
 * Key principle: soft graphite, not pure black.
 * Surfaces build depth through incremental lightness steps.
 */
import { StyleSheet } from "react-native";

export const colors = {
  // ── Surfaces ──────────────────────────────────────────────────────────────
  bgPrimary:   "#141414",   // base canvas — dark graphite (not #000)
  bgSecondary: "#1e1e1e",   // cards, sheets — one step lighter
  bgTertiary:  "#272727",   // elevated modals, contextual layers

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
  // Slightly more visible than before so glass reads against graphite base.
  glassBg:       "rgba(255,255,255,0.08)",
  glassBgHover:  "rgba(255,255,255,0.13)",
  glassBorder:   "rgba(255,255,255,0.12)",
  glassDeep:     "rgba(255,255,255,0.05)",   // subtler inset fill

  // ── Macros ────────────────────────────────────────────────────────────────
  carbs:   "#06b6d4",
  protein: "#a855f7",
  fat:     "#eab308",
};

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
