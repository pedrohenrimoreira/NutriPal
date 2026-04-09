import React, { useMemo } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ScrollViewProps,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";

const glass = (fallback: string) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

type NutritionTotals = {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
};

type JournalAnnotation = {
  lineIndex?: number;
  sourceText?: string;
  items?: Array<{
    name?: string;
    calories?: number;
    protein_g?: number;
    carbs_g?: number;
    fat_g?: number;
  }>;
  totals?: NutritionTotals;
};

type JournalDay = {
  rawText?: string;
  analysisStatus?: string;
  lineAnnotations?: JournalAnnotation[];
};

type Entry = {
  id?: string;
  rawText?: string;
  isProcessing?: boolean;
  parsedResult?: {
    items?: Array<{
      name?: string;
      calories?: number;
      protein_g?: number;
      carbs_g?: number;
      fat_g?: number;
    }>;
    totals?: NutritionTotals;
  };
};

interface DailySummaryViewProps {
  selectedDate: string;
  journal: JournalDay;
  entries: Entry[];
  totals: NutritionTotals;
  bottomInset?: number;
  onScroll?: ScrollViewProps["onScroll"];
  scrollEventThrottle?: number;
  scrollIndicatorBottomInset?: number;
}

type MealCard = {
  id: string;
  title: string;
  subtitle: string;
  items: Array<{
    name: string;
    calories: number;
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  }>;
  totals: NutritionTotals;
};

function emptyTotals(): NutritionTotals {
  return { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 };
}

function roundMetric(value: number | undefined) {
  return Math.round(Number(value ?? 0));
}

function formatDate(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

export function DailySummaryView({
  selectedDate,
  journal,
  entries,
  totals,
  bottomInset = 0,
  onScroll,
  scrollEventThrottle,
  scrollIndicatorBottomInset = 0,
}: DailySummaryViewProps) {
  const C = useThemeStore((state) => state.colors);
  const meals = useMemo<MealCard[]>(() => {
    const textMeals = (journal?.lineAnnotations ?? [])
      .filter((annotation) => annotation?.sourceText?.trim())
      .map((annotation) => ({
        id: `journal-${annotation.lineIndex ?? Math.random()}`,
        title: annotation.sourceText?.trim() ?? "Registro do journal",
        subtitle: "Journal",
        items: (annotation.items ?? []).map((item) => ({
          name: item?.name?.trim() || "Item estimado",
          calories: Number(item?.calories ?? 0),
          protein_g: Number(item?.protein_g ?? 0),
          carbs_g: Number(item?.carbs_g ?? 0),
          fat_g: Number(item?.fat_g ?? 0),
        })),
        totals: annotation.totals ?? emptyTotals(),
      }));

    const imageMeals = (entries ?? []).map((entry, index) => ({
      id: entry.id ?? `scan-${index}`,
      title: entry.rawText?.trim() || `Foto analisada ${index + 1}`,
      subtitle: entry.isProcessing ? "Analisando foto" : "Foto",
      items: (entry.parsedResult?.items ?? []).map((item) => ({
        name: item?.name?.trim() || "Item identificado",
        calories: Number(item?.calories ?? 0),
        protein_g: Number(item?.protein_g ?? 0),
        carbs_g: Number(item?.carbs_g ?? 0),
        fat_g: Number(item?.fat_g ?? 0),
      })),
      totals: entry.parsedResult?.totals ?? emptyTotals(),
    }));

    return [...textMeals, ...imageMeals];
  }, [entries, journal]);

  const groupedFoods = useMemo(() => {
    const grouped = new Map<string, {
      name: string;
      count: number;
      calories: number;
      protein_g: number;
      carbs_g: number;
      fat_g: number;
    }>();

    meals.forEach((meal) => {
      meal.items.forEach((item) => {
        const key = item.name.toLowerCase();
        const current = grouped.get(key) ?? {
          name: item.name,
          count: 0,
          calories: 0,
          protein_g: 0,
          carbs_g: 0,
          fat_g: 0,
        };

        current.count += 1;
        current.calories += item.calories;
        current.protein_g += item.protein_g;
        current.carbs_g += item.carbs_g;
        current.fat_g += item.fat_g;
        grouped.set(key, current);
      });
    });

    return Array.from(grouped.values()).sort((a, b) => b.calories - a.calories);
  }, [meals]);

  const trackedFoodsCount = groupedFoods.reduce((sum, item) => sum + item.count, 0);
  const pendingAnalysis = journal?.analysisStatus === "analyzing"
    || entries.some((entry) => entry?.isProcessing);

  const macroCards = [
    { key: "calories", label: "Calories", value: roundMetric(totals.calories), accent: C.accentOrange },
    { key: "carbs", label: "Carbs", value: roundMetric(totals.carbs_g), accent: C.carbs },
    { key: "protein", label: "Protein", value: roundMetric(totals.protein_g), accent: C.protein },
    { key: "fat", label: "Fat", value: roundMetric(totals.fat_g), accent: C.fat },
  ];

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={[
        styles.content,
        bottomInset ? { paddingBottom: 140 + bottomInset } : null,
      ]}
      onScroll={onScroll}
      scrollEventThrottle={scrollEventThrottle}
      scrollIndicatorInsets={{
        bottom: scrollIndicatorBottomInset,
      }}
      showsVerticalScrollIndicator={false}
    >
      <GlassView style={[styles.heroCard, glass(C.glassBg)]}>
        <Text style={[styles.heroEyebrow, { color: C.accentCyan }]}>DAILY SUMMARY</Text>
        <Text style={[styles.heroTitle, { color: C.textPrimary }]}>
          Resumo dos alimentos consumidos
        </Text>
        <Text style={[styles.heroDate, { color: C.textSecondary }]}>
          {formatDate(selectedDate)}
        </Text>

        <View style={styles.heroMetaRow}>
          <View style={[styles.metaPill, { borderColor: C.separator, backgroundColor: C.bgSecondary }]}>
            <Text style={[styles.metaValue, { color: C.textPrimary }]}>{meals.length}</Text>
            <Text style={[styles.metaLabel, { color: C.textSecondary }]}>refeições</Text>
          </View>

          <View style={[styles.metaPill, { borderColor: C.separator, backgroundColor: C.bgSecondary }]}>
            <Text style={[styles.metaValue, { color: C.textPrimary }]}>{trackedFoodsCount}</Text>
            <Text style={[styles.metaLabel, { color: C.textSecondary }]}>itens</Text>
          </View>

          <View style={[styles.metaPill, { borderColor: C.separator, backgroundColor: C.bgSecondary }]}>
            <Text style={[styles.metaValue, { color: C.textPrimary }]}>{groupedFoods.length}</Text>
            <Text style={[styles.metaLabel, { color: C.textSecondary }]}>alimentos</Text>
          </View>
        </View>

        {pendingAnalysis ? (
          <Text style={[styles.pendingText, { color: C.textSecondary }]}>
            Atualizando os dados do dia com a análise de IA.
          </Text>
        ) : null}
      </GlassView>

      <View style={styles.macroGrid}>
        {macroCards.map((card) => (
          <GlassView
            key={card.key}
            style={[styles.macroCard, glass(C.glassBg)]}
          >
            <Text style={[styles.macroLabel, { color: C.textSecondary }]}>{card.label}</Text>
            <Text style={[styles.macroValue, { color: card.accent }]}>{card.value}</Text>
          </GlassView>
        ))}
      </View>

      <GlassView style={[styles.sectionCard, glass(C.glassBg)]}>
        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Alimentos do dia</Text>

        {groupedFoods.length ? (
          groupedFoods.map((food) => (
            <View
              key={food.name}
              style={[styles.foodRow, { borderBottomColor: C.separator }]}
            >
              <View style={styles.foodCopy}>
                <Text style={[styles.foodName, { color: C.textPrimary }]}>{food.name}</Text>
                <Text style={[styles.foodMeta, { color: C.textSecondary }]}>
                  {food.count}x no dia
                </Text>
              </View>
              <View style={styles.foodNumbers}>
                <Text style={[styles.foodCalories, { color: C.accentOrange }]}>
                  {roundMetric(food.calories)} kcal
                </Text>
                <Text style={[styles.foodMacros, { color: C.textSecondary }]}>
                  C {roundMetric(food.carbs_g)} • P {roundMetric(food.protein_g)} • F {roundMetric(food.fat_g)}
                </Text>
              </View>
            </View>
          ))
        ) : (
          <Text style={[styles.emptyState, { color: C.textSecondary }]}>
            Ainda não há alimentos consolidados para este dia.
          </Text>
        )}
      </GlassView>

      <GlassView style={[styles.sectionCard, glass(C.glassBg)]}>
        <Text style={[styles.sectionTitle, { color: C.textPrimary }]}>Breakdown por refeição</Text>

        {meals.length ? (
          meals.map((meal) => (
            <View
              key={meal.id}
              style={[styles.mealCard, { borderColor: C.separator, backgroundColor: C.bgSecondary }]}
            >
              <View style={styles.mealHeader}>
                <View style={styles.mealCopy}>
                  <Text style={[styles.mealTitle, { color: C.textPrimary }]}>{meal.title}</Text>
                  <Text style={[styles.mealSubtitle, { color: C.textSecondary }]}>{meal.subtitle}</Text>
                </View>
                <Text style={[styles.mealCalories, { color: C.accentOrange }]}>
                  {roundMetric(meal.totals.calories)} kcal
                </Text>
              </View>

              {meal.items.length ? (
                <View style={styles.mealItems}>
                  {meal.items.map((item, index) => (
                    <View key={`${meal.id}-${item.name}-${index}`} style={styles.mealItemRow}>
                      <Text style={[styles.mealItemName, { color: C.textPrimary }]}>{item.name}</Text>
                      <Text style={[styles.mealItemMetrics, { color: C.textSecondary }]}>
                        {roundMetric(item.calories)} kcal
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={[styles.mealPending, { color: C.textSecondary }]}>
                  Itens ainda não identificados.
                </Text>
              )}
            </View>
          ))
        ) : (
          <Text style={[styles.emptyState, { color: C.textSecondary }]}>
            Registre refeições no journal para gerar o resumo.
          </Text>
        )}
      </GlassView>
    </ScrollView>
  );
}

export default DailySummaryView;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 140,
    gap: spacing.lg,
  },
  heroCard: {
    borderRadius: radius.xxl,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  heroEyebrow: {
    ...typography.caption1,
    fontWeight: "800",
    letterSpacing: 1,
  },
  heroTitle: {
    ...typography.title2,
    fontWeight: "700",
  },
  heroDate: {
    ...typography.footnote,
    textTransform: "capitalize",
  },
  heroMetaRow: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  metaPill: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingVertical: spacing.md,
    alignItems: "center",
    gap: 2,
  },
  metaValue: {
    ...typography.title3,
    fontWeight: "700",
  },
  metaLabel: {
    ...typography.caption1,
    fontWeight: "600",
  },
  pendingText: {
    ...typography.footnote,
  },
  macroGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.md,
  },
  macroCard: {
    width: "47%",
    borderRadius: radius.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  macroLabel: {
    ...typography.caption1,
    fontWeight: "700",
  },
  macroValue: {
    ...typography.title2,
    fontWeight: "700",
  },
  sectionCard: {
    borderRadius: radius.xxl,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  sectionTitle: {
    ...typography.headline,
    fontWeight: "700",
  },
  foodRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
    paddingBottom: spacing.md,
    marginBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  foodCopy: {
    flex: 1,
    gap: 4,
  },
  foodName: {
    ...typography.body,
    fontWeight: "600",
  },
  foodMeta: {
    ...typography.caption1,
  },
  foodNumbers: {
    alignItems: "flex-end",
    gap: 4,
  },
  foodCalories: {
    ...typography.subhead,
    fontWeight: "700",
  },
  foodMacros: {
    ...typography.caption1,
    textAlign: "right",
  },
  mealCard: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  mealHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  mealCopy: {
    flex: 1,
    gap: 4,
  },
  mealTitle: {
    ...typography.body,
    fontWeight: "700",
  },
  mealSubtitle: {
    ...typography.caption1,
  },
  mealCalories: {
    ...typography.subhead,
    fontWeight: "700",
  },
  mealItems: {
    gap: spacing.sm,
  },
  mealItemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  mealItemName: {
    ...typography.subhead,
    flex: 1,
  },
  mealItemMetrics: {
    ...typography.caption1,
    fontWeight: "600",
  },
  mealPending: {
    ...typography.caption1,
  },
  emptyState: {
    ...typography.footnote,
    lineHeight: 18,
  },
});
