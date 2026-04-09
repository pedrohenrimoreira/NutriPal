import React, { useEffect } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import {
  GlassContainer,
  GlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { AppSymbol } from "../icons/AppSymbol";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";

function MacroGroup({
  color,
  label,
  value,
  compact = false,
}) {
  return (
    <View style={[styles.metricGroup, compact && styles.metricGroupCompact]}>
      <Text style={[styles.metricKey, compact && styles.metricKeyCompact, { color }]}>{label}</Text>
      <Text style={[styles.metricValue, compact && styles.metricValueCompact]}>{value}</Text>
    </View>
  );
}

function AccessorySurface({
  backgroundColor,
  borderColor,
  children,
  style,
}) {
  const useNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();

  if (useNativeGlass) {
    return (
      <GlassView
        isInteractive={false}
        style={[
          styles.surfaceBase,
          style,
          {
            borderColor,
          },
        ]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.surfaceBase,
        style,
        {
          backgroundColor,
          borderColor,
        },
      ]}
    >
      {children}
    </View>
  );
}

export function JournalSummaryBar({
  actions,
  mode = "regular",
  totals,
}) {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const scale = useSharedValue(1);
  const calories = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const protein = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);
  const isInline = mode === "inline";
  const useNativeGlass = Platform.OS === "ios" && isLiquidGlassAvailable();
  const surfaceTone = colorMode === "dark"
    ? "rgba(44,44,46,0.88)"
    : "rgba(239,233,222,0.92)";
  const surfaceBorder = colorMode === "dark"
    ? "rgba(255,255,255,0.14)"
    : "rgba(255,255,255,0.5)";

  useEffect(() => {
    scale.value = withSequence(
      withTiming(1.015, { duration: 120 }),
      withSpring(1, { damping: 15, stiffness: 220 }),
    );
  }, [calories, carbs, fat, protein, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const clusterContent = (
    <>
      <View style={[styles.nutritionLane, isInline && styles.nutritionLaneInline]}>
        <AccessorySurface
          backgroundColor={surfaceTone}
          borderColor={surfaceBorder}
          style={[
            styles.nutritionBar,
            isInline ? styles.nutritionBarInline : styles.nutritionBarRegular,
          ]}
        >
          <View style={styles.nutritionRow}>
            <View style={[styles.metricGroup, styles.calorieGroup]}>
              <AppSymbol
                color={C.accentOrange}
                name="flame.fill"
                size={isInline ? 11 : 12}
                weight="medium"
              />
              <Text style={[styles.calorieValue, isInline && styles.calorieValueInline, { color: C.accentOrange }]}>
                {calories}
              </Text>
            </View>

            <View style={styles.metricSeparator} />

            <MacroGroup color={C.carbs} compact={isInline} label="C" value={carbs} />
            <MacroGroup color={C.protein} compact={isInline} label="P" value={protein} />
            <MacroGroup color={C.fat} compact={isInline} label="F" value={fat} />
          </View>
        </AccessorySurface>
      </View>

      <View style={[styles.actionsLane, isInline && styles.actionsLaneInline]}>
        {actions.map((action) => (
          <View
            key={action.key}
            collapsable={false}
            ref={action.ref}
          >
            <Pressable
              accessibilityLabel={action.accessibilityLabel}
              accessibilityRole="button"
              hitSlop={10}
              onPress={action.onPress}
              style={({ pressed }) => [
                styles.actionPressable,
                pressed && styles.actionPressablePressed,
              ]}
            >
              <AccessorySurface
                backgroundColor={surfaceTone}
                borderColor={surfaceBorder}
                style={[
                  styles.actionButton,
                  isInline && styles.actionButtonInline,
                ]}
              >
                <AppSymbol
                  color={action.color ?? C.accentOrange}
                  name={action.icon}
                  size={isInline ? 15 : 16}
                  weight="medium"
                />
              </AccessorySurface>
            </Pressable>
          </View>
        ))}
      </View>
    </>
  );

  return (
    <Animated.View style={[styles.summaryWrapper, isInline && styles.summaryWrapperInline, animatedStyle]}>
      {/* Legacy single-pill nutrition bar lives in `LegacyJournalSummaryBar.jsx` for easy restore. */}
      {useNativeGlass ? (
        <GlassContainer
          spacing={isInline ? 8 : 10}
          style={[
            styles.cluster,
            isInline ? styles.clusterInline : styles.clusterRegular,
          ]}
        >
          {clusterContent}
        </GlassContainer>
      ) : (
        <View
          style={[
            styles.cluster,
            isInline ? styles.clusterInline : styles.clusterRegular,
          ]}
        >
          {clusterContent}
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  summaryWrapper: {
    alignItems: "center",
    paddingTop: 2,
    paddingBottom: 2,
  },
  summaryWrapperInline: {
    paddingTop: 1,
    paddingBottom: 1,
  },
  cluster: {
    alignItems: "stretch",
  },
  clusterRegular: {
    width: 280,
  },
  clusterInline: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    width: "auto",
  },
  nutritionLane: {
    alignItems: "center",
    width: "100%",
  },
  nutritionLaneInline: {
    width: "auto",
  },
  actionsLane: {
    alignItems: "flex-end",
    marginTop: spacing.xs + 1,
    paddingRight: 12,
    width: "100%",
  },
  actionsLaneInline: {
    marginLeft: spacing.xs + 1,
    marginTop: 0,
    paddingRight: 0,
    width: "auto",
  },
  surfaceBase: {
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  nutritionBar: {
    alignItems: "center",
    justifyContent: "center",
  },
  nutritionBarRegular: {
    minHeight: 34,
    minWidth: 184,
    paddingHorizontal: spacing.md + 1,
    paddingVertical: spacing.xs + 3,
  },
  nutritionBarInline: {
    minHeight: 30,
    minWidth: 170,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.xs + 2,
  },
  nutritionRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  metricGroup: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  metricGroupCompact: {
    gap: 3,
  },
  calorieGroup: {
    minWidth: 44,
  },
  metricSeparator: {
    backgroundColor: "rgba(255,255,255,0.16)",
    borderRadius: radius.full,
    height: 10,
    width: StyleSheet.hairlineWidth,
  },
  calorieValue: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.2,
  },
  calorieValueInline: {
    fontSize: 13,
  },
  metricKey: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: -0.1,
  },
  metricKeyCompact: {
    fontSize: 11,
  },
  metricValue: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: -0.2,
  },
  metricValueCompact: {
    fontSize: 11,
  },
  actionPressable: {
    borderRadius: radius.full,
  },
  actionPressablePressed: {
    transform: [{ scale: 0.97 }],
  },
  actionButton: {
    alignItems: "center",
    height: 36,
    justifyContent: "center",
    width: 36,
  },
  actionButtonInline: {
    height: 32,
    width: 32,
  },
});

export default JournalSummaryBar;
