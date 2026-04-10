import { useRouter } from "expo-router";
import React, { useCallback } from "react";
import { ScrollView, StyleSheet } from "react-native";
import Animated, {
  Easing,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { CompactGoalsCard } from "../../components/journal/CompactGoalsCard";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { spacing } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

// Zoom-in: content scales up from accessory size as the formSheet slides in.
function goalsEntering() {
  "worklet";
  return {
    initialValues: {
      opacity: 0,
      transform: [{ scale: 0.88 }],
    },
    animations: {
      opacity: withDelay(40, withTiming(1, { duration: 260 })),
      transform: [
        {
          scale: withDelay(
            40,
            withTiming(1, {
              duration: 320,
              easing: Easing.out(Easing.cubic),
            }),
          ),
        },
      ],
    },
  };
}

// Zoom-out: content shrinks back toward the accessory as the formSheet dismisses.
function goalsExiting() {
  "worklet";
  return {
    initialValues: {
      opacity: 1,
      transform: [{ scale: 1 }],
    },
    animations: {
      opacity: withTiming(0, { duration: 180 }),
      transform: [
        {
          scale: withTiming(0.9, {
            duration: 220,
            easing: Easing.in(Easing.quad),
          }),
        },
      ],
    },
  };
}

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
      <Animated.View
        entering={goalsEntering}
        exiting={goalsExiting}
        style={styles.animatedContainer}
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
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  animatedContainer: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
});
