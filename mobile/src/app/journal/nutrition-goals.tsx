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
import { formatNutritionGoalsSummary } from "../../constants/journalSettings";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

function NumberField({
  label,
  onChangeText,
  value,
}: {
  label: string;
  onChangeText: (value: string) => void;
  value: string;
}) {
  const C = useThemeStore((store) => store.colors);

  return (
    <View style={styles.fieldBlock}>
      <Text style={[styles.fieldLabel, { color: C.textSecondary }]}>{label}</Text>
      <TextInput
        keyboardType="decimal-pad"
        onChangeText={onChangeText}
        placeholder="0"
        placeholderTextColor={C.textTertiary}
        style={[styles.input, { backgroundColor: C.bgPrimary, borderColor: C.separator, color: C.textPrimary }]}
        value={value}
      />
    </View>
  );
}

function parseMetric(input: string) {
  const normalized = input.replace(",", ".").trim();
  const numeric = Number(normalized);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}

export default function NutritionGoalsScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const nutritionGoals = useSettingsStore((store) => store.nutritionGoals);
  const setNutritionGoals = useSettingsStore((store) => store.setNutritionGoals);
  const [calories, setCalories] = useState(String(Math.round(nutritionGoals.calories)));
  const [protein, setProtein] = useState(String(Math.round(nutritionGoals.protein_g)));
  const [carbs, setCarbs] = useState(String(Math.round(nutritionGoals.carbs_g)));
  const [fat, setFat] = useState(String(Math.round(nutritionGoals.fat_g)));

  useEffect(() => {
    setCalories(String(Math.round(nutritionGoals.calories)));
    setProtein(String(Math.round(nutritionGoals.protein_g)));
    setCarbs(String(Math.round(nutritionGoals.carbs_g)));
    setFat(String(Math.round(nutritionGoals.fat_g)));
  }, [nutritionGoals]);

  const handleSave = () => {
    const nextCalories = parseMetric(calories);
    const nextProtein = parseMetric(protein);
    const nextCarbs = parseMetric(carbs);
    const nextFat = parseMetric(fat);

    if (!nextCalories || !nextProtein || !nextCarbs || !nextFat) {
      Alert.alert("Invalid values", "Fill in calories and macros with valid numbers.");
      return;
    }

    journalHaptics.medium();
    setNutritionGoals({
      calories: nextCalories,
      carbs_g: nextCarbs,
      fat_g: nextFat,
      protein_g: nextProtein,
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
            <Text style={[styles.heroTitle, { color: C.textPrimary }]}>Daily goal summary</Text>
            <Text style={[styles.heroSummary, { color: C.textSecondary }]}>
              {formatNutritionGoalsSummary({
                calories: parseMetric(calories) ?? 0,
                carbs_g: parseMetric(carbs) ?? 0,
                fat_g: parseMetric(fat) ?? 0,
                protein_g: parseMetric(protein) ?? 0,
              })}
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
            <NumberField label="Calories" onChangeText={setCalories} value={calories} />
            <NumberField label="Protein (g)" onChangeText={setProtein} value={protein} />
            <NumberField label="Carbs (g)" onChangeText={setCarbs} value={carbs} />
            <NumberField label="Fat (g)" onChangeText={setFat} value={fat} />
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={handleSave}
            style={[styles.primaryButton, { backgroundColor: C.accentGreen }]}
          >
            <Text style={styles.primaryButtonLabel}>Save goals</Text>
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
    padding: spacing.xl,
  },
  fieldBlock: {
    gap: spacing.xs,
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
