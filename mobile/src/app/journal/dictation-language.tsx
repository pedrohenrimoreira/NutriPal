import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { DICTATION_LANGUAGE_OPTIONS } from "../../constants/journalSettings";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";

export default function DictationLanguageScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const dictationLanguage = useSettingsStore((store) => store.dictationLanguage);
  const setDictationLanguage = useSettingsStore((store) => store.setDictationLanguage);
  const [selectedLanguage, setSelectedLanguage] = useState(dictationLanguage);

  useEffect(() => {
    setSelectedLanguage(dictationLanguage);
  }, [dictationLanguage]);

  const handleSave = () => {
    journalHaptics.medium();
    setDictationLanguage(selectedLanguage);
    router.back();
  };

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.card, { backgroundColor: C.bgSecondary, borderColor: C.separator }]}>
          {DICTATION_LANGUAGE_OPTIONS.map((option, index) => {
            const selected = option.value === selectedLanguage;
            const isLast = index === DICTATION_LANGUAGE_OPTIONS.length - 1;

            return (
              <TouchableOpacity
                key={option.value}
                activeOpacity={0.78}
                onPress={() => {
                  journalHaptics.selection();
                  setSelectedLanguage(option.value);
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
          <Text style={styles.primaryButtonLabel}>Save language</Text>
        </TouchableOpacity>
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
  card: {
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    paddingHorizontal: spacing.xl,
  },
  optionRow: {
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    flexDirection: "row",
    gap: spacing.md,
    minHeight: 72,
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
