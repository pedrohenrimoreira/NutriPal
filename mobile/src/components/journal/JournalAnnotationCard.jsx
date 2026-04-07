import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useThemeStore } from "../../store/themeStore";
import { spacing, typography } from "../../theme";
import { JournalGlassSurface } from "./JournalGlassSurface";
import journalHaptics from "../../utils/journalHaptics";

function MacroChip({ label, value, color }) {
  const C = useThemeStore((s) => s.colors);

  return (
    <JournalGlassSurface variant="chip" contentStyle={styles.chipContent}>
      <Text style={[styles.chipLabel, { color }]}>{label}</Text>
      <Text style={[styles.chipValue, { color: C.textPrimary }]}>{Math.round(value)}g</Text>
    </JournalGlassSurface>
  );
}

export function JournalAnnotationCard({ annotation }) {
  const C = useThemeStore((s) => s.colors);
  const [expanded, setExpanded] = useState(false);
  const hasItems = annotation.items?.length > 0;
  const hasReasoning = Boolean(annotation.reasoning);

  const handleToggleReasoning = () => {
    journalHaptics.selection();
    setExpanded((value) => !value);
  };

  return (
    <Animated.View entering={FadeInDown.duration(180).springify().damping(18)}>
      <JournalGlassSurface
        variant="compact"
        onPress={hasReasoning ? handleToggleReasoning : undefined}
        style={styles.card}
        contentStyle={styles.cardContent}
      >
        <View style={styles.headerRow}>
          <Text style={[styles.lineText, { color: C.textSecondary }]} numberOfLines={1}>
            {annotation.sourceText}
          </Text>
          {annotation.isLoading ? (
            <Text style={[styles.loadingText, { color: C.textTertiary }]}>analisando…</Text>
          ) : annotation.error ? (
            <Text style={[styles.errorText, { color: C.accentRed }]}>erro</Text>
          ) : (
            <Text style={[styles.kcalText, { color: C.textPrimary }]}>
              {Math.round(annotation.totals?.calories ?? 0)} kcal
            </Text>
          )}
        </View>

        {!annotation.isLoading && hasItems ? (
          <Text style={[styles.itemsText, { color: C.textSecondary }]}>
            {annotation.items.map((item) => item.name).join(" · ")}
          </Text>
        ) : null}

        {!annotation.isLoading && !annotation.error ? (
          <View style={styles.chipRow}>
            <MacroChip label="P" value={annotation.totals?.protein_g ?? 0} color={C.protein} />
            <MacroChip label="C" value={annotation.totals?.carbs_g ?? 0} color={C.carbs} />
            <MacroChip label="F" value={annotation.totals?.fat_g ?? 0} color={C.fat} />
          </View>
        ) : null}

        {annotation.error ? (
          <Text style={[styles.reasoningText, { color: C.textSecondary }]}>
            {annotation.error}
          </Text>
        ) : null}

        {hasReasoning && expanded ? (
          <Text style={[styles.reasoningText, { color: C.textSecondary }]}>
            {annotation.reasoning}
          </Text>
        ) : null}
      </JournalGlassSurface>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
  },
  cardContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: spacing.sm,
  },
  lineText: {
    ...typography.footnote,
    flex: 1,
    fontStyle: "italic",
  },
  kcalText: {
    ...typography.footnote,
    fontWeight: "700",
  },
  loadingText: {
    ...typography.caption1,
    fontStyle: "italic",
  },
  errorText: {
    ...typography.caption1,
    fontWeight: "700",
  },
  itemsText: {
    ...typography.footnote,
    letterSpacing: -0.08,
  },
  chipRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  chipContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.xs + 6,
    paddingVertical: spacing.xs + 2,
  },
  chipLabel: {
    fontSize: 11,
    fontWeight: "700",
  },
  chipValue: {
    fontSize: 11,
    fontWeight: "600",
  },
  reasoningText: {
    ...typography.caption1,
    lineHeight: 18,
  },
});
