import { Link } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSymbol } from "../icons/AppSymbol";
import { useThemeStore } from "../../store/themeStore";
import { spacing, typography } from "../../theme";
import {
  journalGoalsZoomRoute,
  usesJournalGoalsAccessoryAppleZoom,
} from "../../utils/iosNavigation";
import { getGoalsZoomAlignmentRect } from "../../utils/goalsZoomSheet";
import journalHaptics from "../../utils/journalHaptics";

const OPEN_TIMING = { duration: 220, easing: Easing.out(Easing.quad) };
const CLOSE_TIMING = { duration: 180, easing: Easing.out(Easing.cubic) };
const SURFACE_SPRING = { damping: 20, mass: 0.8, stiffness: 220 };

interface JournalTabAccessoryProps {
  displayMode?: "compact" | "regular";
  interactionDisabled?: boolean;
  goalsOpen?: boolean;
  onPress: () => void;
  totals: {
    calories: number;
    carbs_g: number;
    fat_g: number;
    protein_g: number;
  };
}

interface JournalTabAccessorySurfaceProps extends JournalTabAccessoryProps {
  placement: "inline" | "regular";
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
    <View style={[styles.macroGroup, isInline && styles.macroGroupInline]}>
      <View style={[styles.metricToken, isInline && styles.metricTokenInline]}>
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
      </View>
      <View style={[styles.metricToken, isInline && styles.metricTokenInline]}>
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
    </View>
  );
}

export function JournalTabAccessorySurface({
  displayMode = "regular",
  interactionDisabled = false,
  goalsOpen = false,
  onPress,
  placement,
  totals,
}: JournalTabAccessorySurfaceProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight, width: windowWidth } = useWindowDimensions();
  const C = useThemeStore((store) => store.colors);
  const isInline = placement === "inline";
  const isCompactMode = displayMode === "compact";
  const useInlineMetrics = isInline || isCompactMode;
  const calories = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const protein = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);
  const shouldUseAppleZoom = usesJournalGoalsAccessoryAppleZoom && !isInline;
  const compactRegularWidth = Math.min(Math.max(windowWidth * 0.6, 224), 292);
  const appleZoomAlignmentRect = useMemo(() => getGoalsZoomAlignmentRect({
    topInset: insets.top,
    windowHeight,
    windowWidth,
  }), [insets.top, windowHeight, windowWidth]);

  const contentAnimStyle = useAnimatedStyle(() => {
    if (!shouldUseAppleZoom) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateY: 0 }],
      } as const;
    }

    const timing = goalsOpen ? OPEN_TIMING : CLOSE_TIMING;
    return {
      opacity: withTiming(goalsOpen ? 0 : 1, timing),
      transform: [
        { scale: withTiming(goalsOpen ? 0.88 : 1, timing) } as const,
        { translateY: withTiming(goalsOpen ? -4 : 0, timing) } as const,
      ],
    } as const;
  }, [goalsOpen, shouldUseAppleZoom]);

  const surfaceAnimStyle = useAnimatedStyle(() => {
    if (!goalsOpen) {
      return {
        opacity: 1,
        transform: [{ scale: 1 }, { translateY: 0 }],
      } as const;
    }

    return {
      opacity: withTiming(0.14, OPEN_TIMING),
      transform: [
        { scale: withSpring(0.965, SURFACE_SPRING) } as const,
        { translateY: withSpring(8, SURFACE_SPRING) } as const,
      ],
    } as const;
  }, [goalsOpen]);

  const content = (
    <Animated.View
      style={[
        styles.row,
        useInlineMetrics && styles.rowInline,
        isCompactMode && styles.rowCompact,
        contentAnimStyle,
      ]}
    >
      <View style={styles.contentGroup}>
        <View style={[styles.summaryGroup, useInlineMetrics && styles.summaryGroupInline]}>
          <View style={[styles.iconWrap, useInlineMetrics && styles.iconWrapInline]}>
            <AppSymbol
              color={C.accentOrange}
              name="flame.fill"
              size={useInlineMetrics ? 12 : 13}
              weight="medium"
            />
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.caloriesLabel,
              useInlineMetrics && styles.caloriesLabelInline,
              { color: C.textPrimary },
            ]}
          >
            {calories.toLocaleString("en-US")} cal
          </Text>
        </View>

        <View style={[styles.macrosRow, useInlineMetrics && styles.macrosRowInline]}>
          <MacroStat
            color={C.carbs}
            isInline={useInlineMetrics}
            label="C"
            value={carbs}
            valueColor={C.textPrimary}
          />
          <MacroStat
            color={C.protein}
            isInline={useInlineMetrics}
            label="P"
            value={protein}
            valueColor={C.textPrimary}
          />
          <MacroStat
            color={C.fat}
            isInline={useInlineMetrics}
            label="F"
            value={fat}
            valueColor={C.textPrimary}
          />
        </View>

        <View style={[styles.chevronWrap, useInlineMetrics && styles.chevronWrapInline]}>
          <AppSymbol
            color={C.textTertiary}
            name="chevron.up"
            size={useInlineMetrics ? 11 : 12}
            weight="semibold"
          />
        </View>
      </View>
    </Animated.View>
  );

  const surfaceStyle = StyleSheet.flatten([
    styles.surfaceBase,
    useInlineMetrics ? styles.surfaceInline : styles.surfaceRegular,
    isCompactMode && styles.surfaceCompact,
    isCompactMode && !isInline ? { width: compactRegularWidth } : null,
  ]);

  const zoomSurfaceStyle = StyleSheet.flatten([
    surfaceStyle,
    styles.surfaceZoom,
  ]);
  const contentShellStyle = StyleSheet.flatten([
    styles.contentShell,
    useInlineMetrics ? styles.contentShellInline : styles.contentShellRegular,
    isCompactMode && styles.contentShellCompact,
    isCompactMode && !isInline ? { width: compactRegularWidth } : null,
  ]);
  const contentOffsetStyle = StyleSheet.flatten([
    styles.contentOffset,
    useInlineMetrics ? styles.contentOffsetInline : styles.contentOffsetRegular,
  ]);

  const regularSurfaceContent = (
    <View style={contentShellStyle}>
      <View collapsable={false} style={zoomSurfaceStyle}>
        <View style={contentOffsetStyle}>
          {content}
        </View>
      </View>
    </View>
  );

  const standardSurfaceContent = (
    <View style={contentShellStyle}>
      <Animated.View style={[surfaceStyle, surfaceAnimStyle]}>
        <View style={contentOffsetStyle}>
          {content}
        </View>
      </Animated.View>
    </View>
  );

  if (shouldUseAppleZoom) {
    return (
      <Link asChild href={journalGoalsZoomRoute}>
        <Pressable
          accessibilityHint="Opens the goals sheet"
          accessibilityLabel={`Open goals. ${calories} calories, ${carbs} grams of carbs, ${protein} grams of protein, ${fat} grams of fat.`}
          accessibilityRole="button"
          hitSlop={8}
          onPressIn={() => {
            journalHaptics.light();
          }}
          style={({ pressed }) => [
            styles.pressable,
            pressed && styles.pressablePressed,
          ]}
        >
          <Link.AppleZoom alignmentRect={appleZoomAlignmentRect}>
            {regularSurfaceContent}
          </Link.AppleZoom>
        </Pressable>
      </Link>
    );
  }

  return (
    <Pressable
      accessibilityHint="Opens the goals sheet"
      accessibilityLabel={`Open goals. ${calories} calories, ${carbs} grams of carbs, ${protein} grams of protein, ${fat} grams of fat.`}
      accessibilityRole="button"
      disabled={interactionDisabled}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [
        styles.pressable,
        isCompactMode && !isInline && styles.pressableCompact,
        isInline && styles.pressableInline,
        pressed && styles.pressablePressed,
      ]}
    >
      {standardSurfaceContent}
    </Pressable>
  );
}

export function JournalTabAccessory(props: JournalTabAccessoryProps) {
  const placement = NativeTabs.BottomAccessory.usePlacement();

  return (
    <JournalTabAccessorySurface
      {...props}
      placement={placement}
    />
  );
}

const styles = StyleSheet.create({
  surfaceBase: {
    alignSelf: "stretch",
    alignItems: "center",
    backgroundColor: "transparent",
    borderTopColor: "transparent",
    justifyContent: "center",
    width: "100%",
  },
  pressable: {
    alignSelf: "stretch",
    width: "100%",
  },
  pressableInline: {
    height: "100%",
    justifyContent: "center",
  },
  pressableCompact: {
    alignSelf: "center",
    width: "auto",
  },
  pressablePressed: {
    opacity: 0.86,
  },
  surfaceZoom: {
    overflow: "hidden",
  },
  contentShell: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  contentShellRegular: {
    height: 48,
  },
  contentShellInline: {
    height: "100%",
  },
  contentShellCompact: {
    height: 40,
  },
  contentOffset: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  contentOffsetRegular: {},
  contentOffsetInline: {},
  surfaceRegular: {
    height: 48,
    paddingHorizontal: spacing.xl,
    paddingVertical: 0,
  },
  surfaceInline: {
    height: "100%",
    paddingHorizontal: spacing.lg,
    paddingVertical: 0,
  },
  surfaceCompact: {
    height: 40,
    paddingHorizontal: spacing.lg,
  },
  row: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    minHeight: 20,
    width: "100%",
  },
  rowInline: {
    minHeight: 18,
  },
  rowCompact: {
    minHeight: 18,
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
  summaryGroupInline: {
    gap: spacing.xs,
  },
  iconWrap: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
  },
  iconWrapInline: {
    height: 14,
  },
  caloriesLabel: {
    ...typography.subhead,
    alignSelf: "center",
    fontWeight: "700",
    includeFontPadding: false,
    letterSpacing: -0.2,
    lineHeight: 15,
    minHeight: 16,
    textAlignVertical: "center",
  },
  caloriesLabelInline: {
    fontSize: 13,
    lineHeight: 13,
    minHeight: 14,
  },
  macrosRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm + 2,
    justifyContent: "center",
  },
  macrosRowInline: {
    gap: spacing.sm,
  },
  macroGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 3,
  },
  macroGroupInline: {
    gap: 2,
  },
  metricToken: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
  },
  metricTokenInline: {
    height: 14,
  },
  metricText: {
    ...typography.subhead,
    alignSelf: "center",
    includeFontPadding: false,
    lineHeight: 15,
    minHeight: 16,
    textAlignVertical: "center",
  },
  metricTextInline: {
    fontSize: 13,
    lineHeight: 13,
    minHeight: 14,
  },
  macroKey: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  macroValue: {
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  chevronWrap: {
    alignItems: "center",
    height: 16,
    justifyContent: "center",
  },
  chevronWrapInline: {
    height: 14,
  },
});

export default JournalTabAccessory;
