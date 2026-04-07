import React from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";

import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";

export const journalGlassPresets = {
  surface: {
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    blurIntensity: 28,
    androidBlurIntensity: 16,
    tintOpacity: 0.14,
    borderOpacity: 0.14,
    highlightOpacity: 0.12,
    fallbackOpacity: 0.10,
  },
  pill: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    blurIntensity: 24,
    androidBlurIntensity: 14,
    tintOpacity: 0.12,
    borderOpacity: 0.16,
    highlightOpacity: 0.10,
    fallbackOpacity: 0.10,
  },
  compact: {
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    blurIntensity: 22,
    androidBlurIntensity: 12,
    tintOpacity: 0.10,
    borderOpacity: 0.12,
    highlightOpacity: 0.10,
    fallbackOpacity: 0.08,
  },
  button: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    blurIntensity: 30,
    androidBlurIntensity: 16,
    tintOpacity: 0.14,
    borderOpacity: 0.16,
    highlightOpacity: 0.12,
    fallbackOpacity: 0.12,
  },
  chip: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
    blurIntensity: 20,
    androidBlurIntensity: 10,
    tintOpacity: 0.10,
    borderOpacity: 0.12,
    highlightOpacity: 0.08,
    fallbackOpacity: 0.08,
  },
};

function getVariantTokens(variant) {
  return journalGlassPresets[variant] ?? journalGlassPresets.surface;
}

function useGlassColors() {
  return useThemeStore((state) => state.colors);
}

function resolveSurfaceTone(colors) {
  return colors.bgPrimary?.toLowerCase?.()?.startsWith("#f") ? "light" : "dark";
}

export function JournalGlassSurface({
  children,
  variant = "surface",
  style,
  contentStyle,
  tintColor,
  borderColor,
  highlightColor,
  fallbackColor,
  blurIntensity,
  androidBlurIntensity,
  onPress,
  onLongPress,
  disabled = false,
  pressScale = 0.98,
  pressOpacity = 0.98,
  pointerEvents,
  accessibilityRole,
  accessibilityLabel,
  testID,
}) {
  const C = useGlassColors();
  const preset = getVariantTokens(variant);
  const tone = resolveSurfaceTone(C);

  const resolvedTintColor = tintColor ?? (tone === "light" ? "rgba(255,255,255,1)" : "rgba(255,255,255,1)");
  const resolvedBorderColor = borderColor ?? C.glassBorder;
  const resolvedHighlightColor = highlightColor ?? (tone === "light" ? "rgba(255,255,255,0.62)" : "rgba(255,255,255,0.22)");
  const resolvedFallbackColor = fallbackColor ?? C.glassBg;
  const isInteractive = Boolean(onPress || onLongPress);
  const useNativeBlur = Platform.OS !== "web";

  const glassLayers = (
    <View style={[styles.mask, { borderRadius: preset.borderRadius }]}>
      {useNativeBlur ? (
        <BlurView
          intensity={Platform.OS === "android" ? (androidBlurIntensity ?? preset.androidBlurIntensity) : (blurIntensity ?? preset.blurIntensity)}
          tint={tone}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        pointerEvents="none"
        style={[
          styles.tint,
          {
            backgroundColor: resolvedTintColor,
            opacity: Platform.OS === "android" ? preset.fallbackOpacity : preset.tintOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.border,
          {
            borderColor: resolvedBorderColor,
            opacity: preset.borderOpacity,
          },
        ]}
      />
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          {
            backgroundColor: resolvedHighlightColor,
            opacity: preset.highlightOpacity,
          },
        ]}
      />
      <View style={[styles.content, { paddingHorizontal: preset.paddingHorizontal, paddingVertical: preset.paddingVertical }, contentStyle]}>
        {children}
      </View>
    </View>
  );

  if (isInteractive) {
    return (
      <Pressable
        onPress={onPress}
        onLongPress={onLongPress}
        disabled={disabled}
        pointerEvents={pointerEvents}
        accessibilityRole={accessibilityRole}
        accessibilityLabel={accessibilityLabel}
        testID={testID}
        style={({ pressed }) => [
          styles.container,
          {
            borderRadius: preset.borderRadius,
            backgroundColor: Platform.OS === "android" ? resolvedFallbackColor : "transparent",
            opacity: pressed ? pressOpacity : 1,
            transform: pressed ? [{ scale: pressScale }] : undefined,
          },
          style,
        ]}
      >
        {glassLayers}
      </Pressable>
    );
  }

  return (
    <View
      pointerEvents={pointerEvents}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={[
        styles.container,
        {
          borderRadius: preset.borderRadius,
          backgroundColor: Platform.OS === "android" ? resolvedFallbackColor : "transparent",
        },
        style,
      ]}
    >
      {glassLayers}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  mask: {
    overflow: "hidden",
  },
  tint: {
    ...StyleSheet.absoluteFillObject,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
  },
  highlight: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "38%",
  },
  content: {
    position: "relative",
    zIndex: 1,
  },
});

export default JournalGlassSurface;
