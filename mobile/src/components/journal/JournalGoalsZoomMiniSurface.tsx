import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Link } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { AppSymbol } from "../icons/AppSymbol";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";

const OPEN_TIMING = { duration: 260, easing: Easing.out(Easing.quad) };
const CLOSE_TIMING = { duration: 300, easing: Easing.inOut(Easing.quad) };

interface JournalGoalsZoomMiniSurfaceProps {
  goalsOpen?: boolean;
  href: "/goals-zoom" | "/journal/goals-zoom" | "/(tabs)/(journal)/goals-zoom";
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
  label,
  value,
  valueColor,
}: {
  color: string;
  label: string;
  value: number;
  valueColor: string;
}) {
  return (
    <View style={styles.macroGroup}>
      <Text style={[styles.metricText, styles.macroKey, { color }]}>{label}</Text>
      <Text style={[styles.metricText, styles.macroValue, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export function JournalGoalsZoomMiniSurface({
  goalsOpen = false,
  href,
  onPress,
  totals,
}: JournalGoalsZoomMiniSurfaceProps) {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const calories = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const protein = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);
  const useGlass = isLiquidGlassAvailable();
  const fallbackTone = colorMode === "dark"
    ? "rgba(32,32,34,0.92)"
    : "rgba(244,239,229,0.96)";
  const fallbackSurfaceStyle = StyleSheet.flatten([
    styles.surfaceFallback,
    {
      backgroundColor: fallbackTone,
      borderColor: C.separator,
    },
  ]);

  const contentAnimStyle = useAnimatedStyle(() => {
    const timing = goalsOpen ? OPEN_TIMING : CLOSE_TIMING;
    return {
      opacity: withTiming(goalsOpen ? 0 : 1, timing),
      transform: [
        { scale: withTiming(goalsOpen ? 0.9 : 1, timing) } as const,
        { translateY: withTiming(goalsOpen ? -10 : 0, timing) } as const,
      ],
    } as const;
  }, [goalsOpen]);

  const content = (
    <View collapsable={false} style={styles.zoomSource}>
      <Animated.View style={[styles.row, contentAnimStyle]}>
        <View style={styles.summaryGroup}>
          <AppSymbol
            color={C.accentOrange}
            name="flame.fill"
            size={13}
            weight="medium"
          />
          <Text style={[styles.caloriesLabel, { color: C.textPrimary }]}>
            {calories.toLocaleString("en-US")} cal
          </Text>
        </View>

        <View style={styles.macrosRow}>
          <MacroStat
            color={C.carbs}
            label="C"
            value={carbs}
            valueColor={C.textPrimary}
          />
          <MacroStat
            color={C.protein}
            label="P"
            value={protein}
            valueColor={C.textPrimary}
          />
          <MacroStat
            color={C.fat}
            label="F"
            value={fat}
            valueColor={C.textPrimary}
          />
        </View>

        <AppSymbol
          color={C.textTertiary}
          name="chevron.up"
          size={12}
          weight="semibold"
        />
      </Animated.View>
    </View>
  );

  return (
    <Link asChild href={href}>
      <Pressable
        accessibilityHint="Opens the goals sheet"
        accessibilityLabel={`Open goals. ${calories} calories, ${carbs} grams of carbs, ${protein} grams of protein, ${fat} grams of fat.`}
        accessibilityRole="button"
        hitSlop={8}
        onPressIn={onPress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressablePressed,
        ]}
      >
        <Link.AppleZoom>
          {useGlass ? (
            <GlassView isInteractive={false} style={styles.surfaceGlass}>
              {content}
            </GlassView>
          ) : (
            <View style={fallbackSurfaceStyle}>
              {content}
            </View>
          )}
        </Link.AppleZoom>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  pressable: {
    alignSelf: "center",
    borderRadius: radius.full,
    overflow: "hidden",
    width: "100%",
  },
  pressablePressed: {
    opacity: 0.94,
    transform: [{ scale: 0.988 }],
  },
  surfaceGlass: {
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: radius.full,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 6,
  },
  surfaceFallback: {
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 6,
  },
  zoomSource: {
    width: "100%",
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.lg,
    justifyContent: "center",
  },
  summaryGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 1,
  },
  macrosRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm + 2,
  },
  macroGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  caloriesLabel: {
    ...typography.subhead,
    fontWeight: "700",
    includeFontPadding: false,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  metricText: {
    ...typography.subhead,
    fontWeight: "700",
    includeFontPadding: false,
    letterSpacing: -0.2,
    lineHeight: 16,
  },
  macroKey: {},
  macroValue: {},
});

export default JournalGoalsZoomMiniSurface;
