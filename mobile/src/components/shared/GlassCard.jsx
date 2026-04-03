/**
 * GlassCard — base card component using GlassView.
 */
import React from "react";
import { StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { radius } from "../../theme";

export function GlassCard({ children, style, interactive = false }) {
  return (
    <GlassView
      isInteractive={interactive}
      style={[
        styles.card,
        isLiquidGlassAvailable()
          ? {}
          : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
        style,
      ]}
    >
      {children}
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
});
