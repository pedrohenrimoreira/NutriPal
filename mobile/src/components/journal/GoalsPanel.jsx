/**
 * GoalsPanel — detailed nutrition breakdown.
 *
 * Restored legacy inline card used by the Journal nutrition bar.
 * This stays available so the older expand/collapse flow can be used
 * without the newer compact card/modal implementation.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { GlassView } from "expo-glass-effect";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius, typography } from "../../theme";

const DEFAULT_GOALS = {
  calories: 2729,
  carbs_g: 303,
  protein_g: 136,
  fat_g: 91,
};

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
      <View
        style={[
          styles.circle,
          { borderColor: value > 0 ? color : C.separator },
        ]}
      >
        <Text style={[styles.circleVal, { color: C.textPrimary }]}>{value}</Text>
      </View>
      <Text style={[styles.circleLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

export function GoalsPanel({ totals }) {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);

  const cal = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);

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
          C={C}
          icon="🔥"
          label="Calories"
          right={`${cal} / ${DEFAULT_GOALS.calories}`}
        />
        <ProgressBar pct={calPct} color={C.accentOrange} />

        <View style={styles.rowGap} />

        <GoalRow
          C={C}
          icon="🚶"
          label="Burned"
          right="0"
        />
        <ProgressBar pct={0} color={C.accentGreen} />

        <View style={styles.circleRow}>
          <MacroCircle C={C} color={C.carbs} label="Carbs" value={carbs} />
          <MacroCircle C={C} color={C.protein} label="Protein" value={prot} />
          <MacroCircle C={C} color={C.fat} label="Fat" value={fat} />
        </View>

        <View style={styles.circleRow}>
          <MacroCircle C={C} color={C.accentPink} label="Sugar" value={0} />
          <MacroCircle C={C} color={C.accentGreen} label="Fiber" value={0} />
          <MacroCircle C={C} color={C.accentBlue} label="Sodium" value={0} />
        </View>
      </GlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  cardShell: {
    marginHorizontal: spacing.xl,
    marginBottom: spacing.sm,
    borderCurve: "continuous",
    borderRadius: radius.xl,
    elevation: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  card: {
    borderColor: "rgba(255,255,255,0.16)",
    borderCurve: "continuous",
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: "hidden",
    padding: spacing.xl,
  },
  title: {
    ...typography.headline,
    marginBottom: spacing.lg,
  },
  goalRow: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  goalLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  goalIcon: {
    fontSize: 16,
  },
  goalLabel: {
    ...typography.subhead,
  },
  goalRight: {
    ...typography.footnote,
  },
  rowGap: {
    height: spacing.md,
  },
  track: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 2,
    height: 4,
    marginBottom: spacing.xs,
    overflow: "hidden",
  },
  fill: {
    borderRadius: 2,
    height: "100%",
  },
  circleRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: spacing.lg,
  },
  circleWrap: {
    alignItems: "center",
    gap: spacing.xs,
  },
  circle: {
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 30,
    borderWidth: 2,
    height: 60,
    justifyContent: "center",
    width: 60,
  },
  circleVal: {
    fontSize: 16,
    fontWeight: "600",
  },
  circleLabel: {
    ...typography.caption1,
  },
});

export default GoalsPanel;
