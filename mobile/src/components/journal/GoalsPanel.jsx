/**
 * GoalsPanel — detailed nutrition breakdown.
 *
 * Expanded by the ActionBar nutrition pill tap.
 * Animated in/out by the parent (AnimatePresence + MotiView in index.jsx).
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius, typography } from "../../theme";

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

function GoalRow({ icon, label, right, C }) {
  return (
    <View style={styles.goalRow}>
      <View style={styles.goalLeft}>
        <Text style={styles.goalIcon}>{icon}</Text>
        <Text style={[styles.goalLabel, { color: C.textPrimary }]}>{label}</Text>
      </View>
      <Text style={[styles.goalRight, { color: C.textSecondary }]}>{right}</Text>
    </View>
  );
}

function MacroCircle({ value, label, color, C }) {
  return (
    <View style={styles.circleWrap}>
      <View style={[
        styles.circle,
        { borderColor: value > 0 ? color : C.separator },
      ]}>
        <Text style={[styles.circleVal, { color: C.textPrimary }]}>{value}</Text>
      </View>
      <Text style={[styles.circleLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

/* ── main component ────────────────────────────────────────────────────────── */

export function GoalsPanel({ totals }) {
  const C = useThemeStore((s) => s.colors);
  const colorMode = useThemeStore((s) => s.colorMode);

  const cal   = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot  = Math.round(totals.protein_g);
  const fat   = Math.round(totals.fat_g);

  const calPct = (cal / DEFAULT_GOALS.calories) * 100;
  const panelTone = colorMode === "dark"
    ? "rgba(38,38,40,0.97)"
    : "rgba(239,233,224,0.97)";
  const panelBorder = colorMode === "dark"
    ? "rgba(255,255,255,0.16)"
    : "rgba(255,255,255,0.56)";

  return (
    <View style={styles.cardShell}>
      <GlassView
        isInteractive={false}
        style={[
          styles.card,
          {
            backgroundColor: panelTone,
            borderColor: panelBorder,
          },
        ]}
      >
        <Text style={[styles.title, { color: C.textPrimary }]}>Goals</Text>

      <GoalRow
        icon="🔥"
        label="Calories"
        right={`${cal} / ${DEFAULT_GOALS.calories}`}
        C={C}
      />
      <ProgressBar pct={calPct} color={C.accentOrange} />

      <View style={styles.rowGap} />
      <GoalRow icon="🚶" label="Burned" right="0" C={C} />
      <ProgressBar pct={0} color={C.accentGreen} />

      <View style={styles.circleRow}>
        <MacroCircle value={carbs} label="Carbs"   color={C.carbs}   C={C} />
        <MacroCircle value={prot}  label="Protein" color={C.protein} C={C} />
        <MacroCircle value={fat}   label="Fat"     color={C.fat}     C={C} />
      </View>

        <View style={styles.circleRow}>
          <MacroCircle value={0} label="Sugar"  color={C.accentPink}  C={C} />
          <MacroCircle value={0} label="Fiber"  color={C.accentGreen} C={C} />
          <MacroCircle value={0} label="Sodium" color={C.accentBlue}  C={C} />
        </View>
      </GlassView>
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  cardShell: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderRadius: radius.xl,
    borderCurve: "continuous",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  card: {
    borderRadius: radius.xl,
    borderCurve: "continuous",
    overflow: "hidden",
    padding: spacing.xl,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.lg,
  },

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
  goalRight: { ...typography.footnote },
  rowGap:    { height: spacing.md },

  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.10)",
    overflow: "hidden",
    marginBottom: spacing.xs,
  },
  fill: { height: "100%", borderRadius: 2 },

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
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  circleVal: {
    fontSize: 16,
    fontWeight: "600",
  },
  circleLabel: {
    ...typography.caption1,
  },
});
