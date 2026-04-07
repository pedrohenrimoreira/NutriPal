import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useThemeStore } from "../../store/themeStore";
import { spacing, typography } from "../../theme";
import { ThinkingShimmer } from "./ThinkingShimmer";

/**
 * Inline per-line annotation row.
 *
 * States:
 *   - thinking: shows animated ThinkingShimmer
 *   - ready:    shows grouped kcal + macro chips + compact source count
 *   - error:    shows "No match"
 */
export function LineAnnotationRow({ annotation, onPressSources }) {
  const C = useThemeStore((s) => s.colors);

  if (!annotation) return null;

  const { type } = annotation;

  // --- Thinking state ---
  if (type === "thinking") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(120)}
        style={styles.row}
      >
        <ThinkingShimmer />
      </Animated.View>
    );
  }

  // --- Error state ---
  if (type === "error") {
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(120)}
        style={styles.row}
      >
        <Text style={[styles.errorText, { color: C.accentRed }]}>No match</Text>
      </Animated.View>
    );
  }

  // --- Ready state ---
  if (type !== "ready") return null;

  const calories = Math.round(annotation.totals?.calories ?? 0);
  const protein = Math.round(annotation.totals?.protein_g ?? 0);
  const carbs = Math.round(annotation.totals?.carbs_g ?? 0);
  const fat = Math.round(annotation.totals?.fat_g ?? 0);
  const items = annotation.items ?? [];
  const sources = annotation.sources ?? [];
  const sourceCount = sources.length;

  return (
    <Animated.View
      entering={FadeIn.duration(220)}
      exiting={FadeOut.duration(120)}
      style={styles.row}
    >
      {/* Left: calories + item names */}
      <View style={styles.mainContent}>
        <View style={styles.topRow}>
          <Text style={[styles.caloriesText, { color: C.textPrimary }]}>
            {calories} kcal
          </Text>
          <View style={styles.macroRow}>
            <Text style={[styles.macroText, { color: C.protein }]}>P {protein}g</Text>
            <Text style={[styles.macroDot, { color: C.textTertiary }]}>&middot;</Text>
            <Text style={[styles.macroText, { color: C.carbs }]}>C {carbs}g</Text>
            <Text style={[styles.macroDot, { color: C.textTertiary }]}>&middot;</Text>
            <Text style={[styles.macroText, { color: C.fat }]}>F {fat}g</Text>
          </View>
        </View>

        {items.length > 1 ? (
          <Text style={[styles.itemsText, { color: C.textSecondary }]} numberOfLines={1}>
            {items.map((item) => item.name).join(" + ")}
          </Text>
        ) : null}
      </View>

      {/* Right: compact sources badge */}
      {sourceCount > 0 ? (
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => onPressSources?.(annotation)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={[styles.sourcesText, { color: C.accentBlue }]}>
            {sourceCount} {sourceCount === 1 ? "source" : "sources"}
          </Text>
        </TouchableOpacity>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: 24,
    paddingVertical: 3,
    gap: spacing.sm,
  },
  mainContent: {
    flex: 1,
    gap: 2,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  caloriesText: {
    ...typography.footnote,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  macroText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  macroDot: {
    fontSize: 11,
    lineHeight: 14,
  },
  itemsText: {
    ...typography.caption1,
    letterSpacing: -0.08,
  },
  errorText: {
    ...typography.footnote,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: -0.08,
  },
  sourcesText: {
    ...typography.caption1,
    fontWeight: "600",
    letterSpacing: -0.08,
  },
});
