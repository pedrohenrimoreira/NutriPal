import { NativeTabs } from "expo-router/unstable-native-tabs";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { AppSymbol } from "../icons/AppSymbol";
import { useThemeStore } from "../../store/themeStore";
import { spacing, typography } from "../../theme";

const OPEN_TIMING = { duration: 280, easing: Easing.out(Easing.quad) };
const CLOSE_TIMING = { duration: 320, easing: Easing.inOut(Easing.quad) };

interface JournalTabAccessoryProps {
  goalsOpen?: boolean;
  onPress: () => void;
  totals: {
    calories: number;
    carbs_g: number;
    fat_g: number;
    protein_g: number;
  };
}

function MacroStat({
  color,
  isInline,
  label,
  valueColor,
  value,
}: {
  color: string;
  isInline: boolean;
  label: string;
  valueColor: string;
  value: number;
}) {
  return (
    <View style={styles.macroGroup}>
      <Text
        style={[
          styles.metricText,
          isInline && styles.metricTextInline,
          styles.macroKey,
          { color },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.metricText,
          isInline && styles.metricTextInline,
          styles.macroValue,
          { color: valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function JournalTabAccessory({
  goalsOpen = false,
  onPress,
  totals,
}: JournalTabAccessoryProps) {
  const placement = NativeTabs.BottomAccessory.usePlacement();
  const C = useThemeStore((store) => store.colors);
  const isInline = placement === "inline";
  const calories = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const protein = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);

  // Animate content to "leave" the accessory when goals opens
  // and "return" to it when goals closes — like Apple Music mini player.
  const contentAnimStyle = useAnimatedStyle(() => {
    const timing = goalsOpen ? OPEN_TIMING : CLOSE_TIMING;
    return {
      opacity: withTiming(goalsOpen ? 0 : 1, timing),
      transform: [
        { scale: withTiming(goalsOpen ? 0.82 : 1, timing) },
        { translateY: withTiming(goalsOpen ? -6 : 0, timing) },
      ],
    };
  }, [goalsOpen]);

  return (
    <Pressable
      accessibilityHint="Opens the goals sheet"
      accessibilityLabel={`Open goals. ${calories} calories, ${carbs} grams of carbs, ${protein} grams of protein, ${fat} grams of fat.`}
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.surface,
        isInline ? styles.surfaceInline : styles.surfaceRegular,
        {
          backgroundColor: "transparent",
          borderTopColor: "transparent",
          opacity: pressed ? 0.86 : 1,
        },
      ]}
    >
      <Animated.View style={[styles.row, contentAnimStyle]}>
        <View style={styles.contentGroup}>
          <View style={styles.summaryGroup}>
            <AppSymbol
              color={C.accentOrange}
              name="flame.fill"
              size={isInline ? 12 : 13}
              weight="medium"
            />
            <Text
              numberOfLines={1}
              style={[
                styles.caloriesLabel,
                isInline && styles.caloriesLabelInline,
                { color: C.textPrimary },
              ]}
            >
              {calories.toLocaleString("en-US")} cal
            </Text>
          </View>

          <View style={styles.macrosRow}>
            <MacroStat
              color={C.carbs}
              isInline={isInline}
              label="C"
              value={carbs}
              valueColor={C.textPrimary}
            />
            <MacroStat
              color={C.protein}
              isInline={isInline}
              label="P"
              value={protein}
              valueColor={C.textPrimary}
            />
            <MacroStat
              color={C.fat}
              isInline={isInline}
              label="F"
              value={fat}
              valueColor={C.textPrimary}
            />
          </View>

          <AppSymbol
            color={C.textTertiary}
            name="chevron.up"
            size={isInline ? 11 : 12}
            weight="semibold"
          />
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  surface: {
    justifyContent: "center",
    width: "100%",
  },
  surfaceRegular: {
    minHeight: 42,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  surfaceInline: {
    minHeight: 32,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "100%",
  },
  contentGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  summaryGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 1,
    justifyContent: "center",
  },
  caloriesLabel: {
    ...typography.subhead,
    fontWeight: "700",
    includeFontPadding: false,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  caloriesLabelInline: {
    fontSize: 13,
    lineHeight: 14,
  },
  macrosRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm + 2,
    justifyContent: "center",
  },
  macroGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  metricText: {
    ...typography.subhead,
    includeFontPadding: false,
    lineHeight: 16,
  },
  metricTextInline: {
    fontSize: 13,
    lineHeight: 14,
  },
  macroKey: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  macroValue: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
});

export default JournalTabAccessory;
