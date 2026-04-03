/**
 * GlassCard — base card component using LiquidGlassView.
 */
import React from 'react';
import {StyleSheet, ViewStyle} from 'react-native';
import {LiquidGlassView} from '@callstack/liquid-glass';
import {radius} from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  effect?: 'clear' | 'regular';
  interactive?: boolean;
}

export function GlassCard({
  children,
  style,
  effect = 'regular',
  interactive = false,
}: GlassCardProps) {
  return (
    <LiquidGlassView
      style={[styles.card, style]}
      effect={effect}
      interactive={interactive}
    >
      {children}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
});
