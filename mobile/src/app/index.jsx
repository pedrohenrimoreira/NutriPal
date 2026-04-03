/**
 * Main Journal Screen with modals for calendar and settings
 */
import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Keyboard,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomSheet, {
  BottomSheetView,
  BottomSheetScrollView,
} from "@gorhom/bottom-sheet";
import { Calendar } from "react-native-calendars";

import { useJournalStore, useDailyTotals } from "../store/journalStore";
import { MealEntryCard } from "../components/journal/MealEntryCard";
import { ActionBar } from "../components/journal/ActionBar";
import { colors, spacing, radius, typography } from "../theme";

function toDateStr(d) {
  return d.toISOString().slice(0, 10);
}

function formatDateLabel(dateStr) {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Hoje";
  if (dateStr === yesterday) return "Ontem";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
}

function SettingsRow({ label, value }) {
  return (
    <View style={styles.settingsRow}>
      <Text style={styles.settingsRowLabel}>{label}</Text>
      {value ? <Text style={styles.settingsRowValue}>{value}</Text> : null}
    </View>
  );
}

export default function Index() {
  const { entries, selectedDate, setDate, addTextEntry } = useJournalStore();
  const totals = useDailyTotals(entries);
  const insets = useSafeAreaInsets();

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState("");
  const [isListening, setIsListening] = useState(false);

  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const calendarSheetRef = useRef(null);
  const settingsSheetRef = useRef(null);

  const dateLabel = useMemo(
    () => formatDateLabel(selectedDate),
    [selectedDate],
  );

  const handleStartEditing = useCallback(() => {
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleDismissKeyboard = useCallback(() => {
    Keyboard.dismiss();
    setIsEditing(false);
    setText("");
  }, []);

  const handleSubmit = useCallback(async () => {
    const raw = text.trim();
    if (!raw) return;
    await addTextEntry(raw);
    setText("");
    Keyboard.dismiss();
    setIsEditing(false);
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [text, addTextEntry]);

  const handleToggleMic = useCallback(() => {
    setIsListening((prev) => !prev);
  }, []);

  const handleOpenCamera = useCallback(() => {
    console.log("Camera pressed");
  }, []);

  const handleAddSavedMeal = useCallback(() => {
    console.log("Add saved meal pressed");
  }, []);

  const goToDay = useCallback(
    (offset) => {
      const d = new Date(`${selectedDate}T12:00:00`);
      d.setDate(d.getDate() + offset);
      setDate(toDateStr(d));
    },
    [selectedDate, setDate],
  );

  const openCalendar = useCallback(() => {
    calendarSheetRef.current?.expand();
  }, []);

  const openSettings = useCallback(() => {
    settingsSheetRef.current?.expand();
  }, []);

  const markedDates = useMemo(
    () => ({
      [selectedDate]: {
        selected: true,
        selectedColor: colors.accentGreen,
      },
    }),
    [selectedDate],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPrimary }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Text style={styles.logo}>🥗</Text>

        {/* Date pill */}
        <View style={styles.datePillContainer}>
          <TouchableOpacity onPress={() => goToDay(-1)} activeOpacity={0.6}>
            <GlassView
              isInteractive={true}
              style={[
                styles.arrowBtn,
                isLiquidGlassAvailable()
                  ? {}
                  : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              ]}
            >
              <Text style={styles.arrowText}>‹</Text>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={openCalendar} activeOpacity={0.6}>
            <GlassView
              isInteractive={true}
              style={[
                styles.datePill,
                isLiquidGlassAvailable()
                  ? {}
                  : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              ]}
            >
              <Text style={styles.dateLabel}>{dateLabel}</Text>
            </GlassView>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => goToDay(1)} activeOpacity={0.6}>
            <GlassView
              isInteractive={true}
              style={[
                styles.arrowBtn,
                isLiquidGlassAvailable()
                  ? {}
                  : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              ]}
            >
              <Text style={styles.arrowText}>›</Text>
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Streak + settings */}
        <View style={styles.headerRight}>
          <GlassView
            isInteractive={true}
            style={[
              styles.streakPill,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <Text style={styles.streakText}>🔥 1</Text>
          </GlassView>
          <TouchableOpacity activeOpacity={0.7} onPress={openSettings}>
            <GlassView
              isInteractive={true}
              style={[
                styles.settingsBtn,
                isLiquidGlassAvailable()
                  ? {}
                  : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
              ]}
            >
              <Text style={styles.settingsIcon}>⚙️</Text>
            </GlassView>
          </TouchableOpacity>
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {isEditing ? (
            <View style={styles.inputContainer}>
              <TextInput
                ref={inputRef}
                value={text}
                onChangeText={setText}
                placeholder="O que você comeu?..."
                placeholderTextColor={colors.systemGray3}
                style={styles.textInput}
                multiline
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                blurOnSubmit={false}
              />
              <View style={styles.inputActions}>
                <TouchableOpacity
                  onPress={handleDismissKeyboard}
                  style={styles.cancelBtn}
                >
                  <Text style={styles.cancelText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[
                    styles.saveBtn,
                    {
                      backgroundColor: text.trim()
                        ? colors.accentGreen
                        : colors.glassBg,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.saveText,
                      { color: text.trim() ? "#000" : colors.systemGray3 },
                    ]}
                  >
                    Salvar
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : entries.length === 0 ? (
            <TouchableOpacity onPress={handleStartEditing} activeOpacity={0.6}>
              <Text style={styles.placeholder}>
                Comece a registrar suas refeições...
              </Text>
            </TouchableOpacity>
          ) : (
            <>
              {entries.map((entry) => (
                <MealEntryCard key={entry.id} entry={entry} />
              ))}
              <TouchableOpacity
                onPress={handleStartEditing}
                style={styles.addMoreBtn}
                activeOpacity={0.6}
              >
                <Text style={styles.addMoreText}>+ Adicionar refeição</Text>
              </TouchableOpacity>
            </>
          )}
        </ScrollView>

        <ActionBar
          totals={totals}
          isEditing={isEditing}
          isListening={isListening}
          onToggleMic={handleToggleMic}
          onOpenCamera={handleOpenCamera}
          onAddSavedMeal={handleAddSavedMeal}
          onDismissKeyboard={handleDismissKeyboard}
        />
      </KeyboardAvoidingView>

      {/* Calendar Bottom Sheet */}
      <BottomSheet
        ref={calendarSheetRef}
        index={-1}
        snapPoints={["75%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.bgPrimary }}
        handleIndicatorStyle={{ backgroundColor: colors.systemGray }}
      >
        <BottomSheetView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Selecione uma data</Text>
          <Calendar
            current={selectedDate}
            onDayPress={(day) => {
              setDate(day.dateString);
              calendarSheetRef.current?.close();
            }}
            markedDates={markedDates}
            theme={{
              calendarBackground: "transparent",
              textSectionTitleColor: colors.systemGray,
              selectedDayBackgroundColor: colors.accentGreen,
              selectedDayTextColor: "#000",
              todayTextColor: colors.accentGreen,
              dayTextColor: colors.textPrimary,
              textDisabledColor: colors.systemGray3,
              monthTextColor: colors.textPrimary,
              textMonthFontWeight: "600",
              textDayFontSize: 16,
              textMonthFontSize: 18,
            }}
          />
        </BottomSheetView>
      </BottomSheet>

      {/* Settings Bottom Sheet */}
      <BottomSheet
        ref={settingsSheetRef}
        index={-1}
        snapPoints={["85%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: colors.bgPrimary }}
        handleIndicatorStyle={{ backgroundColor: colors.systemGray }}
      >
        <BottomSheetScrollView style={styles.sheetContent}>
          <Text style={styles.sheetTitle}>Configurações</Text>

          <Text style={styles.sectionHeader}>METAS DIÁRIAS</Text>
          <GlassView
            isInteractive={true}
            style={[
              styles.settingsCard,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <SettingsRow label="Calorias" value="2000 kcal" />
            <View style={styles.separator} />
            <SettingsRow label="Proteína" value="150 g" />
            <View style={styles.separator} />
            <SettingsRow label="Carboidratos" value="250 g" />
            <View style={styles.separator} />
            <SettingsRow label="Gordura" value="65 g" />
          </GlassView>

          <Text style={styles.sectionHeader}>PREFERÊNCIAS</Text>
          <GlassView
            isInteractive={true}
            style={[
              styles.settingsCard,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <SettingsRow label="Idioma" value="Português (BR)" />
            <View style={styles.separator} />
            <SettingsRow label="Viés calórico" value="Preciso" />
          </GlassView>

          <Text style={styles.sectionHeader}>DADOS</Text>
          <GlassView
            isInteractive={true}
            style={[
              styles.settingsCard,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <SettingsRow label="Exportar dados" />
            <View style={styles.separator} />
            <SettingsRow label="Limpar cache" />
          </GlassView>

          <Text style={styles.version}>NutriPal v0.1.0</Text>
        </BottomSheetScrollView>
      </BottomSheet>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  logo: {
    fontSize: 28,
  },
  datePillContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  arrowBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  arrowText: {
    fontSize: 22,
    color: colors.textPrimary,
    lineHeight: 26,
  },
  datePill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.full,
    alignItems: "center",
  },
  dateLabel: {
    ...typography.headline,
    fontWeight: "600",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    borderRadius: radius.full,
    padding: spacing.xs,
  },
  streakPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  streakText: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.textPrimary,
  },
  settingsBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  inputContainer: {
    marginBottom: spacing.md,
  },
  textInput: {
    ...typography.body,
    color: "rgba(255,255,255,0.9)",
    minHeight: 60,
    textAlignVertical: "top",
  },
  inputActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cancelBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  cancelText: {
    ...typography.callout,
    color: colors.systemGray,
  },
  saveBtn: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  saveText: {
    ...typography.callout,
    fontWeight: "600",
  },
  placeholder: {
    ...typography.body,
    color: colors.systemGray3,
    paddingTop: spacing.sm,
  },
  addMoreBtn: {
    paddingVertical: spacing.md,
    alignItems: "center",
  },
  addMoreText: {
    ...typography.callout,
    color: colors.systemGray,
  },
  sheetContent: {
    padding: spacing.xl,
  },
  sheetTitle: {
    ...typography.largeTitle,
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: "500",
    color: colors.systemGray2,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  settingsCard: {
    borderRadius: radius.lg,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 48,
  },
  settingsRowLabel: {
    ...typography.body,
  },
  settingsRowValue: {
    ...typography.body,
    color: colors.systemGray,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginLeft: spacing.lg,
  },
  version: {
    ...typography.footnote,
    textAlign: "center",
    marginTop: spacing.xxl,
    marginBottom: spacing.xxl,
    color: colors.systemGray3,
  },
});
