/**
 * Main Journal Screen
 *
 * UX intent:
 *   Write → interpret → update the day.
 *   No Save/Cancel. The entry lives inline on the daily page.
 *   Bottom nutrition bar tap → expands goals panel with smooth animation.
 */
import React, {
  useState, useRef, useCallback, useMemo, useEffect,
} from "react";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  KeyboardAvoidingView, Platform, StyleSheet, Keyboard, LayoutAnimation,
  useWindowDimensions, Modal, Alert, Appearance, Switch,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { SymbolView } from "expo-symbols";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import BottomSheet, { BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";
import { Calendar } from "react-native-calendars";
import { AnimatePresence, MotiView } from "moti";

import { useJournalStore, useDailyTotals, getEntriesForDate } from "../store/journalStore";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";
import { estimateNutritionFromText } from "../utils/nutrition";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { MealEntryCard } from "../components/journal/MealEntryCard";
import { ActionBar } from "../components/journal/ActionBar";
import { GoalsPanel } from "../components/journal/GoalsPanel";
import { colors, spacing, radius, typography } from "../theme";

const WEB_TOP_INSET = Platform.OS === "web" ? 16 : 0;
const WEB_BOTTOM_INSET = Platform.OS === "web" ? 34 : 0;

/* ── helpers ──────────────────────────────────────────────────────────────── */

function toDateStr(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function offsetDay(dateStr, n) {
  const d = new Date(`${dateStr}T12:00:00`);
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function formatDateLabel(dateStr) {
  const today = toDateStr(new Date());
  const yesterday = toDateStr(new Date(Date.now() - 86400000));
  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short" });
}

function formatMonthYear(dateStr) {
  const d = new Date(`${dateStr}T12:00:00`);
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

const glass = (fallback) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

/* ── settings sub-components ─────────────────────────────────────────────── */

// iOS-style rounded-square icon badge with SF Symbol support
function IconBadge({ color, icon, sfName }) {
  return (
    <View style={[sS.iconBadge, { backgroundColor: color }]}>
      {Platform.OS === "ios" && sfName ? (
        <SymbolView
          name={sfName}
          style={sS.symbol}
          type="hierarchical"
          tintColor="#ffffff"
        />
      ) : (
        <Text style={sS.badgeIcon}>{icon}</Text>
      )}
    </View>
  );
}

function NavRow({ badge, badgeColor, sfName, label, sublabel, value, onPress, isLast }) {
  const C = useThemeStore((s) => s.colors);
  const content = (
    <View style={[sS.row, isLast && sS.rowLast]}>
      {badge ? <IconBadge color={badgeColor} icon={badge} sfName={sfName} /> : null}
      <View style={sS.rowBody}>
        <Text style={[sS.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[sS.rowSub, { color: C.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[sS.rowVal, { color: C.textSecondary }]}>{value}</Text> : null}
      {onPress ? <Text style={[sS.chevron, { color: C.textTertiary }]}>›</Text> : null}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>{content}</TouchableOpacity>
  ) : content;
}

function ToggleRow({ badge, badgeColor, sfName, label, sublabel, value, onToggle, isLast }) {
  const C = useThemeStore((s) => s.colors);
  return (
    <View style={[sS.row, isLast && sS.rowLast]}>
      {badge ? <IconBadge color={badgeColor} icon={badge} sfName={sfName} /> : null}
      <View style={sS.rowBody}>
        <Text style={[sS.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[sS.rowSub, { color: C.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      <View style={[
        sS.toggleWrapper,
        { backgroundColor: value ? C.accentGreen : "rgba(120,120,128,0.32)" },
      ]}>
        <Switch
          value={value}
          onValueChange={onToggle}
          trackColor={{ false: "transparent", true: "transparent" }}
          thumbColor="#ffffff"
          ios_backgroundColor="transparent"
        />
      </View>
    </View>
  );
}

// Dark / Light mode segmented row — colorMode passed as prop from Index
function AppearanceRow({ colorMode, onToggle }) {
  const C = useThemeStore((s) => s.colors);
  const isDark = colorMode === "dark";
  return (
    <View style={sS.row}>
      <IconBadge
        color={isDark ? "#5e5ce6" : "#f59e0b"}
        icon={isDark ? "🌙" : "☀️"}
        sfName={isDark ? "moon.fill" : "sun.max.fill"}
      />
      <View style={sS.rowBody}>
        <Text style={[sS.rowLabel, { color: C.textPrimary }]}>Appearance</Text>
        <Text style={[sS.rowSub, { color: C.textSecondary }]}>{isDark ? "Dark" : "Light"}</Text>
      </View>
      <View style={sS.segmentedControl}>
        <TouchableOpacity
          style={[sS.segBtn, !isDark && sS.segBtnActive]}
          onPress={() => onToggle("light")}
          activeOpacity={0.75}
        >
          <Text style={[sS.segLabel, !isDark && sS.segLabelActive]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sS.segBtn, isDark && sS.segBtnActive]}
          onPress={() => onToggle("dark")}
          activeOpacity={0.75}
        >
          <Text style={[sS.segLabel, isDark && sS.segLabelActive]}>Dark</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Card({ children }) {
  const C = useThemeStore((s) => s.colors);
  return (
    <GlassView
      isInteractive={false}
      style={[sS.card, glass(C.glassBg)]}
    >
      {children}
    </GlassView>
  );
}

function SectionTitle({ title }) {
  const C = useThemeStore((s) => s.colors);
  return <Text style={[sS.sectionTitle, { color: C.textSecondary }]}>{title}</Text>;
}

/* ── main screen ─────────────────────────────────────────────────────────── */

export default function Index() {
  const {
    entries,
    selectedDate,
    setDate,
    addTextEntry,
    addImageEntry,
    removeEntry,
    editEntry,
  } = useJournalStore();
  const totals = useDailyTotals(entries);
  const savedMeals = useSettingsStore((state) => state.savedMeals);
  const addSavedMeal = useSettingsStore((state) => state.addSavedMeal);
  const removeSavedMeal = useSettingsStore((state) => state.removeSavedMeal);
  const insets = useSafeAreaInsets();
  const {
    isListening,
    transcript,
    error: speechError,
    startListening,
    stopListening,
    clearTranscript,
  } = useSpeechRecognition();

  /* theme — reactive via Zustand (safe on web, no hook-context issues) ------ */
  const C = useThemeStore((s) => s.colors);
  const colorMode = useThemeStore((s) => s.colorMode);
  const setColorMode = useThemeStore((s) => s.setColorMode);
  const handleToggleAppearance = useCallback((mode) => setColorMode(mode), [setColorMode]);

  const [isEditing, setIsEditing] = useState(false);
  const [cardIsEditing, setCardIsEditing] = useState(false);
  const [text, setText] = useState("");
  const textRef = useRef("");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [goalsExpanded, setGoalsExpanded] = useState(false);
  const [autoTimeZone, setAutoTimeZone] = useState(true);
  const [reminders, setReminders] = useState(false);
  const [settingsView, setSettingsView] = useState("main");
  const [saveMealModalVisible, setSaveMealModalVisible] = useState(false);
  const [savedMealName, setSavedMealName] = useState("");
  const [pendingSavedMeal, setPendingSavedMeal] = useState(null);
  const [cameraMenuVisible, setCameraMenuVisible] = useState(false);

  const { width } = useWindowDimensions();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const swipeRef = useRef(null);
  const calSheetRef = useRef(null);
  const settingsSheetRef = useRef(null);
  const dictationBaseTextRef = useRef("");
  const isListeningRef = useRef(isListening);

  const prevDate = useMemo(() => offsetDay(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => offsetDay(selectedDate, +1), [selectedDate]);

  const isThinking = useMemo(() => entries.some((e) => e.isProcessing), [entries]);

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);
  const monthYearLabel = useMemo(() => formatMonthYear(selectedDate), [selectedDate]);
  const savedMealsLabel = useMemo(
    () => `${savedMeals.length} saved meal${savedMeals.length !== 1 ? "s" : ""}`,
    [savedMeals.length],
  );

  /* keyboard visibility --------------------------------------------------- */
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const willShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const willHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const didHide  = "keyboardDidHide";

    // Show: mark visible + collapse goals + capture keyboard height
    const sL = Keyboard.addListener(willShow, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
      setGoalsExpanded(false);
    });

    // willHide: hide GoalsPanel early (smooth, before keyboard finishes moving)
    const wL = Platform.OS === "ios"
      ? Keyboard.addListener(willHide, () => {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setKeyboardVisible(false);
          setKeyboardHeight(0);
        })
      : null;

    // didHide: reset editing state only after keyboard is fully gone
    // Covers every dismiss path: gesture, system, tap-outside, button.
    const dL = Keyboard.addListener(didHide, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(false); // no-op on iOS (already false), needed on Android
      setKeyboardHeight(0);
      if (!isListeningRef.current) {
        setIsEditing(false);
      }
      setCardIsEditing(false);
    });

    return () => {
      sL.remove();
      wL?.remove();
      dL.remove();
    };
  }, []);

  /* re-center swiper whenever selectedDate changes (swipe or calendar pick) */
  useEffect(() => {
    swipeRef.current?.scrollTo({ x: width, animated: false });
  }, [selectedDate, width]);

  useEffect(() => {
    if (!transcript) return;

    const base = dictationBaseTextRef.current.trim();
    const nextText = [base, transcript].filter(Boolean).join(" ").trim();
    textRef.current = nextText;
    setText(nextText);

    if (!isEditing) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [transcript, isEditing]);

  /* handlers -------------------------------------------------------------- */
  const debounceTimerRef = useRef(null);

  const cancelDebounce = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelDebounce(), [cancelDebounce]);

  const handleDaySwipe = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x < width * 0.5) {
      cancelDebounce();
      Keyboard.dismiss();
      setIsEditing(false);
      textRef.current = "";
      setText("");
      setDate(offsetDay(selectedDate, -1));
    } else if (x > width * 1.5) {
      cancelDebounce();
      Keyboard.dismiss();
      setIsEditing(false);
      textRef.current = "";
      setText("");
      setDate(offsetDay(selectedDate, +1));
    }
    // If user bounced back to center, no state change needed
  }, [cancelDebounce, selectedDate, setDate, width]);

  const handleStartEditing = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleSubmit = useCallback(async () => {
    cancelDebounce();

    if (isListening) {
      stopListening();
    }

    const raw = textRef.current.trim();
    if (!raw) {
      // Empty submit = dismiss keyboard
      Keyboard.dismiss();
      setIsEditing(false);
      return;
    }

    const blocks = raw.split(/\n\s*\n/).map((b) => b.trim()).filter(Boolean);
    textRef.current = "";
    setText("");
    clearTranscript();
    dictationBaseTextRef.current = "";

    for (const block of blocks) {
      await addTextEntry(block);
    }

    // Stay in editing mode — notebook cursor stays at the bottom
    // The user can dismiss with the keyboard button when done
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [cancelDebounce, addTextEntry, clearTranscript, isListening, stopListening]);

  const handleTextChange = useCallback((value) => {
    textRef.current = value;
    setText(value);
    cancelDebounce();
    if (value.trim()) {
      debounceTimerRef.current = setTimeout(() => {
        debounceTimerRef.current = null;
        handleSubmit();
      }, 1000);
    }
  }, [cancelDebounce, handleSubmit]);

  const handleDismissKeyboard = useCallback(() => {
    cancelDebounce();
    if (isListening) {
      stopListening();
    }
    Keyboard.dismiss();
    setIsEditing(false);
  }, [cancelDebounce, isListening, stopListening]);

  const handleCardEditingChange = useCallback((val) => {
    setCardIsEditing(val);
  }, []);

  const handleToggleMic = useCallback(async () => {
    if (isListening) {
      stopListening();
      return;
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);

    dictationBaseTextRef.current = text.trim();
    const started = await startListening();
    if (!started) {
      dictationBaseTextRef.current = "";
    }
  }, [isListening, startListening, stopListening, text]);

  const handlePickImage = useCallback(async (source = "library") => {
    try {
      if (Platform.OS !== "web") {
        const permission =
          source === "camera"
            ? await ImagePicker.requestCameraPermissionsAsync()
            : await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (!permission?.granted) {
          Alert.alert(
            "Permissao necessaria",
            source === "camera"
              ? "Permita acesso a camera para anexar fotos no chat."
              : "Permita acesso a biblioteca de fotos para anexar imagens no chat.",
          );
          return;
        }
      }

      const picker =
        source === "camera"
          ? ImagePicker.launchCameraAsync
          : ImagePicker.launchImageLibraryAsync;

      const result = await picker({
        mediaTypes: ["images"],
        allowsEditing: false,
        allowsMultipleSelection: false,
        selectionLimit: 1,
        quality: 1,
        presentationStyle:
          source === "library"
            ? ImagePicker.UIImagePickerPresentationStyle.AUTOMATIC
            : undefined,
        cameraType:
          source === "camera"
            ? ImagePicker.CameraType.back
            : undefined,
      });

      if (result.canceled || !result.assets?.length) {
        return;
      }

      setIsEditing(false);
      await addImageEntry({
        ...result.assets[0],
        source,
      });
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (cameraError) {
      Alert.alert(
        source === "camera"
          ? "Nao foi possivel abrir a camera"
          : "Nao foi possivel abrir a biblioteca",
        cameraError?.message ||
          "Tente novamente e, se preciso, libere acesso nas configuracoes do aparelho.",
      );
    }
  }, [addImageEntry]);

  const closeCameraMenu = useCallback(() => setCameraMenuVisible(false), []);

  const handleCameraMenuAction = useCallback((action) => {
    setCameraMenuVisible(false);
    // Small delay so modal dismisses before launching picker
    setTimeout(() => {
      if (action === "scan") {
        Alert.alert("Scan Menu", "Menu scanning coming soon!");
      } else {
        void handlePickImage(action);
      }
    }, 200);
  }, [handlePickImage]);

  const handleOpenCamera = useCallback(() => {
    if (Platform.OS === "ios") {
      setCameraMenuVisible(true);
      return;
    }

    if (Platform.OS === "android") {
      Alert.alert(
        "Adicionar imagem",
        "Escolha de onde enviar a foto.",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Biblioteca", onPress: () => void handlePickImage("library") },
          { text: "Camera", onPress: () => void handlePickImage("camera") },
        ],
      );
      return;
    }

    void handlePickImage("library");
  }, [handlePickImage]);

  const handleAddSavedMeal = useCallback(() => {
    const currentText = text.trim();
    const latestEntry = entries[entries.length - 1];
    const sourceText =
      currentText ||
      latestEntry?.rawText?.trim() ||
      latestEntry?.parsedResult?.items?.map((item) => item.name).join(", ") ||
      "";

    if (!sourceText) {
      handleStartEditing();
      Alert.alert(
        "Nada para salvar",
        "Digite uma refeicao primeiro para salvar como refeicao padrao.",
      );
      return;
    }

    const parsedResult =
      currentText
        ? estimateNutritionFromText(sourceText, savedMeals)
        : latestEntry?.parsedResult ?? estimateNutritionFromText(sourceText, savedMeals);

    const suggestedName =
      sourceText.length > 40 ? `${sourceText.slice(0, 40).trim()}...` : sourceText;

    setPendingSavedMeal({
      items: sourceText,
      totals: parsedResult.totals,
    });
    setSavedMealName(suggestedName);
    setSaveMealModalVisible(true);
  }, [entries, handleStartEditing, savedMeals, text]);

  const handleConfirmSaveMeal = useCallback(() => {
    const name = savedMealName.trim();
    if (!name || !pendingSavedMeal) return;

    addSavedMeal({
      name,
      items: pendingSavedMeal.items,
      calories: pendingSavedMeal.totals.calories,
      protein_g: pendingSavedMeal.totals.protein_g,
      carbs_g: pendingSavedMeal.totals.carbs_g,
      fat_g: pendingSavedMeal.totals.fat_g,
    });

    setSaveMealModalVisible(false);
    setSavedMealName("");
    setPendingSavedMeal(null);
    Alert.alert("Saved meal criada", `"${name}" foi salva para reutilizar no chat.`);
  }, [addSavedMeal, pendingSavedMeal, savedMealName]);

  const handleDeleteSavedMeal = useCallback((meal) => {
    Alert.alert(
      "Excluir refeicao salva?",
      `A refeicao "${meal.name}" sera removida da lista.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: () => removeSavedMeal(meal.id),
        },
      ],
    );
  }, [removeSavedMeal]);

  const handleToggleGoals = useCallback(() => setGoalsExpanded((v) => !v), []);

  const openCalendar = useCallback(() => calSheetRef.current?.expand(), []);
  const openSettings = useCallback(() => {
    setSettingsView("main");
    settingsSheetRef.current?.expand();
  }, []);
  const closeCalendar = useCallback(() => calSheetRef.current?.close(), []);
  const closeSettings = useCallback(() => {
    setSettingsView("main");
    settingsSheetRef.current?.close();
  }, []);

  const markedDates = useMemo(() => {
    const marks = {
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
            borderWidth: 2,
            borderColor: C.accentPurple,
            borderRadius: 18,
          },
          text: { color: C.accentPurple, fontWeight: "600" },
        },
      };
    }
    return marks;
  }, [selectedDate, todayStr, C]);

  /* render ---------------------------------------------------------------- */
  return (
    <View style={[styles.root, { backgroundColor: C.bgPrimary }]}>
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + WEB_TOP_INSET + 10 }]}>
        {/* Left column — fixed width to match right */}
        <View style={styles.headerSide}>
          <Text style={styles.logo}>🥗</Text>
        </View>

        {/* Center: Date pill — true center via flex */}
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={openCalendar} activeOpacity={0.7}>
            <GlassView isInteractive style={[styles.datePill, glass("rgba(255,255,255,0.10)")]}>
              <Text style={[styles.dateLabel, { color: C.textPrimary }]}>{dateLabel}</Text>
            </GlassView>
          </TouchableOpacity>
        </View>

        {/* Right column — fixed width to match left */}
        <View style={styles.headerSideRight}>
          <TouchableOpacity onPress={openSettings} activeOpacity={0.7}>
            <GlassView isInteractive style={[styles.rightPill, glass("rgba(255,255,255,0.10)")]}>
              <Text style={styles.streakText}>🔥</Text>
              <Text style={[styles.streakCount, { color: C.textPrimary }]}>1</Text>
              <View style={styles.pillDivider} />
              {isThinking ? (
                <Text style={styles.thinkingText}>Thinking...</Text>
              ) : Platform.OS === "ios" ? (
                <SymbolView
                  name="gear"
                  style={styles.gearSymbol}
                  type="monochrome"
                  tintColor={C.textSecondary}
                />
              ) : (
                <Text style={[styles.gearIcon, { color: C.textSecondary }]}>⚙</Text>
              )}
            </GlassView>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── 3-page horizontal day swiper ────────────────────────────── */}
        <ScrollView
          ref={swipeRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          scrollEnabled={!keyboardVisible}
          onMomentumScrollEnd={handleDaySwipe}
          keyboardShouldPersistTaps="handled"
          style={styles.flex}
          contentOffset={{ x: width, y: 0 }}
        >
          {[prevDate, selectedDate, nextDate].map((date, idx) => {
            const isActive = idx === 1;
            const dayEntries = isActive ? entries : getEntriesForDate(date);
            return (
              <ScrollView
                key={date}
                ref={isActive ? scrollRef : null}
                style={{ width }}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                {/* Listening badge — active page only */}
                {isActive && isListening && (
                  <View style={styles.listeningBadge}>
                    <View style={styles.listeningDot} />
                    <Text style={styles.listeningText}>Ouvindo…</Text>
                  </View>
                )}

                {/* Speech error — active page only */}
                {isActive && speechError ? (
                  <Text style={styles.errorText}>{speechError}</Text>
                ) : null}

                {/* ── Entries always rendered (notebook page) ──────────── */}
                {dayEntries.map((entry) => (
                  <MealEntryCard key={entry.id} entry={entry} onDelete={isActive ? removeEntry : undefined} onEdit={isActive ? editEntry : undefined} onEditingChange={isActive ? handleCardEditingChange : undefined} />
                ))}

                {/* Inactive day empty state */}
                {!isActive && dayEntries.length === 0 && (
                  <Text style={[styles.placeholder, { color: C.textTertiary }]}>Sem registros neste dia.</Text>
                )}

                {/* ── Input block — always visible on active day ────────── */}
                {isActive && (
                  isEditing ? (
                    <TextInput
                      ref={inputRef}
                      value={text}
                      onChangeText={handleTextChange}
                      placeholder={
                        dayEntries.length === 0
                          ? "O que você comeu?..."
                          : "Continuar a anotar..."
                      }
                      placeholderTextColor={C.textTertiary}
                      style={[styles.inlineInput, { color: C.textPrimary }]}
                      multiline
                      autoFocus
                      blurOnSubmit={false}
                    />
                  ) : (
                    <TouchableOpacity
                      onPress={handleStartEditing}
                      style={styles.writingPromptArea}
                      activeOpacity={0.5}
                    >
                      <Text
                        style={[
                          dayEntries.length === 0 ? styles.placeholder : styles.continuePrompt,
                          { color: C.textTertiary },
                        ]}
                      >
                        {dayEntries.length === 0
                          ? "O que você comeu?..."
                          : "Continuar a anotar..."}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </ScrollView>
            );
          })}
        </ScrollView>

        {/* ── Bottom area: GoalsPanel + ActionBar pinned to bottom ─────── */}
        {(() => {
          const anyEditing = isEditing || cardIsEditing;
          return (
            <View style={[
              styles.bottomContainer,
              {
                bottom: keyboardVisible && anyEditing
                  ? keyboardHeight
                  : insets.bottom + WEB_BOTTOM_INSET,
                paddingBottom: keyboardVisible && anyEditing ? 0 : undefined,
              },
            ]}>
              <AnimatePresence>
                {goalsExpanded && !(keyboardVisible && anyEditing) && (
                  <MotiView
                    from={{ opacity: 0, translateY: 20, scale: 0.97 }}
                    animate={{ opacity: 1, translateY: 0, scale: 1 }}
                    exit={{ opacity: 0, translateY: 12, scale: 0.98 }}
                    transition={{
                      type: "spring",
                      damping: 20,
                      stiffness: 180,
                      mass: 0.8,
                    }}
                  >
                    <GoalsPanel totals={totals} />
                  </MotiView>
                )}
              </AnimatePresence>

              <ActionBar
                totals={totals}
                isEditing={anyEditing}
                isListening={isListening}
                goalsExpanded={goalsExpanded}
                onToggleGoals={handleToggleGoals}
                onToggleMic={handleToggleMic}
                onOpenCamera={handleOpenCamera}
                onAddSavedMeal={handleAddSavedMeal}
                onDismissKeyboard={handleDismissKeyboard}
              />
            </View>
          );
        })()}
      </KeyboardAvoidingView>

      {/* ── Camera context menu ────────────────────────────────────────── */}
      <Modal
        visible={cameraMenuVisible}
        transparent
        animationType="fade"
        onRequestClose={closeCameraMenu}
      >
        <View style={styles.cameraMenuOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={closeCameraMenu}
          />
          <View style={styles.cameraMenuAnchor}>
            <GlassView style={[styles.cameraMenu, glass("rgba(40,40,40,0.92)")]}>

              <TouchableOpacity
                style={styles.cameraMenuItem}
                activeOpacity={0.6}
                onPress={() => handleCameraMenuAction("scan")}
              >
                {Platform.OS === "ios" ? (
                  <SymbolView
                    name="doc.text.viewfinder"
                    style={styles.cameraMenuSymbol}
                    tintColor={C.accentBlue}
                  />
                ) : (
                  <Text style={[styles.cameraMenuSymbol, { fontSize: 18, textAlign: "center" }]}>📄</Text>
                )}
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Scan Menu</Text>
              </TouchableOpacity>

              <View style={styles.cameraMenuSep} />

              <TouchableOpacity
                style={styles.cameraMenuItem}
                activeOpacity={0.6}
                onPress={() => handleCameraMenuAction("library")}
              >
                {Platform.OS === "ios" ? (
                  <SymbolView
                    name="photo.on.rectangle"
                    style={styles.cameraMenuSymbol}
                    tintColor={C.accentGreen}
                  />
                ) : (
                  <Text style={[styles.cameraMenuSymbol, { fontSize: 18, textAlign: "center" }]}>🖼️</Text>
                )}
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Choose from Library</Text>
              </TouchableOpacity>

              <View style={styles.cameraMenuSep} />

              <TouchableOpacity
                style={styles.cameraMenuItem}
                activeOpacity={0.6}
                onPress={() => handleCameraMenuAction("camera")}
              >
                {Platform.OS === "ios" ? (
                  <SymbolView
                    name="camera"
                    style={styles.cameraMenuSymbol}
                    tintColor={C.accentPink}
                  />
                ) : (
                  <Text style={[styles.cameraMenuSymbol, { fontSize: 18, textAlign: "center" }]}>📷</Text>
                )}
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Take Photo</Text>
              </TouchableOpacity>
            </GlassView>
          </View>
        </View>
      </Modal>

      {/* ── Calendar sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        ref={calSheetRef}
        index={-1}
        snapPoints={["65%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: C.bgSecondary, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        handleIndicatorStyle={{ backgroundColor: C.systemGray3 }}
      >
        <BottomSheetView style={styles.calSheet}>
          {/* Today | Apr 2026 | Done */}
          <View style={styles.calHeader}>
            <TouchableOpacity
              onPress={() => { setDate(todayStr); closeCalendar(); }}
              activeOpacity={0.7}
            >
              <Text style={[styles.calAction, { color: C.accentBlue }]}>Today</Text>
            </TouchableOpacity>
            <Text style={[styles.calMonth, { color: C.textPrimary }]}>{monthYearLabel}</Text>
            <TouchableOpacity onPress={closeCalendar} activeOpacity={0.7}>
              <Text style={[styles.calAction, { color: C.accentBlue }]}>Done</Text>
            </TouchableOpacity>
          </View>

          <Calendar
            current={selectedDate}
            onDayPress={(day) => { setDate(day.dateString); closeCalendar(); }}
            markedDates={markedDates}
            markingType="custom"
            hideArrows={false}
            renderArrow={(dir) => (
              <Text style={[styles.calArrow, { color: C.textSecondary }]}>{dir === "left" ? "‹" : "›"}</Text>
            )}
            theme={{
              calendarBackground: "transparent",
              textSectionTitleColor: C.systemGray2,
              selectedDayBackgroundColor: C.accentGreen,
              selectedDayTextColor: "#000",
              todayTextColor: C.accentPurple,
              dayTextColor: C.textPrimary,
              textDisabledColor: C.textTertiary,
              monthTextColor: "transparent",
              textMonthFontSize: 0,
              textDayFontSize: 16,
              textDayFontWeight: "400",
              textDayHeaderFontSize: 13,
              textDayHeaderFontWeight: "500",
              "stylesheet.calendar.header": {
                header: { height: 0, overflow: "hidden" },
              },
            }}
          />
        </BottomSheetView>
      </BottomSheet>

      {/* ── Settings sheet ──────────────────────────────────────────────── */}
      <BottomSheet
        ref={settingsSheetRef}
        index={-1}
        snapPoints={["90%"]}
        enablePanDownToClose
        backgroundStyle={{ backgroundColor: C.bgSecondary, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        handleIndicatorStyle={{ backgroundColor: C.systemGray3 }}
      >
          <BottomSheetScrollView
            contentContainerStyle={[styles.settingsContent, { paddingBottom: insets.bottom + 40 }]}
          >
            {/* Header */}
            <View style={sS.header}>
              <Text style={[sS.title, { color: C.textPrimary }]}>Settings</Text>
              <TouchableOpacity onPress={closeSettings} activeOpacity={0.7} style={sS.closeBtn}>
                <Text style={[sS.closeBtnText, { color: C.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Profile */}
            <Card>
              <NavRow label="Name"  value="Pedro Moreira" />
              <NavRow label="Email" value="pedrohenriqmoreira@gmail.com" isLast />
            </Card>

            <SectionTitle title="Goals & Targets" />
            <Card>
              <NavRow
                badge="⚖️" badgeColor="#3b82f6" sfName="scalemass.fill"
                label="61.5 kg"
                sublabel="🔥 2,729 cal · P 136g · C 303g · F 91g"
              />
              <NavRow
                badge="📊" badgeColor="#3b82f6" sfName="chart.bar.fill"
                label="Manage Nutrition Goals"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Health Profile" />
            <Card>
              <NavRow
                badge="❤️" badgeColor="#ef4444" sfName="heart.fill"
                label="61.5 kg (current weight)"
                sublabel="Moderately Active"
              />
              <NavRow
                badge="📋" badgeColor="#ef4444" sfName="doc.text.fill"
                label="Manage Health Info"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Weight Tracking" />
            <Card>
              <NavRow
                badge="📉" badgeColor="#a855f7" sfName="chart.line.downtrend.xyaxis"
                label="61.5 kg"
                sublabel="Log weight to see trends"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Saved Meals" />
            <Card>
              <NavRow
                badge="🍽️" badgeColor="#f97316" sfName="fork.knife"
                label="Manage Saved Meals"
                sublabel={savedMealsLabel}
                onPress={() => setSettingsView("savedMeals")} isLast
              />
            </Card>

            <SectionTitle title="Preferences" />
            <Card>
              <NavRow
                badge="🎯" badgeColor="#f97316" sfName="target"
                label="Calorie Estimate Bias"
                sublabel="Accurate"
                onPress={() => {}}
              />
              <ToggleRow
                badge="🔔" badgeColor="#f97316" sfName="bell.fill"
                label="Daily Tracking Reminders"
                value={reminders}
                onToggle={() => setReminders(v => !v)}
                isLast
              />
            </Card>

            <SectionTitle title="Device Settings" />
            <Card>
              <AppearanceRow colorMode={colorMode} onToggle={handleToggleAppearance} />
              <ToggleRow
                badge="🕐" badgeColor="#22c55e" sfName="clock.fill"
                label="Automatic Time Zone"
                value={autoTimeZone}
                onToggle={() => setAutoTimeZone(v => !v)}
              />
              <NavRow
                badge="🎤" badgeColor="#3b82f6" sfName="mic.fill"
                label="Dictation Language"
                value="Auto-detect ▾"
                isLast
              />
            </Card>

            <SectionTitle title="Subscription" />
            <Card>
              <NavRow
                badge="👑" badgeColor="#eab308" sfName="crown.fill"
                label="Subscription Active"
                sublabel="Tasanka 3 Apr 2025"
              />
              <NavRow label="Manage Subscription" onPress={() => {}} isLast />
            </Card>

            <Card>
              <NavRow badge="⭐" badgeColor="#a855f7" sfName="star.fill" label="Give Feedback" onPress={() => {}} />
              <NavRow badge="💜" badgeColor="#a855f7" sfName="info.circle.fill" label="About the App" onPress={() => {}} isLast />
            </Card>

            {/* Destructive */}
            <Card>
              <NavRow badge="💬" badgeColor="#3b82f6" sfName="bubble.left.fill"  label="Contact Support" onPress={() => {}} />
              <NavRow badge="🗑️" badgeColor="#636366" sfName="trash.fill"         label="Clear Local Cache" onPress={() => {}} />
              <NavRow badge="📤" badgeColor="#f97316" sfName="square.and.arrow.up.fill" label="Export Data" onPress={() => {}} />
              <NavRow badge="⚠️" badgeColor="#ef4444" sfName="exclamationmark.triangle.fill" label="Delete Account" onPress={() => {}} />
              <NavRow badge="🚪" badgeColor="#ef4444" sfName="rectangle.portrait.and.arrow.right.fill" label="Sign Out" onPress={() => {}} isLast />
            </Card>
          </BottomSheetScrollView>
      </BottomSheet>

      <Modal
        animationType="slide"
        transparent
        visible={settingsView === "savedMeals"}
        onRequestClose={() => setSettingsView("main")}
      >
        <View style={styles.modalBackdrop}>
          <GlassView isInteractive={false} style={[styles.modalCard, styles.managerCard, glass("rgba(255,255,255,0.09)")]}>
            <View style={styles.managerHeader}>
              <TouchableOpacity
                onPress={() => setSettingsView("main")}
                activeOpacity={0.8}
                style={styles.managerHeaderBtn}
              >
                <Text style={[styles.managerHeaderBtnText, { color: C.textSecondary }]}>‹</Text>
              </TouchableOpacity>
              <Text style={[styles.managerTitle, { color: C.textPrimary }]}>Saved Meals</Text>
              <TouchableOpacity
                onPress={() => setSettingsView("main")}
                activeOpacity={0.8}
                style={styles.managerHeaderBtn}
              >
                <Text style={[styles.managerHeaderBtnText, { color: C.textSecondary }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.managerList}
              contentContainerStyle={styles.managerListContent}
              showsVerticalScrollIndicator={false}
            >
              {savedMeals.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={[styles.emptyTitle, { color: C.textPrimary }]}>No saved meals yet</Text>
                  <Text style={[styles.emptySub, { color: C.textSecondary }]}>
                    Digite uma refeicao no chat e toque no + para salva-la com macros.
                  </Text>
                </View>
              ) : (
                savedMeals.map((meal) => (
                  <GlassView isInteractive key={meal.id} style={[styles.savedMealCard, glass("rgba(255,255,255,0.06)")]}>
                    <View style={styles.savedMealHeader}>
                      <Text style={[styles.savedMealName, { color: C.textPrimary }]}>{meal.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteSavedMeal(meal)}
                        activeOpacity={0.8}
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={[styles.savedMealMacros, { color: C.textSecondary }]}>
                      🔥 {Math.round(meal.calories)} cal · P {Math.round(meal.protein_g)}g ·
                      {" "}C {Math.round(meal.carbs_g)}g · F {Math.round(meal.fat_g)}g
                    </Text>
                    <Text style={[styles.savedMealItems, { color: C.textTertiary }]}>{meal.items}</Text>
                  </GlassView>
                ))
              )}
            </ScrollView>
          </GlassView>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent
        visible={saveMealModalVisible}
        onRequestClose={() => {
          setSaveMealModalVisible(false);
          setPendingSavedMeal(null);
        }}
      >
        <View style={styles.modalBackdrop}>
          <GlassView isInteractive={false} style={[styles.modalCard, glass("rgba(255,255,255,0.09)")]}>
            <Text style={[styles.modalTitle, { color: C.textPrimary }]}>Save meal</Text>
            <Text style={[styles.modalDescription, { color: C.textSecondary }]}>
              Escolha o nome que o usuario vai digitar depois no chat.
            </Text>

            <TextInput
              value={savedMealName}
              onChangeText={setSavedMealName}
              placeholder="Ex.: cafe da manha padrao"
              placeholderTextColor={C.textTertiary}
              style={[styles.modalInput, { color: C.textPrimary }]}
              autoFocus
            />

            {pendingSavedMeal ? (
              <Text style={[styles.modalMacros, { color: C.textSecondary }]}>
                🔥 {Math.round(pendingSavedMeal.totals.calories)} cal · P{" "}
                {Math.round(pendingSavedMeal.totals.protein_g)}g · C{" "}
                {Math.round(pendingSavedMeal.totals.carbs_g)}g · F{" "}
                {Math.round(pendingSavedMeal.totals.fat_g)}g
              </Text>
            ) : null}

            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => {
                  setSaveMealModalVisible(false);
                  setPendingSavedMeal(null);
                }}
                activeOpacity={0.8}
                style={styles.modalSecondaryBtn}
              >
                <Text style={[styles.modalSecondaryText, { color: C.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleConfirmSaveMeal}
                activeOpacity={0.8}
                style={[styles.modalPrimaryBtn, { backgroundColor: C.accentGreen }]}
              >
                <Text style={styles.modalPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>
          </GlassView>
        </View>
      </Modal>
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bgPrimary },
  flex: { flex: 1 },
  bottomContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },

  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerSide: { flex: 1 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerSideRight: { flex: 1, alignItems: "flex-end" },
  logo: { fontSize: 28 },
  datePillCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Date pill */
  datePill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 3,
    borderRadius: radius.full,
    alignItems: "center",
  },
  dateLabel: { ...typography.headline, fontWeight: "600" },

  /* Right pill — sibling of date pill */
  rightPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm + 3,
    borderRadius: radius.full,
    gap: spacing.xs,
  },
  streakText:  { fontSize: 15 },
  streakCount: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  pillDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: spacing.xs,
  },
  gearIcon:   { fontSize: 15, color: colors.textSecondary },
  gearSymbol: { width: 16, height: 16 },
  thinkingText: { fontSize: 12, color: colors.accentBlue, fontWeight: "500", letterSpacing: -0.1 },

  /* Scroll — extra paddingBottom clears the absolute bottom bar */
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: 200,
    flexGrow: 1,
  },

  /* Inline input — transparent, note-like, sits below entries */
  inlineInput: {
    ...typography.body,
    color: "rgba(255,255,255,0.90)",
    minHeight: 48,
    textAlignVertical: "top",
    paddingTop: spacing.lg,
    letterSpacing: -0.3,
    lineHeight: 26,
  },

  /* Placeholder — subtle notebook opening prompt */
  placeholder: {
    ...typography.body,
    color: colors.systemGray3,
    paddingTop: spacing.xs,
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  /* Writing prompt shown below entries when keyboard is closed */
  writingPromptArea: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    minHeight: 64,
  },
  continuePrompt: {
    fontSize: 15,
    color: colors.systemGray4,
    letterSpacing: -0.2,
    fontStyle: "italic",
  },

  /* Listening indicator */
  listeningBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.20)",
    marginBottom: spacing.md,
  },
  listeningDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.accentRed,
  },
  listeningText: { fontSize: 13, color: colors.accentRed },
  errorText: {
    fontSize: 13,
    color: colors.accentRed,
    marginBottom: spacing.md,
  },

  /* Bottom sheets */
  sheetBg:     { backgroundColor: "rgba(30,30,30,0.92)", borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
  sheetHandle: { backgroundColor: colors.systemGray3 },

  /* Calendar sheet */
  calSheet:  { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
  calHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: spacing.lg,
  },
  calAction: { fontSize: 16, fontWeight: "500", color: colors.accentBlue },
  calMonth:  { ...typography.headline, fontWeight: "600" },
  calArrow:  { fontSize: 22, color: colors.textSecondary, lineHeight: 26 },

  /* Settings sheet */
  settingsContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
  },
  modalCard: {
    width: "100%",
    borderRadius: radius.xl,
    padding: spacing.xl,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    overflow: "hidden",
  },
  managerCard: {
    maxHeight: "78%",
  },
  managerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.lg,
  },
  managerHeaderBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  managerHeaderBtnText: {
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: "600",
  },
  managerTitle: {
    ...typography.title3,
    color: colors.textPrimary,
  },
  managerList: {
    width: "100%",
  },
  managerListContent: {
    gap: spacing.md,
    paddingBottom: spacing.xs,
  },
  emptyState: {
    paddingVertical: spacing.xl,
    alignItems: "center",
  },
  emptyTitle: {
    ...typography.subhead,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  emptySub: {
    ...typography.footnote,
    color: colors.systemGray,
    textAlign: "center",
  },
  savedMealCard: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  savedMealHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  savedMealName: {
    ...typography.subhead,
    color: colors.textPrimary,
    flex: 1,
  },
  savedMealMacros: {
    ...typography.footnote,
    color: colors.systemGray,
    marginTop: spacing.sm,
  },
  savedMealItems: {
    ...typography.caption1,
    color: colors.systemGray3,
    marginTop: spacing.xs,
  },
  deleteBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.14)",
  },
  deleteBtnText: {
    fontSize: 13,
    color: colors.accentRed,
    fontWeight: "700",
  },
  modalTitle: {
    ...typography.title3,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  modalDescription: {
    ...typography.footnote,
    color: colors.systemGray,
    marginBottom: spacing.lg,
  },
  modalInput: {
    ...typography.body,
    color: colors.textPrimary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  modalMacros: {
    ...typography.footnote,
    color: colors.systemGray,
    marginTop: spacing.md,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalSecondaryBtn: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  modalSecondaryText: {
    ...typography.subhead,
    color: colors.textSecondary,
  },
  modalPrimaryBtn: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm + 2,
    backgroundColor: colors.accentGreen,
  },
  modalPrimaryText: {
    ...typography.subhead,
    color: "#000",
    fontWeight: "700",
  },

  /* Camera context menu */
  cameraMenuOverlay: {
    flex: 1,
  },
  cameraMenuAnchor: {
    position: "absolute",
    bottom: spacing.xl + 60,
    right: spacing.xl,
  },
  cameraMenu: {
    borderRadius: radius.xl,
    overflow: "hidden",
    minWidth: 240,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 8,
  },
  cameraMenuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg + 2,
    paddingVertical: spacing.md + 2,
    gap: spacing.md,
  },
  cameraMenuSep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginHorizontal: spacing.md,
  },
  cameraMenuLabel: {
    ...typography.body,
    color: colors.textPrimary,
    fontWeight: "500",
  },
  cameraMenuSymbol: {
    width: 22,
    height: 22,
  },
});

/* ── settings styles ───────────────────────────────────────────────────────── */
const sS = StyleSheet.create({
  /* Header */
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: { fontSize: 22, fontWeight: "700", letterSpacing: 0.35, color: "#f5f5f5" },
  closeBtn: {
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  closeBtnText: { fontSize: 14, fontWeight: "500", lineHeight: 18, color: "#8e8e93" },

  /* Section label */
  sectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: spacing.sm,
    marginTop: spacing.xl + 4,
    paddingHorizontal: spacing.sm,
    color: "#636366",
  },

  /* Card container */
  card: { borderRadius: radius.xl, overflow: "hidden" },

  /* Row layout */
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 56,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
    gap: spacing.md,
  },
  rowLast: { borderBottomWidth: 0 },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 16, fontWeight: "400", letterSpacing: -0.2, color: "#f5f5f5" },
  rowSub: { fontSize: 12, marginTop: 2, letterSpacing: -0.1, color: "#8e8e93" },
  rowVal:  { fontSize: 14, color: "#8e8e93" },
  chevron: { fontSize: 20, lineHeight: 24, color: "#48484a" },

  /* iOS-style icon badge — colored rounded square */
  iconBadge: {
    width: 32, height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  symbol: { width: 18, height: 18 },

  /* Glass wrapper for native Switch — clips glass tint to switch bounds */
  toggleWrapper: {
    borderRadius: 15.5,
    overflow: "hidden",
    flexShrink: 0,
  },
  badgeIcon: { fontSize: 17, lineHeight: 22 },

  /* Appearance segmented control */
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: "rgba(120,120,128,0.18)",
    borderRadius: radius.md,
    padding: 2,
    gap: 2,
  },
  segBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
  segBtnActive: {
    backgroundColor: "rgba(255,255,255,0.18)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  segLabel: { fontSize: 13, fontWeight: "500", color: "rgba(255,255,255,0.55)" },
  segLabelActive: { color: "#ffffff", fontWeight: "600" },
});
