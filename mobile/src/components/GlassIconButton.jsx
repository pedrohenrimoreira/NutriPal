import React from "react";
import {
  Platform,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { SymbolView } from "expo-symbols";
import { useThemeStore } from "../store/themeStore";

const glass = (fallback) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

function resolveFallbackBackground({ colorMode, tone }) {
  if (tone === "destructive") {
    return colorMode === "dark"
      ? "rgba(127,29,29,0.26)"
      : "rgba(220,38,38,0.12)";
  }
  return "rgba(255,255,255,0.10)";
}

function resolveBorderColor({ colorMode, colors, tone, active }) {
  if (tone === "destructive") {
    return colorMode === "dark"
      ? "rgba(248,113,113,0.24)"
      : "rgba(220,38,38,0.18)";
  }

  if (active) {
    return colorMode === "dark"
      ? "rgba(255,255,255,0.20)"
      : "rgba(255,255,255,0.58)";
  }

  return colors.glassBorder;
}

export function GlassIconButton({
  onPress,
  accessibilityLabel,
  symbolName,
  fallbackIconName,
  color,
  size = 36,
  iconSize = 16,
  style = undefined,
  glassStyle = undefined,
  tone = "default",
  active = false,
  disabled = false,
  hitSlop = { top: 8, bottom: 8, left: 8, right: 8 },
}) {
  const colors = useThemeStore((state) => state.colors);
  const colorMode = useThemeStore((state) => state.colorMode);
  const resolvedColor = color ?? (tone === "destructive" ? colors.accentRed : colors.textSecondary);
  const fallbackBg = resolveFallbackBackground({ colorMode, tone });
  const borderColor = resolveBorderColor({ colorMode, colors, tone, active });

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={hitSlop}
      style={[
        styles.touchable,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <GlassView
        isInteractive
        style={[
          styles.glass,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor,
          },
          glass(fallbackBg),
          active && styles.glassActive,
          glassStyle,
        ]}
      >
        {Platform.OS === "ios" && symbolName ? (
          <SymbolView
            name={symbolName}
            type="monochrome"
            tintColor={resolvedColor}
            style={{ width: iconSize + 2, height: iconSize + 2 }}
          />
        ) : (
          <Ionicons
            name={fallbackIconName ?? "ellipse"}
            size={iconSize}
            color={resolvedColor}
          />
        )}
      </GlassView>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: {
    overflow: "visible",
  },
  glass: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderCurve: "continuous",
  },
  glassActive: {
    transform: [{ scale: 1.01 }],
  },
});

export default GlassIconButton;
