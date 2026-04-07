import React, { useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
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

export function JournalSummaryBar({
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
      <TouchableOpacity
        onPress={onToggleGoals}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel="Expandir metas"
        style={styles.pressable}
      >
        <GlassView
          isInteractive
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
            <Text style={[styles.value, { color: C.textPrimary }]}>
              {protein}
            </Text>
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
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryWrapper: {
    alignItems: "center",
    paddingVertical: spacing.md + 4,
    paddingBottom: spacing.xl + 4,
  },
  pressable: {
    borderRadius: radius.full,
    overflow: "hidden",
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl + 8,
    paddingVertical: spacing.sm + 7,
    borderRadius: radius.full,
    overflow: "hidden",
    gap: spacing.sm + 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 5,
  },
  group: {
    flexDirection: "row",
    alignItems: "center",
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
