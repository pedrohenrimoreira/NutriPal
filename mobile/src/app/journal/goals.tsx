import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompactGoalsCard } from "../../components/journal/CompactGoalsCard";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { spacing } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

export default function GoalsScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const nutritionGoals = useSettingsStore((store) => store.nutritionGoals);
  const { entries, journal } = useJournalStore();
  const totals = useDailyTotals(journal, entries);

  const handleClose = useCallback(() => {
    journalHaptics.light();
    router.back();
  }, [router]);

  const handleManageGoals = useCallback(() => {
    journalHaptics.light();
    router.push("/(tabs)/(journal)/nutrition-goals");
  }, [router]);

  return (
    <SafeAreaView
      edges={["bottom", "left", "right"]}
      style={[
        styles.safeArea,
        { backgroundColor: C.bgPrimary },
      ]}
    >
      <ScrollView
        bounces={false}
        contentInsetAdjustmentBehavior="automatic"
        contentContainerStyle={styles.content}
        indicatorStyle="white"
        showsVerticalScrollIndicator={false}
      >
        <CompactGoalsCard
          embedded
          nutritionGoals={nutritionGoals}
          onClose={handleClose}
          onManageGoals={handleManageGoals}
          scrollable={false}
          totals={totals}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
