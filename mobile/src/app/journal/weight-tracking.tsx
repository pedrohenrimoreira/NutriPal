import React, { useMemo, useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { formatWeightKg } from "../../constants/journalSettings";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function parseWeight(input: string) {
  const normalized = input.replace(",", ".").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

function formatEntryDate(date?: string) {
  if (!date) {
    return "Unknown date";
  }

  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WeightTrackingScreen() {
  const C = useThemeStore((store) => store.colors);
  const currentWeight = useSettingsStore((store) => store.healthProfile.currentWeightKg);
  const weightEntries = useSettingsStore((store) => store.weightEntries);
  const addWeightEntry = useSettingsStore((store) => store.addWeightEntry);
  const removeWeightEntry = useSettingsStore((store) => store.removeWeightEntry);
  const [nextWeight, setNextWeight] = useState("");

  const latestSummary = useMemo(() => {
    const latestDate = weightEntries[0]?.date;
    return latestDate ? `Latest log ${formatEntryDate(latestDate)}` : "No weight logs yet";
  }, [weightEntries]);

  const handleAddEntry = () => {
    const parsed = parseWeight(nextWeight);
    if (!parsed) {
      Alert.alert("Invalid weight", "Enter a valid value in kilograms.");
      return;
    }

    journalHaptics.medium();
    addWeightEntry({ weightKg: parsed });
    setNextWeight("");
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.heroCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <Text style={[styles.heroTitle, { color: C.textPrimary }]}>{formatWeightKg(currentWeight)}</Text>
          <Text style={[styles.heroSummary, { color: C.textSecondary }]}>{latestSummary}</Text>
        </View>

        <View style={[styles.composerCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>New log</Text>
          <View style={styles.composerRow}>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setNextWeight}
              placeholder="61.5"
              placeholderTextColor={C.textTertiary}
              style={[styles.input, { backgroundColor: C.bgPrimary, borderColor: C.separator, color: C.textPrimary }]}
              value={nextWeight}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={handleAddEntry}
              style={[styles.addButton, { backgroundColor: C.accentGreen }]}
            >
              <Text style={styles.addButtonLabel}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.listCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>History</Text>
          {weightEntries.length === 0 ? (
            <Text style={[styles.emptyText, { color: C.textSecondary }]}>No weight logs yet.</Text>
          ) : (
            weightEntries.map((entry, index) => {
              const isLast = index === weightEntries.length - 1;

              return (
                <View key={entry.id} style={[styles.entryRow, !isLast && { borderBottomColor: C.separator }]}>
                  <View style={styles.entryBody}>
                    <Text style={[styles.entryValue, { color: C.textPrimary }]}>
                      {formatWeightKg(entry.weightKg)}
                    </Text>
                    <Text style={[styles.entryDate, { color: C.textSecondary }]}>
                      {formatEntryDate(entry.date)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.72}
                    onPress={() =>
                      Alert.alert("Delete entry", "Remove this weight log?", [
                        { text: "Cancel", style: "cancel" },
                        {
                          text: "Delete",
                          style: "destructive",
                          onPress: () => {
                            journalHaptics.selection();
                            removeWeightEntry(entry.id);
                          },
                        },
                      ])
                    }
                    style={styles.deleteButton}
                  >
                    <AppSymbol color={C.accentRed} name="trash.fill" size={16} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
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
  heroCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
    padding: spacing.xl,
  },
  heroTitle: {
    ...typography.largeTitle,
    fontWeight: "700",
  },
  heroSummary: {
    ...typography.subhead,
  },
  composerCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.xl,
  },
  sectionTitle: {
    ...typography.caption1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  composerRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  input: {
    ...typography.body,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: 52,
    minWidth: 88,
    paddingHorizontal: spacing.lg,
  },
  addButtonLabel: {
    ...typography.subhead,
    color: "#000",
    fontWeight: "700",
  },
  listCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    padding: spacing.xl,
  },
  emptyText: {
    ...typography.subhead,
  },
  entryRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    minHeight: 58,
  },
  entryBody: {
    flex: 1,
  },
  entryValue: {
    ...typography.body,
    fontWeight: "600",
  },
  entryDate: {
    ...typography.caption1,
    marginTop: 2,
  },
  deleteButton: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 36,
    minWidth: 36,
  },
});
