import React, { useEffect } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from "react-native";
import { GlassView } from "expo-glass-effect";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius } from "../../theme";

/**
 * Legacy nutrition bar preserved for quick restore.
 *
 * This was the previous single-pill format where the whole nutrition bar
 * doubled as the Goals trigger. It is intentionally inactive.
 */
export function LegacyJournalSummaryBar({
  triggerRef,
  totals,
  goalsExpanded,
  onToggleGoals,
}) {
  const C = useThemeStore((s) => s.colors);
  const colorMode = useThemeStore((s) => s.colorMode);
  const scale = useSharedValue(1);
  const calories = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const protein = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);
  const surfaceTone = colorMode === "dark"
    ? "rgba(44,44,46,0.84)"
    : "rgba(235,228,216,0.90)";
  const surfaceBorder = colorMode === "dark"
    ? "rgba(255,255,255,0.16)"
    : "rgba(255,255,255,0.54)";

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.02, { duration: 140 }),
      withSpring(1, { damping: 14, stiffness: 220 }),
    );
  }, [calories, carbs, protein, fat, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.summaryWrapper, animatedStyle]}>
      <View
        collapsable={false}
        ref={triggerRef}
      >
        <Pressable
          accessibilityLabel="Expand goals"
          accessibilityRole="button"
          onPress={onToggleGoals}
          style={({ pressed }) => [
            styles.pressable,
            pressed && styles.pressablePressed,
          ]}
        >
          <GlassView
            isInteractive={false}
            style={[
              styles.summaryPill,
              {
                backgroundColor: surfaceTone,
                borderColor: surfaceBorder,
              },
            ]}
          >
            <View style={styles.group}>
              <Text style={styles.flame}>{"\u{1F525}"}</Text>
              <Text style={[styles.value, { color: C.accentOrange }]}>
                {calories}
              </Text>
            </View>

            <Text style={[styles.dot, { color: C.textTertiary }]}>{"\u00B7"}</Text>

            <View style={styles.group}>
              <Text style={[styles.letter, { color: C.carbs }]}>C</Text>
              <Text style={[styles.value, { color: C.textPrimary }]}>{carbs}</Text>
            </View>

            <Text style={[styles.dot, { color: C.textTertiary }]}>{"\u00B7"}</Text>

            <View style={styles.group}>
              <Text style={[styles.letter, { color: C.protein }]}>P</Text>
              <Text style={[styles.value, { color: C.textPrimary }]}>{protein}</Text>
            </View>

            <Text style={[styles.dot, { color: C.textTertiary }]}>{"\u00B7"}</Text>

            <View style={styles.group}>
              <Text style={[styles.letter, { color: C.fat }]}>F</Text>
              <Text style={[styles.value, { color: C.textPrimary }]}>{fat}</Text>
            </View>

            <Text
              style={[
                styles.chevron,
                { color: C.textTertiary },
                goalsExpanded && styles.chevronUp,
              ]}
            >
              {"\u2303"}
            </Text>
          </GlassView>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryWrapper: {
    alignItems: "center",
    paddingBottom: spacing.xl + 4,
    paddingVertical: spacing.md + 4,
  },
  pressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  pressablePressed: {
    transform: [{ scale: 0.985 }],
  },
  summaryPill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 5,
    flexDirection: "row",
    gap: spacing.sm + 2,
    overflow: "hidden",
    paddingHorizontal: spacing.xl + 8,
    paddingVertical: spacing.sm + 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
  },
  group: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  flame: {
    fontSize: 16,
  },
  letter: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  value: {
    fontSize: 15,
    fontWeight: "600",
    letterSpacing: -0.3,
  },
  dot: {
    fontSize: 14,
  },
  chevron: {
    fontSize: 13,
    marginLeft: spacing.xs,
    transform: [{ rotate: "180deg" }],
  },
  chevronUp: {
    transform: [{ rotate: "0deg" }],
  },
});

export default LegacyJournalSummaryBar;
