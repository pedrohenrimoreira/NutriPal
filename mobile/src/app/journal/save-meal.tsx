import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { useJournalUiStore } from "../../store/journalUiStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

export default function SaveMealScreen() {
  const router = useRouter();
  const draft = useJournalUiStore((store) => store.savedMealDraft);
  const clearSavedMealDraft = useJournalUiStore((store) => store.clearSavedMealDraft);
  const addSavedMeal = useSettingsStore((store) => store.addSavedMeal);
  const C = useThemeStore((store) => store.colors);
  const [name, setName] = useState(draft?.suggestedName ?? "");

  useEffect(() => {
    setName(draft?.suggestedName ?? "");
  }, [draft?.suggestedName]);

  useEffect(() => () => {
    clearSavedMealDraft();
  }, [clearSavedMealDraft]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed || !draft) {
      return;
    }

    journalHaptics.medium();
    addSavedMeal({
      calories: draft.totals.calories,
      carbs_g: draft.totals.carbs_g,
      fat_g: draft.totals.fat_g,
      items: draft.items,
      name: trimmed,
      protein_g: draft.totals.protein_g,
    });
    clearSavedMealDraft();
    Alert.alert("Saved meal criada", `"${trimmed}" foi salva para reutilizar no chat.`);
    router.back();
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          <Text style={[styles.title, { color: C.textPrimary }]}>Save meal</Text>
          <Text style={[styles.description, { color: C.textSecondary }]}>
            Escolha o nome que o usuário vai digitar depois no chat.
          </Text>

          <TextInput
            autoFocus
            onChangeText={setName}
            placeholder="Ex.: café da manhã padrão"
            placeholderTextColor={C.textTertiary}
            style={[styles.input, { borderColor: C.separator, color: C.textPrimary, backgroundColor: C.bgPrimary }]}
            value={name}
          />

          {draft ? (
            <View style={styles.macroRow}>
              <AppSymbol color={C.accentOrange} name="flame.fill" size={12} weight="medium" />
              <Text style={[styles.macroText, { color: C.textSecondary }]}>
                {Math.round(draft.totals.calories)} cal · P {Math.round(draft.totals.protein_g)}g · C {Math.round(draft.totals.carbs_g)}g · F {Math.round(draft.totals.fat_g)}g
              </Text>
            </View>
          ) : null}

          <View style={styles.actions}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                clearSavedMealDraft();
                router.back();
              }}
              style={[styles.secondaryButton, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}
            >
              <Text style={[styles.secondaryLabel, { color: C.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.8}
              disabled={!name.trim() || !draft}
              onPress={handleSave}
              style={[
                styles.primaryButton,
                {
                  backgroundColor: name.trim() && draft ? C.accentGreen : C.bgTertiary,
                  opacity: name.trim() && draft ? 1 : 0.65,
                },
              ]}
            >
              <Text style={styles.primaryLabel}>Salvar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  title: {
    ...typography.title3,
    fontWeight: "700",
  },
  description: {
    ...typography.footnote,
    lineHeight: 18,
  },
  input: {
    ...typography.body,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    minHeight: 52,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  macroRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.xs,
  },
  macroText: {
    ...typography.footnote,
    fontWeight: "600",
  },
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
    justifyContent: "flex-end",
    marginTop: spacing.sm,
  },
  secondaryButton: {
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  secondaryLabel: {
    ...typography.subhead,
    fontWeight: "600",
  },
  primaryButton: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
  },
  primaryLabel: {
    ...typography.subhead,
    color: "#000",
    fontWeight: "700",
  },
});

