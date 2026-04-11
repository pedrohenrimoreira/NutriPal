import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AppSymbol } from "../icons/AppSymbol";
import { GlassIconButton } from "../GlassIconButton";
import { formatNutritionGoalsSummary } from "../../constants/journalSettings";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";

type Totals = {
  calories: number;
  carbs_g: number;
  fat_g: number;
  protein_g: number;
};

type NutritionGoals = {
  calories: number;
  carbs_g: number;
  fat_g: number;
  protein_g: number;
};

interface CompactGoalsCardProps {
  embedded?: boolean;
  nutritionGoals: NutritionGoals;
  onClose: () => void;
  onManageGoals: () => void;
  scrollable?: boolean;
  totals: Totals;
}

interface ProgressRowProps {
  accentColor: string;
  current: number;
  goal?: number;
  icon: React.ComponentProps<typeof AppSymbol>["name"];
  label: string;
}

interface MetricItemProps {
  accentColor: string;
  label: string;
  value: number;
}

function ProgressRow({
  accentColor,
  current,
  goal = 0,
  icon,
  label,
}: ProgressRowProps) {
  const C = useThemeStore((store) => store.colors);
  const safeGoal = goal > 0 ? goal : 0;
  const progress = safeGoal > 0 ? Math.min(current / safeGoal, 1) : 0;

  return (
    <View style={styles.progressBlock}>
      <View style={styles.progressHeader}>
        <View style={styles.progressTitleRow}>
          <AppSymbol color={accentColor} name={icon} size={14} weight="medium" />
          <Text style={[styles.progressLabel, { color: C.textPrimary }]}>{label}</Text>
        </View>
        <Text style={[styles.progressValue, { color: C.textSecondary }]}>
          {safeGoal > 0 ? `${Math.round(current)} / ${Math.round(safeGoal)}` : Math.round(current)}
        </Text>
      </View>
      <View style={[styles.progressTrack, { backgroundColor: C.bgPrimary }]}>
        <View
          style={[
            styles.progressFill,
            {
              backgroundColor: accentColor,
              width: `${Math.max(progress * 100, progress > 0 ? 8 : 0)}%`,
            },
          ]}
        />
      </View>
    </View>
  );
}

function MetricItem({
  accentColor,
  label,
  value,
}: MetricItemProps) {
  const C = useThemeStore((store) => store.colors);

  return (
    <View style={styles.metricItem}>
      <View style={[styles.metricCircle, { backgroundColor: C.bgPrimary, borderColor: accentColor }]}>
        <Text style={[styles.metricValue, { color: C.textPrimary }]}>{Math.round(value)}</Text>
      </View>
      <Text style={[styles.metricLabel, { color: C.textSecondary }]}>{label}</Text>
    </View>
  );
}

function CardSurface({ children }: { children: React.ReactNode }) {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const useGlass = Platform.OS === "ios" && isLiquidGlassAvailable();
  const fallbackTone = colorMode === "dark"
    ? "rgba(30,30,30,0.92)"
    : "rgba(242,236,226,0.96)";

  if (useGlass) {
    return (
      <GlassView
        isInteractive={false}
        style={[
          styles.surface,
          { borderColor: "transparent" },
        ]}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      style={[
        styles.surface,
        {
          backgroundColor: fallbackTone,
          borderColor: C.separator,
        },
      ]}
    >
      {children}
    </View>
  );
}


export function CompactGoalsCard({
  embedded = false,
  nutritionGoals,
  onClose,
  onManageGoals,
  scrollable = true,
  totals,
}: CompactGoalsCardProps) {
  const C = useThemeStore((store) => store.colors);
  const body = (
    <>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: C.textPrimary }]}>Goals</Text>
        <GlassIconButton
          accessibilityLabel="Close goals"
          iconSize={14}
          onPress={onClose}
          size={32}
          symbolName="xmark"
        />
      </View>

      <View style={styles.scrollContent}>
        <View style={styles.section}>
          <ProgressRow
            accentColor={C.accentOrange}
            current={totals.calories}
            goal={nutritionGoals.calories}
            icon="flame.fill"
            label="Calories"
          />
          <ProgressRow
            accentColor={C.accentGreen}
            current={0}
            icon="figure.walk"
            label="Burned"
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Macros & metrics</Text>
          <View style={styles.metricsGrid}>
            <MetricItem accentColor={C.carbs} label="Carbs" value={totals.carbs_g} />
            <MetricItem accentColor={C.protein} label="Protein" value={totals.protein_g} />
            <MetricItem accentColor={C.fat} label="Fat" value={totals.fat_g} />
            <MetricItem accentColor={C.accentPink} label="Sugar" value={0} />
            <MetricItem accentColor={C.accentGreen} label="Fiber" value={0} />
            <MetricItem accentColor={C.accentBlue} label="Sodium" value={0} />
          </View>
        </View>

        <View style={[styles.summaryBlock, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}>
          <Text style={[styles.summaryLabel, { color: C.textSecondary }]}>Goals summary</Text>
          <Text style={[styles.summaryValue, { color: C.textPrimary }]}>
            {formatNutritionGoalsSummary(nutritionGoals)}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.84}
          onPress={onManageGoals}
          style={[styles.manageButton, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}
        >
          <View style={styles.manageButtonRow}>
            <AppSymbol color={C.accentBlue} name="slider.horizontal.3" size={15} weight="medium" />
            <Text style={[styles.manageButtonLabel, { color: C.textPrimary }]}>Manage nutrition goals</Text>
          </View>
          <AppSymbol color={C.textTertiary} name="chevron.right" size={14} weight="medium" />
        </TouchableOpacity>
      </View>
    </>
  );

  if (embedded) {
    return body;
  }

  return (
    <CardSurface>
      {scrollable ? (
        <ScrollView
          bounces={false}
          contentContainerStyle={styles.surfaceScrollContent}
          indicatorStyle="white"
          showsVerticalScrollIndicator={false}
        >
          {body}
        </ScrollView>
      ) : body}
    </CardSurface>
  );
}

const styles = StyleSheet.create({
  surface: {
    borderCurve: "continuous",
    borderRadius: radius.xl + 4,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerTitle: {
    ...typography.headline,
    fontWeight: "700",
  },
  scrollContent: {
    gap: spacing.md,
  },
  surfaceScrollContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  section: {
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.subhead,
    fontWeight: "700",
  },
  progressBlock: {
    gap: spacing.sm,
  },
  progressHeader: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  progressTitleRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  progressLabel: {
    ...typography.subhead,
    fontWeight: "600",
  },
  progressValue: {
    ...typography.footnote,
    fontWeight: "600",
  },
  progressTrack: {
    borderRadius: radius.full,
    height: 6,
    overflow: "hidden",
  },
  progressFill: {
    borderRadius: radius.full,
    height: "100%",
  },
  metricsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: spacing.md + 2,
  },
  metricItem: {
    alignItems: "center",
    minWidth: "30%",
  },
  metricCircle: {
    alignItems: "center",
    borderRadius: 28,
    borderWidth: 2,
    height: 56,
    justifyContent: "center",
    width: 56,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  metricLabel: {
    ...typography.caption1,
    marginTop: spacing.xs,
  },
  manageButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  manageButtonRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs + 2,
  },
  manageButtonLabel: {
    ...typography.subhead,
    fontWeight: "600",
  },
  summaryBlock: {
    borderCurve: "continuous",
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  summaryLabel: {
    ...typography.caption1,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  summaryValue: {
    ...typography.subhead,
    lineHeight: 20,
  },
});

export default CompactGoalsCard;
