/**
 * GlassPill — rounded pill button using LiquidGlassView.
 * Used for the header date pill, streak pill, etc.
 */
import React from 'react';
import {TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle} from 'react-native';
import {LiquidGlassView} from '@callstack/liquid-glass';
import {colors, radius, spacing} from '../../theme';

interface GlassPillProps {
  label: string;
  onPress?: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  effect?: 'clear' | 'regular';
}

export function GlassPill({
  label,
  onPress,
  style,
  textStyle,
  effect = 'regular',
}: GlassPillProps) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <LiquidGlassView
        style={[styles.pill, style]}
        effect={effect}
      >
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </LiquidGlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
