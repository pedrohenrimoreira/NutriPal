import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import {
  ACTIVITY_LEVEL_OPTIONS,
  formatWeightKg,
  getActivityLevelLabel,
} from "../../constants/journalSettings";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function parseWeight(input: string) {
  const normalized = input.replace(",", ".").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export default function HealthProfileScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const healthProfile = useSettingsStore((store) => store.healthProfile);
  const setHealthProfile = useSettingsStore((store) => store.setHealthProfile);
  const addWeightEntry = useSettingsStore((store) => store.addWeightEntry);
  const [currentWeight, setCurrentWeight] = useState(String(healthProfile.currentWeightKg));
  const [activityLevel, setActivityLevel] = useState(healthProfile.activityLevel);

  useEffect(() => {
    setCurrentWeight(String(healthProfile.currentWeightKg));
    setActivityLevel(healthProfile.activityLevel);
  }, [healthProfile.activityLevel, healthProfile.currentWeightKg]);

  const handleSave = () => {
    const nextWeight = parseWeight(currentWeight);
    if (!nextWeight) {
      Alert.alert("Invalid weight", "Enter a valid weight in kilograms.");
      return;
    }

    const currentStoreWeight = Number(healthProfile.currentWeightKg ?? 0);
    journalHaptics.medium();

    if (Math.abs(currentStoreWeight - nextWeight) > 0.001) {
      addWeightEntry({ weightKg: nextWeight });
    }

    setHealthProfile({
      activityLevel,
      currentWeightKg: nextWeight,
    });
    router.back();
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.safeArea}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.heroCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
            <Text style={[styles.heroTitle, { color: C.textPrimary }]}>Current profile</Text>
            <Text style={[styles.heroSummary, { color: C.textSecondary }]}>
              {formatWeightKg(parseWeight(currentWeight) ?? 0)} · {getActivityLevelLabel(activityLevel)}
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
            <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>Current weight (kg)</Text>
            <TextInput
              keyboardType="decimal-pad"
              onChangeText={setCurrentWeight}
              placeholder="61.5"
              placeholderTextColor={C.textTertiary}
              style={[styles.input, { backgroundColor: C.bgPrimary, borderColor: C.separator, color: C.textPrimary }]}
              value={currentWeight}
            />
          </View>

          <View style={[styles.formCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
            <Text style={[styles.sectionTitle, { color: C.textSecondary }]}>Activity level</Text>
            {ACTIVITY_LEVEL_OPTIONS.map((option, index) => {
              const selected = option.value === activityLevel;
              const isLast = index === ACTIVITY_LEVEL_OPTIONS.length - 1;

              return (
                <TouchableOpacity
                  key={option.value}
                  activeOpacity={0.78}
                  onPress={() => {
                    journalHaptics.selection();
                    setActivityLevel(option.value);
                  }}
                  style={[styles.optionRow, !isLast && { borderBottomColor: C.separator }]}
                >
                  <View style={styles.optionBody}>
                    <Text style={[styles.optionLabel, { color: C.textPrimary }]}>{option.label}</Text>
                    <Text style={[styles.optionDescription, { color: C.textSecondary }]}>
                      {option.description}
                    </Text>
                  </View>
                  <AppSymbol
                    color={selected ? C.accentBlue : C.textTertiary}
                    name={selected ? "checkmark.circle.fill" : "circle"}
                    size={20}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleSave}
            style={[styles.primaryButton, { backgroundColor: C.accentGreen }]}
          >
            <Text style={styles.primaryButtonLabel}>Save profile</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
    ...typography.headline,
    fontWeight: "700",
  },
  heroSummary: {
    ...typography.subhead,
    lineHeight: 20,
  },
  formCard: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    overflow: "hidden",
    padding: spacing.xl,
  },
  fieldLabel: {
    ...typography.caption1,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  input: {
    ...typography.body,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  sectionTitle: {
    ...typography.caption1,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  optionRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 60,
  },
  optionBody: {
    flex: 1,
  },
  optionLabel: {
    ...typography.body,
    fontWeight: "600",
  },
  optionDescription: {
    ...typography.caption1,
    marginTop: 2,
  },
  primaryButton: {
    alignItems: "center",
    borderRadius: radius.full,
    justifyContent: "center",
    minHeight: 52,
  },
  primaryButtonLabel: {
    ...typography.subhead,
    color: "#000",
    fontWeight: "700",
  },
});
