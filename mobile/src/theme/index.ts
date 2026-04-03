import {StyleSheet} from 'react-native';

export const colors = {
  // iOS 26 dark system colors
  bgPrimary: '#000000',
  bgSecondary: '#1c1c1e',
  bgTertiary: '#2c2c2e',

  // System grays (dark mode)
  systemGray: '#8e8e93',
  systemGray2: '#636366',
  systemGray3: '#48484a',
  systemGray4: '#3a3a3c',
  systemGray5: '#2c2c2e',
  systemGray6: '#1c1c1e',

  // Separators
  separator: 'rgba(255,255,255,0.15)',
  separatorOpaque: '#38383a',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#8e8e93',
  textTertiary: '#48484a',

  // Accents
  accentOrange: '#f97316',
  accentGreen: '#22c55e',
  accentBlue: '#3b82f6',
  accentPurple: '#a855f7',
  accentRed: '#ef4444',
  accentCyan: '#06b6d4',
  accentPink: '#ec4899',
  accentYellow: '#eab308',

  // Glass
  glassBg: 'rgba(255,255,255,0.06)',
  glassBgHover: 'rgba(255,255,255,0.10)',
  glassBorder: 'rgba(255,255,255,0.10)',

  // Macros
  carbs: '#06b6d4',
  protein: '#a855f7',
  fat: '#eab308',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const typography = StyleSheet.create({
  largeTitle: {
    fontSize: 34,
    fontWeight: '700',
    letterSpacing: 0.37,
    color: colors.textPrimary,
  },
  title1: {
    fontSize: 28,
    fontWeight: '700',
    letterSpacing: 0.36,
    color: colors.textPrimary,
  },
  title2: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: 0.35,
    color: colors.textPrimary,
  },
  title3: {
    fontSize: 20,
    fontWeight: '600',
    letterSpacing: 0.38,
    color: colors.textPrimary,
  },
  headline: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.41,
    color: colors.textPrimary,
  },
  body: {
    fontSize: 17,
    fontWeight: '400',
    letterSpacing: -0.41,
    color: colors.textPrimary,
  },
  callout: {
    fontSize: 16,
    fontWeight: '400',
    letterSpacing: -0.32,
    color: colors.textPrimary,
  },
  subhead: {
    fontSize: 15,
    fontWeight: '400',
    letterSpacing: -0.24,
    color: colors.textPrimary,
  },
  footnote: {
    fontSize: 13,
    fontWeight: '400',
    letterSpacing: -0.08,
    color: colors.textSecondary,
  },
  caption1: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0,
    color: colors.textSecondary,
  },
  caption2: {
    fontSize: 11,
    fontWeight: '400',
    letterSpacing: 0.07,
    color: colors.textTertiary,
  },
});
