import React from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { GlassIconButton } from "../../components/GlassIconButton";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

export default function SavedMealsScreen() {
  const savedMeals = useSettingsStore((store) => store.savedMeals);
  const removeSavedMeal = useSettingsStore((store) => store.removeSavedMeal);
  const C = useThemeStore((store) => store.colors);

  const handleDeleteSavedMeal = (meal: { id: string; name: string }) => {
    Alert.alert(
      "Excluir refeição salva?",
      `A refeição "${meal.name}" será removida da lista.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => {
            journalHaptics.medium();
            removeSavedMeal(meal.id);
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {savedMeals.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
            <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No saved meals yet</Text>
            <Text style={[styles.emptyBody, { color: C.textSecondary }]}>
              Digite uma refeição no journal e use o botão de salvar para reutilizá-la depois.
            </Text>
          </View>
        ) : (
          savedMeals.map((meal) => (
            <View
              key={meal.id}
              style={[styles.mealCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}
            >
              <View style={styles.mealHeader}>
                <Text style={[styles.mealTitle, { color: C.textPrimary }]}>{meal.name}</Text>
                <GlassIconButton
                  accessibilityLabel={`Excluir ${meal.name}`}
                  color={C.accentRed}
                  iconSize={12}
                  onPress={() => handleDeleteSavedMeal(meal)}
                  size={28}
                  symbolName="xmark"
                  tone="destructive"
                />
              </View>

              <View style={styles.macroRow}>
                <AppSymbol color={C.accentOrange} name="flame.fill" size={12} weight="medium" />
                <Text style={[styles.macroCopy, { color: C.textSecondary }]}>
                  {Math.round(meal.calories)} cal · P {Math.round(meal.protein_g)}g · C {Math.round(meal.carbs_g)}g · F {Math.round(meal.fat_g)}g
                </Text>
              </View>

              <Text style={[styles.itemCopy, { color: C.textTertiary }]}>{meal.items}</Text>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    gap: spacing.md,
    paddingBottom: spacing.xxl,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  emptyState: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  emptyTitle: {
    ...typography.headline,
    fontWeight: "700",
  },
  emptyBody: {
    ...typography.footnote,
    lineHeight: 18,
  },
  mealCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  mealHeader: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.md,
    justifyContent: "space-between",
  },
  mealTitle: {
    ...typography.headline,
    flex: 1,
    fontWeight: "700",
  },
  macroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  macroCopy: {
    ...typography.footnote,
    fontWeight: "600",
  },
  itemCopy: {
    ...typography.caption1,
    lineHeight: 18,
  },
});

