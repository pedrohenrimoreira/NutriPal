import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { DailySummaryView } from "../../components/summary/DailySummaryView";
import {
  useFloatingTabBarInsets,
  useFloatingTabBarScroll,
} from "../../hooks/useFloatingTabBar";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useThemeStore } from "../../store/themeStore";

export default function SummaryScreen() {
  const C = useThemeStore((store) => store.colors);
  const {
    entries,
    journal,
    selectedDate,
  } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const { contentBottomInset, scrollIndicatorBottomInset } = useFloatingTabBarInsets();
  const { onScroll, scrollEventThrottle } = useFloatingTabBarScroll();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bgPrimary }}>
      <View collapsable={false} style={{ flex: 1, backgroundColor: C.bgPrimary }}>
        <DailySummaryView
          bottomInset={contentBottomInset}
          entries={entries}
          journal={journal}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          scrollIndicatorBottomInset={scrollIndicatorBottomInset}
          selectedDate={selectedDate}
          totals={totals}
        />
      </View>
    </SafeAreaView>
  );
}
