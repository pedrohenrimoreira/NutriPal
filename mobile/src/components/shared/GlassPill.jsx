/**
 * GlassPill — rounded pill button using GlassView.
 * Used for the header date pill, streak pill, etc.
 */
import React from "react";
import { TouchableOpacity, Text, StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, radius, spacing } from "../../theme";

export function GlassPill({ label, onPress, style, textStyle }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <GlassView
        isInteractive={true}
        style={[
          styles.pill,
          isLiquidGlassAvailable()
            ? {}
            : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
          style,
        ]}
      >
        <Text style={[styles.label, textStyle]}>{label}</Text>
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 15,
    fontWeight: "600",
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
});
