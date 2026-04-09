import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar } from "react-native-calendars";
import { AppSymbol } from "../../components/icons/AppSymbol";
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
  const { selectedDate, setDate } = useJournalStore();
  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const monthYearLabel = useMemo(() => formatMonthYear(selectedDate), [selectedDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {
      [selectedDate]: {
        selected: true,
        selectedColor: C.accentGreen,
        selectedTextColor: "#000",
      },
    };

    if (selectedDate !== todayStr) {
      marks[todayStr] = {
        marked: true,
        dotColor: C.accentPurple,
        customStyles: {
          container: {
            borderColor: C.accentPurple,
            borderRadius: 18,
            borderWidth: 2,
          },
          text: { color: C.accentPurple, fontWeight: "600" },
        },
      };
    }

    return marks;
  }, [C, selectedDate, todayStr]);

  const handleSelectDate = (date: string) => {
    journalHaptics.selection();
    setDate(date);
    router.back();
  };

  const handleToday = () => {
    journalHaptics.selection();
    setDate(todayStr);
    router.back();
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <View style={styles.content}>
        <View style={[styles.toolbar, { borderBottomColor: C.separator }]}>
          <TouchableOpacity activeOpacity={0.72} onPress={handleToday}>
            <Text style={[styles.toolbarAction, { color: C.accentBlue }]}>Today</Text>
          </TouchableOpacity>
          <View style={styles.toolbarCenter}>
            <AppSymbol color={C.textSecondary} name="calendar" size={14} />
            <Text style={[styles.toolbarTitle, { color: C.textPrimary }]}>{monthYearLabel}</Text>
          </View>
          <TouchableOpacity activeOpacity={0.72} onPress={() => router.back()}>
            <Text style={[styles.toolbarAction, { color: C.accentBlue }]}>Done</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.calendarCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <Calendar
            current={selectedDate}
            markingType="custom"
            markedDates={markedDates}
            onDayPress={(day) => handleSelectDate(day.dateString)}
            theme={{
              arrowColor: C.accentBlue,
              calendarBackground: "transparent",
              dayTextColor: C.textPrimary,
              monthTextColor: "transparent",
              selectedDayBackgroundColor: C.accentGreen,
              selectedDayTextColor: "#000",
              textDayFontSize: 16,
              textDayFontWeight: "400",
              textDayHeaderFontSize: 13,
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
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
  },
  toolbar: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: spacing.lg,
  },
  toolbarCenter: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  toolbarAction: {
    ...typography.subhead,
    fontWeight: "600",
  },
  toolbarTitle: {
    ...typography.headline,
    fontWeight: "600",
  },
  calendarCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
});

