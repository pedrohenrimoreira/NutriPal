import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { useJournalStore } from "../../store/journalStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function toDateStr(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function formatMonthYear(dateStr: string) {
  const date = new Date(`${dateStr}T12:00:00`);
  return date.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

export default function JournalCalendarScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const glassFallback = isLiquidGlassAvailable()
    ? {}
    : { backgroundColor: colorMode === "dark" ? "rgba(255,255,255,0.09)" : "rgba(0,0,0,0.04)" };
  const { selectedDate, setDate } = useJournalStore();

  // All dates with at least one food entry → shown as green filled circles.
  const allEntries = useJournalStore((s) => (s as any)._entries ?? {});
  const loggedDates = useMemo<Set<string>>(
    () => new Set(
      Object.entries(allEntries as Record<string, unknown[]>)
        .filter(([, e]) => Array.isArray(e) && e.length > 0)
        .map(([d]) => d),
    ),
    [allEntries],
  );

  const todayStr = useMemo(() => toDateStr(new Date()), []);

  // Tracks the month currently visible — updates as the user swipes.
  const [visibleMonth, setVisibleMonth] = useState(selectedDate);
  const monthYearLabel = useMemo(() => formatMonthYear(visibleMonth), [visibleMonth]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};

    // Logged days → green filled circle.
    loggedDates.forEach((date) => {
      marks[date] = {
        customStyles: {
          container: { backgroundColor: C.accentGreen, borderRadius: 20 },
          text: { color: "#000", fontWeight: "600" },
        },
      };
    });

    // Today: purple outline; if also logged, keep green fill + purple ring.
    if (loggedDates.has(todayStr)) {
      marks[todayStr] = {
        customStyles: {
          container: {
            backgroundColor: C.accentGreen,
            borderColor: C.accentPurple,
            borderRadius: 20,
            borderWidth: 2.5,
          },
          text: { color: "#000", fontWeight: "700" },
        },
      };
    } else {
      marks[todayStr] = {
        customStyles: {
          container: { borderColor: C.accentPurple, borderRadius: 20, borderWidth: 2 },
          text: { color: C.accentPurple, fontWeight: "600" },
        },
      };
    }

    // Selected date (not logged, not today) → green outline shows which day
    // the journal is currently on.
    if (!loggedDates.has(selectedDate) && selectedDate !== todayStr) {
      marks[selectedDate] = {
        customStyles: {
          container: { borderColor: C.accentGreen, borderRadius: 20, borderWidth: 2 },
          text: { color: C.accentGreen, fontWeight: "600" },
        },
      };
    }

    return marks;
  }, [C, loggedDates, selectedDate, todayStr]);

  const handleSelectDate = useCallback((date: string) => {
    journalHaptics.selection();
    setDate(date);
    router.dismissTo("/(tabs)/(journal)");
  }, [router, setDate]);

  const handleToday = useCallback(() => {
    journalHaptics.selection();
    setDate(todayStr);
    router.dismissTo("/(tabs)/(journal)");
  }, [router, setDate, todayStr]);

  const handleMonthChange = useCallback((month: { dateString: string }) => {
    setVisibleMonth(month.dateString);
  }, []);

  // No flex:1 — natural height so fitToContents can measure the sheet size.
  // The sheet background colour (bgSecondary) comes from contentStyle in the
  // Stack.Screen options, so our views here are transparent.
  return (
    // Outer frame carries the glass border — top + sides only, rounded top
    // corners to follow the formSheet's native chrome shape.  No bottom border
    // because the sheet extends flush to the screen edge at the bottom.
    <View style={[styles.sheetFrame, { borderColor: C.separator }]}>
      <SafeAreaView edges={["bottom"]} style={styles.safeArea}>
      <View style={styles.content}>
        {/* Toolbar */}
        <View style={styles.toolbar}>
          <TouchableOpacity activeOpacity={0.78} onPress={handleToday}>
            <GlassView
              colorScheme={colorMode}
              glassEffectStyle="clear"
              isInteractive
              style={[styles.toolbarCapsule, glassFallback]}
            >
              <Text style={[styles.toolbarBtn, { color: C.accentBlue }]}>Today</Text>
            </GlassView>
          </TouchableOpacity>

          <Text style={[styles.toolbarMonth, { color: C.textPrimary }]}>
            {monthYearLabel}
          </Text>

          <TouchableOpacity activeOpacity={0.78} onPress={() => router.back()}>
            <GlassView
              colorScheme={colorMode}
              glassEffectStyle="clear"
              isInteractive
              style={[styles.toolbarCapsule, glassFallback]}
            >
              <Text style={[styles.toolbarBtn, { color: C.accentBlue }]}>Done</Text>
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Calendar — transparent, sits directly on the sheet surface */}
        <Calendar
          current={selectedDate}
          enableSwipeMonths
          markingType="custom"
          markedDates={markedDates}
          onDayPress={(day) => handleSelectDate(day.dateString)}
          onMonthChange={handleMonthChange}
          style={styles.calendar}
          theme={{
            arrowColor: "transparent",
            calendarBackground: "transparent",
            dayTextColor: C.textPrimary,
            monthTextColor: "transparent",
            selectedDayBackgroundColor: C.accentGreen,
            selectedDayTextColor: "#000",
            textDayFontSize: 16,
            textDayFontWeight: "400",
            textDayHeaderFontSize: 12,
            textDayHeaderFontWeight: "500",
            textDisabledColor: C.textTertiary,
            textMonthFontSize: 0,
            textSectionTitleColor: C.systemGray2,
            todayTextColor: C.accentPurple,
            "stylesheet.calendar.header": {
              header: { height: 0, overflow: "hidden" },
            },
          }}
        />
      </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  // Glass border on the outermost wrapper — top + sides follow the formSheet
  // corner radius; no bottom border since the sheet is flush with the screen.
  sheetFrame: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  safeArea: {
    // No flex:1 and no backgroundColor — fitToContents needs natural height,
    // and the sheet background comes from contentStyle in _layout.tsx.
  },
  content: {
    paddingBottom: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  toolbar: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.md,
    paddingHorizontal: spacing.xs,
    paddingTop: spacing.lg,
  },
  toolbarCapsule: {
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
    overflow: "hidden",
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  toolbarBtn: {
    ...typography.body,
    fontWeight: "600",
  },
  toolbarMonth: {
    ...typography.headline,
    fontWeight: "700",
    letterSpacing: -0.3,
  },
  calendar: {
    marginHorizontal: -spacing.xs,
  },
});
