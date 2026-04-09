import React, { useEffect } from "react";
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useJournalUiStore } from "../../store/journalUiStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function roundMetric(value: number | undefined) {
  return Math.round(Number(value ?? 0));
}

export default function NutritionDetailsScreen() {
  const detail = useJournalUiStore((store) => store.nutritionDetail);
  const clearNutritionDetail = useJournalUiStore((store) => store.clearNutritionDetail);
  const C = useThemeStore((store) => store.colors);

  useEffect(() => () => {
    clearNutritionDetail();
  }, [clearNutritionDetail]);

  const openSourceUrl = async (url?: string) => {
    if (!url) {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        return;
      }

      journalHaptics.selection();
      await Linking.openURL(url);
    } catch (error: any) {
      console.warn("[nutrition] could not open source url:", error?.message);
    }
  };

  const items = detail?.items?.length
    ? detail.items
    : [{ name: detail?.sourceText ?? "", calories: detail?.totals?.calories ?? 0 }];

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.sourceTitle, { color: C.textPrimary }]}>
          {detail?.sourceText ?? "No item selected"}
        </Text>

        <View style={[styles.summaryCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <View style={styles.caloriesBlock}>
            <Text style={[styles.caloriesValue, { color: C.textPrimary }]}>
              {roundMetric(detail?.totals?.calories)}
            </Text>
            <Text style={[styles.caloriesLabel, { color: C.textSecondary }]}>total calories</Text>
          </View>

          <View style={styles.macroRow}>
            <View style={styles.macroStat}>
              <Text style={[styles.macroValue, { color: C.textPrimary }]}>{roundMetric(detail?.totals?.protein_g)} g</Text>
              <Text style={[styles.macroLabel, { color: C.protein }]}>Protein</Text>
            </View>
            <View style={styles.macroStat}>
              <Text style={[styles.macroValue, { color: C.textPrimary }]}>{roundMetric(detail?.totals?.carbs_g)} g</Text>
              <Text style={[styles.macroLabel, { color: C.carbs }]}>Carbs</Text>
            </View>
            <View style={styles.macroStat}>
              <Text style={[styles.macroValue, { color: C.textPrimary }]}>{roundMetric(detail?.totals?.fat_g)} g</Text>
              <Text style={[styles.macroLabel, { color: C.fat }]}>Fat</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Items</Text>
        <View style={styles.sectionStack}>
          {items.map((item, index) => (
            <View
              key={`${item.name}-${index}`}
              style={[styles.itemCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}
            >
              <View style={styles.itemHeader}>
                <Text style={[styles.itemName, { color: C.textPrimary }]}>{item.name}</Text>
                <Text style={[styles.itemCalories, { color: C.textSecondary }]}>{roundMetric(item.calories)} cal</Text>
              </View>
              {"quantityDescription" in item && item.quantityDescription ? (
                <Text style={[styles.itemMeta, { color: C.textSecondary }]}>{item.quantityDescription}</Text>
              ) : null}
              {"matchedOfficialName" in item && item.matchedOfficialName ? (
                <Text style={[styles.itemSource, { color: C.textTertiary }]}>{item.matchedOfficialName}</Text>
              ) : null}
            </View>
          ))}
        </View>

        {detail?.sources?.length ? (
          <>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Sources</Text>
            <View style={styles.sectionStack}>
              {detail.sources.map((source, index) => (
                <TouchableOpacity
                  key={`${source.url}-${index}`}
                  activeOpacity={0.75}
                  onPress={() => openSourceUrl(source.url)}
                  style={[styles.sourceCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}
                >
                  <Text style={[styles.sourceLabel, { color: C.accentBlue }]}>{source.label}</Text>
                  <Text style={[styles.sourceName, { color: C.textPrimary }]}>{source.matchName}</Text>
                  <Text numberOfLines={1} style={[styles.sourceUrl, { color: C.textTertiary }]}>{source.url}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </>
        ) : null}

        {detail?.reasoning ? (
          <>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Resolution notes</Text>
            <View style={[styles.reasoningCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
              <Text style={[styles.reasoningText, { color: C.textPrimary }]}>{detail.reasoning}</Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: spacing.lg,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  sourceTitle: {
    ...typography.title3,
    fontWeight: "700",
  },
  summaryCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xl,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  caloriesBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  caloriesValue: {
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1,
  },
  caloriesLabel: {
    ...typography.footnote,
    textTransform: "uppercase",
  },
  macroRow: {
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  macroStat: {
    alignItems: "center",
    flex: 1,
    gap: spacing.xs,
  },
  macroValue: {
    ...typography.headline,
    fontWeight: "700",
  },
  macroLabel: {
    ...typography.caption1,
    fontWeight: "700",
  },
  sectionTitle: {
    ...typography.caption1,
    fontWeight: "700",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  sectionStack: {
    gap: spacing.md,
  },
  itemCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  itemHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  itemName: {
    ...typography.body,
    flex: 1,
    fontWeight: "600",
  },
  itemCalories: {
    ...typography.footnote,
    fontWeight: "600",
  },
  itemMeta: {
    ...typography.footnote,
  },
  itemSource: {
    ...typography.caption1,
  },
  sourceCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  sourceLabel: {
    ...typography.caption1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  sourceName: {
    ...typography.subhead,
    fontWeight: "700",
  },
  sourceUrl: {
    ...typography.caption1,
  },
  reasoningCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  reasoningText: {
    ...typography.body,
    lineHeight: 24,
  },
});

