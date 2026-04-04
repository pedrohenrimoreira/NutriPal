/**
 * GoalsPanel — detailed nutrition breakdown.
 *
 * Expanded by the ActionBar nutrition pill tap.
 * Animated in/out by the parent (AnimatePresence + MotiView in index.jsx).
 *
 * Contents:
 *   - Calories progress bar
 *   - Burned row
 *   - 3 main macro circles: Carbs, Protein, Fat
 *   - 3 secondary circles: Sugar, Fiber, Sodium
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, spacing, radius, typography } from "../../theme";

const DEFAULT_GOALS = {
  calories: 2729,
  carbs_g:  303,
  protein_g: 136,
  fat_g:     91,
};

/* ── sub-components ────────────────────────────────────────────────────────── */

function ProgressBar({ pct, color }) {
  return (
    <View style={styles.track}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(Math.max(pct, 0), 100)}%`,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

function GoalRow({ icon, label, right }) {
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalLeft}>
        <Text style={styles.goalIcon}>{icon}</Text>
        <Text style={styles.goalLabel}>{label}</Text>
      </View>
      <Text style={styles.goalRight}>{right}</Text>
    </View>
  );
}

function MacroCircle({ value, label, color }) {
  return (
    <View style={styles.circleWrap}>
      <View style={[
        styles.circle,
        { borderColor: value > 0 ? color : "rgba(255,255,255,0.08)" },
      ]}>
        <Text style={styles.circleVal}>{value}</Text>
      </View>
      <Text style={styles.circleLabel}>{label}</Text>
    </View>
  );
}

/* ── main component ────────────────────────────────────────────────────────── */

export function GoalsPanel({ totals }) {
  const cal   = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot  = Math.round(totals.protein_g);
  const fat   = Math.round(totals.fat_g);

  const calPct = (cal / DEFAULT_GOALS.calories) * 100;

  return (
    <GlassView
      isInteractive={false}
      style={[
        styles.card,
        isLiquidGlassAvailable()
          ? {}
          : { backgroundColor: "rgba(255,255,255,0.09)" },
      ]}
    >
      <Text style={styles.title}>Goals</Text>

      {/* Calories */}
      <GoalRow
        icon="🔥"
        label="Calories"
        right={`${cal} / ${DEFAULT_GOALS.calories}`}
      />
      <ProgressBar pct={calPct} color={colors.accentOrange} />

      {/* Burned */}
      <View style={styles.rowGap} />
      <GoalRow icon="🚶" label="Burned" right="0" />
      <ProgressBar pct={0} color={colors.accentGreen} />

      {/* Primary macros */}
      <View style={styles.circleRow}>
        <MacroCircle value={carbs} label="Carbs"   color={colors.carbs} />
        <MacroCircle value={prot}  label="Protein" color={colors.protein} />
        <MacroCircle value={fat}   label="Fat"     color={colors.fat} />
      </View>

      {/* Secondary macros */}
      <View style={styles.circleRow}>
        <MacroCircle value={0} label="Sugar"  color={colors.accentPink} />
        <MacroCircle value={0} label="Fiber"  color={colors.accentGreen} />
        <MacroCircle value={0} label="Sodium" color={colors.accentBlue} />
      </View>
    </GlassView>
  );
}

/* ── styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  card: {
    marginHorizontal: spacing.xl,
    borderRadius: radius.xl,
    padding: spacing.xl,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.lg,
  },

  /* Goal rows */
  goalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  goalLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  goalIcon:  { fontSize: 16 },
  goalLabel: { ...typography.subhead },
  goalRight: { ...typography.footnote, color: colors.systemGray },
  rowGap:    { height: spacing.md },

  /* Progress bar */
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  fill: { height: "100%", borderRadius: 2 },

  /* Macro circles */
  circleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.lg,
  },
  circleWrap:  { alignItems: "center", gap: spacing.xs },
  circle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  circleVal: {
    fontSize: 16,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  circleLabel: {
    ...typography.caption1,
    color: colors.systemGray,
  },
});
