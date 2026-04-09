/**
 * Main Journal Screen
 *
 * UX intent:
 *   Write → interpret → update the day.
 *   No Save/Cancel. The entry lives inline on the daily page.
 *   Bottom nutrition bar tap → opens the goals sheet.
 */
import React, {
  useState, useRef, useCallback, useMemo, useEffect,
} from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  View, Text, TextInput, TouchableOpacity, ScrollView, FlatList, Image, Pressable,
  KeyboardAvoidingView, Platform, StyleSheet, Keyboard, LayoutAnimation,
  useWindowDimensions, Modal, Alert,
} from "react-native";

import * as ImagePicker from "expo-image-picker";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

import {
  useJournalStore,
  useDailyTotals,
  getEntriesForDate,
  getJournalForDate,
} from "../store/journalStore";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";
import { estimateNutritionFromText } from "../utils/nutrition";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { analyzeJournalText } from "../services/journalAnalysis";
import { MealEntryCard } from "../components/journal/MealEntryCard";
import { ActionBar } from "../components/journal/ActionBar";
import { LegacyJournalSummaryBar } from "../components/journal/LegacyJournalSummaryBar";
import { ThinkingShimmer } from "../components/journal/ThinkingShimmer";
import { AppSymbol } from "../components/icons/AppSymbol";
import {
  useFloatingTabBarInsets,
  useFloatingTabBarScroll,
} from "../hooks/useFloatingTabBar";
import { useJournalUiStore } from "../store/journalUiStore";
import journalHaptics from "../utils/journalHaptics";
import { colors, spacing, radius, typography } from "../theme";
import { supportsNativeBottomAccessory } from "../utils/iosNavigation";

const WEB_TOP_INSET = Platform.OS === "web" ? 16 : 0;
const WEB_BOTTOM_INSET = Platform.OS === "web" ? 34 : 0;
const HEADER_DOG_ICON = require("../../assets/images/header-dog.png");
const INLINE_BADGE_WIDTH = 92;

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

function HeaderCapsule({
  children,
  fallback,
  style,
}) {
  const C = useThemeStore((state) => state.colors);

  if (Platform.OS === "ios") {
    return (
      <View
        style={[
          style,
          styles.headerCapsuleNative,
          {
            backgroundColor: C.bgSecondary,
            borderColor: C.separator,
          },
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <GlassView isInteractive style={[style, glass(fallback)]}>
      {children}
    </GlassView>
  );
}

function splitJournalLines(rawText) {
  const normalized = String(rawText ?? "");
  if (!normalized.length) {
    return [];
  }

  return normalized.split(/\r?\n/).map((line, lineIndex) => ({
    lineIndex,
    rawText: line,
    sourceText: line.trim(),
  }));
}

function getExternalSources(sources) {
  return Array.isArray(sources) ? sources : [];
}

/**
 * Build per-line insight objects for every non-empty line.
 * Each line gets one of: { type: "ready" }, { type: "thinking" }, { type: "error" }, or null.
 */
function buildAllLineInsights(rawText, journal) {
  const lines = splitJournalLines(rawText);
  const annotations = new Map(
    (journal?.lineAnnotations ?? []).map((a) => [a.lineIndex, a]),
  );
  const isAnalyzing = journal?.analysisStatus === "analyzing";
  const isError = journal?.analysisStatus === "error";

  return lines
    .filter((line) => line.sourceText.length > 0)
    .map((line) => {
      const existing = annotations.get(line.lineIndex);

      if (existing?.sourceText === line.sourceText) {
        if (existing.error) {
          return {
            type: "error",
            ...existing,
            lineIndex: line.lineIndex,
            isLoading: false,
          };
        }

        return {
          type: "ready",
          ...existing,
          lineIndex: line.lineIndex,
          isLoading: false,
          error: existing.error ?? null,
        };
      }

      if (isAnalyzing) {
        return {
          type: "thinking",
          lineIndex: line.lineIndex,
          sourceText: line.sourceText,
        };
      }

      if (isError) {
        return {
          type: "error",
          lineIndex: line.lineIndex,
          sourceText: line.sourceText,
          error: journal.analysisError ?? "Nao foi possivel analisar o texto.",
        };
      }

      return null;
    })
    .filter(Boolean);
}

/* ── inline annotation badge (per-line, right-aligned) ──────────────────── */

function AnnotationBadge({ insight, onPressSources }) {
  const C = useThemeStore((s) => s.colors);

  if (!insight) return null;

  if (insight.type === "thinking") {
    return (
      <View style={pS.badge}>
        <ThinkingShimmer />
      </View>
    );
  }

  if (insight.type === "error") {
    return (
      <View style={pS.badge}>
        <Text style={[pS.errorText, { color: C.accentRed }]}>Erro IA</Text>
      </View>
    );
  }

  if (insight.type !== "ready") return null;

  const sources = getExternalSources(insight.sources);
  const cal = Math.round(insight.totals?.calories ?? 0);

  return (
    <TouchableOpacity
      style={pS.badge}
      onPress={() => onPressSources?.(insight)}
      activeOpacity={0.7}
      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
    >
      <View style={pS.badgeStack}>
        <Text style={[pS.calText, { color: C.accentBlue }]}>
          {cal} cal
        </Text>
        {sources.length > 0 ? (
          <View style={pS.sourcesRow}>
            <Text style={[pS.sourcesText, { color: C.accentBlue, fontSize: 9, opacity: 0.8 }]}>
              {sources.map(s => s.label || "").filter(Boolean).join(" · ")}
            </Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

/* ── settings sub-components ─────────────────────────────────────────────── */

// Settings icon slot using SF Symbols throughout the app
function IconBadge({ color, sfName }) {

  return (
    <View style={sS.iconBadge}>
      {sfName ? (
        <AppSymbol
          color={color}
          name={sfName}
          size={18}
          style={sS.symbol}
          weight="medium"
        />
      ) : null}
    </View>
  );
}

function NavRow({ badgeColor, sfName, label, sublabel, value, onPress, isLast }) {
  const C = useThemeStore((s) => s.colors);
  const handlePress = useCallback(() => {
    if (!onPress) return;
    journalHaptics.light();
    onPress();
  }, [onPress]);
  const content = (
    <View style={[sS.row, isLast && sS.rowLast]}>
      {sfName ? <IconBadge color={badgeColor} sfName={sfName} /> : null}
      <View style={sS.rowBody}>
        <Text style={[sS.rowLabel, { color: C.textPrimary }]}>{label}</Text>
        {sublabel ? <Text style={[sS.rowSub, { color: C.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      {value ? <Text style={[sS.rowVal, { color: C.textSecondary }]}>{value}</Text> : null}
      {onPress ? (
        <AppSymbol
          color={C.textTertiary}
          name="chevron.right"
          size={14}
          style={sS.chevron}
          weight="medium"
        />
      ) : null}
    </View>
  );
  return onPress ? (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7}>{content}</TouchableOpacity>
  ) : content;
}

function ToggleRow({ badgeColor, sfName, label, sublabel, value, onToggle, isLast }) {
  const C = useThemeStore((s) => s.colors);
  const handleToggle = useCallback((nextValue) => {
    journalHaptics.selection();
    onToggle(nextValue);
  }, [onToggle]);
  return (
    <View style={[sS.row, isLast && sS.rowLast]}>
      {sfName ? <IconBadge color={badgeColor} sfName={sfName} /> : null}
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
          onValueChange={handleToggle}
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
  const handleToggle = useCallback((mode) => {
    journalHaptics.selection();
    onToggle(mode);
  }, [onToggle]);
  return (
    <View style={sS.row}>
      <IconBadge
        color={isDark ? "#5e5ce6" : "#f59e0b"}
        sfName={isDark ? "moon.fill" : "sun.max.fill"}
      />
      <View style={sS.rowBody}>
        <Text style={[sS.rowLabel, { color: C.textPrimary }]}>Appearance</Text>
        <Text style={[sS.rowSub, { color: C.textSecondary }]}>{isDark ? "Dark" : "Light"}</Text>
      </View>
      <View style={sS.segmentedControl}>
        <TouchableOpacity
          style={[sS.segBtn, !isDark && sS.segBtnActive]}
          onPress={() => handleToggle("light")}
          activeOpacity={0.75}
        >
          <Text style={[sS.segLabel, !isDark && sS.segLabelActive]}>Light</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[sS.segBtn, isDark && sS.segBtnActive]}
          onPress={() => handleToggle("dark")}
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

export default function Index({ forceOpenKeyboardOnMount }) {
  const router = useRouter();
  const params = useLocalSearchParams();
  const {
    entries,
    journal,
    selectedDate,
    setDate,
    setJournalText,
    beginJournalAnalysis,
    completeJournalAnalysis,
    failJournalAnalysis,
    addImageEntry,
    removeEntry,
  } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const savedMeals = useSettingsStore((state) => state.savedMeals);
  const setNutritionDetail = useJournalUiStore((state) => state.setNutritionDetail);
  const setSavedMealDraft = useJournalUiStore((state) => state.setSavedMealDraft);
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

  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(journal.rawText ?? "");
  const textRef = useRef("");
  const analysisTimerRef = useRef(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [cameraMenuVisible, setCameraMenuVisible] = useState(false);

  const { width: windowWidth } = useWindowDimensions();
  const inputRef = useRef(null);
  const scrollRef = useRef(null);
  const swipeRef = useRef(null);
  const dictationBaseTextRef = useRef("");
  const isListeningRef = useRef(isListening);

  const prevDate = useMemo(() => offsetDay(selectedDate, -1), [selectedDate]);
  const nextDate = useMemo(() => offsetDay(selectedDate, +1), [selectedDate]);

  const lineInsights = useMemo(
    () => buildAllLineInsights(text, journal),
    [journal, text],
  );

  const todayStr = useMemo(() => toDateStr(new Date()), []);
  const dateLabel = useMemo(() => formatDateLabel(selectedDate), [selectedDate]);
  const usesNativeBottomAccessory = Platform.OS === "ios" && supportsNativeBottomAccessory;
  const {
    contentBottomInset,
    overlayBottomOffset,
    scrollIndicatorBottomInset,
  } = useFloatingTabBarInsets(usesNativeBottomAccessory ? 48 : 64);
  const {
    onScroll: handleTabBarScroll,
    scrollEventThrottle: tabBarScrollEventThrottle,
  } = useFloatingTabBarScroll();

  const handleJournalScroll = useCallback((event) => {
    handleTabBarScroll?.(event);
  }, [handleTabBarScroll]);
  const shouldShowLegacyGoalsBar = !isEditing && !usesNativeBottomAccessory;
  const shouldShowBottomOverlay = shouldShowLegacyGoalsBar || isEditing;

  /* keyboard visibility --------------------------------------------------- */
  useEffect(() => {
    isListeningRef.current = isListening;
  }, [isListening]);

  useEffect(() => {
    const willShow = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const willHide = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const didHide  = "keyboardDidHide";

    // Show: mark visible + capture keyboard height
    const sL = Keyboard.addListener(willShow, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates?.height ?? 0);
    });

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
    });

    return () => {
      sL.remove();
      wL?.remove();
      dL.remove();
    };
  }, []);

  /* re-center swiper whenever selectedDate changes (swipe or calendar pick) */
  useEffect(() => {
    swipeRef.current?.scrollToIndex({ index: 1, animated: false });
  }, [selectedDate]);

  useEffect(() => {
    cancelDebounce();
  }, [cancelDebounce, selectedDate]);

  useEffect(() => {
    const nextText = journal.rawText ?? "";
    textRef.current = nextText;
    setText(nextText);
  }, [journal.rawText, selectedDate]);

  useEffect(() => {
    if (!transcript) return;

    const base = dictationBaseTextRef.current.trim();
    const nextText = [base, transcript].filter(Boolean).join(" ").trim();
    textRef.current = nextText;
    setText(nextText);
    setJournalText(nextText);

    if (!isEditing) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsEditing(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [transcript, isEditing, setJournalText]);

  /* handlers -------------------------------------------------------------- */

  const cancelDebounce = useCallback(() => {
    if (analysisTimerRef.current) {
      clearTimeout(analysisTimerRef.current);
      analysisTimerRef.current = null;
    }
  }, []);

  useEffect(() => () => cancelDebounce(), [cancelDebounce]);

  const dismissEditingContext = useCallback(() => {
    cancelDebounce();
    if (isListeningRef.current) {
      stopListening();
    }
    Keyboard.dismiss();
    setIsEditing(false);
  }, [cancelDebounce, stopListening]);

  const handleDaySwipe = useCallback((e) => {
    const x = e.nativeEvent.contentOffset.x;
    if (x < windowWidth * 0.5) {
      cancelDebounce();
      if (isListening) {
        stopListening();
      }
      Keyboard.dismiss();
      setIsEditing(false);
      clearTranscript();
      dictationBaseTextRef.current = "";
      setDate(offsetDay(selectedDate, -1));
    } else if (x > windowWidth * 1.5) {
      cancelDebounce();
      if (isListening) {
        stopListening();
      }
      Keyboard.dismiss();
      setIsEditing(false);
      clearTranscript();
      dictationBaseTextRef.current = "";
      setDate(offsetDay(selectedDate, +1));
    }
    // If user bounced back to center, no state change needed
  }, [cancelDebounce, clearTranscript, isListening, selectedDate, setDate, stopListening, windowWidth]);

  const handleStartEditing = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsEditing(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  useEffect(() => {
    if (params.openKeyboard || forceOpenKeyboardOnMount) {
       handleStartEditing();
    }
  }, [params.openKeyboard, forceOpenKeyboardOnMount, handleStartEditing, router]);

  const handleInputFocus = useCallback(() => {
    setIsEditing(true);
  }, []);

  const handleInputBlur = useCallback(() => {
    if (!isListeningRef.current) {
      setIsEditing(false);
    }
  }, []);

  const handleTextChange = useCallback((value) => {
    textRef.current = value;
    setText(value);
    setJournalText(value);
    cancelDebounce();

    if (!value.trim()) {
      return;
    }

    analysisTimerRef.current = setTimeout(async () => {
      analysisTimerRef.current = null;
      const snapshotText = textRef.current;
      const snapshotDate = selectedDate;
      const snapshotAnnotations = journal.lineAnnotations ?? [];

      if (!snapshotText.trim()) {
        return;
      }

      const version = beginJournalAnalysis(snapshotText, snapshotDate);

      try {
        const result = await analyzeJournalText(snapshotText, snapshotAnnotations);
        completeJournalAnalysis(snapshotDate, version, result.analyzedText, result);
      } catch (analysisError) {
        failJournalAnalysis(snapshotDate, version, analysisError?.message);
      }
    }, 700);
  }, [
    beginJournalAnalysis,
    cancelDebounce,
    completeJournalAnalysis,
    failJournalAnalysis,
    journal.lineAnnotations,
    selectedDate,
    setJournalText,
  ]);

  const handleDismissKeyboard = useCallback(() => {
    journalHaptics.selection();
    dismissEditingContext();
  }, [dismissEditingContext]);

  const handleRemoveEntry = useCallback((id) => {
    journalHaptics.medium();
    removeEntry(id);
  }, [removeEntry]);

  const handleToggleMic = useCallback(async () => {
    if (isListening) {
      journalHaptics.selection();
      stopListening();
      return;
    }

    journalHaptics.light();
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
    journalHaptics.selection();
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
    journalHaptics.light();
    dismissEditingContext();
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
  }, [dismissEditingContext, handlePickImage]);

  const handleAddSavedMeal = useCallback(() => {
    journalHaptics.light();
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

    dismissEditingContext();
    setSavedMealDraft({
      items: sourceText,
      suggestedName,
      totals: parsedResult.totals,
    });
    router.push("/(tabs)/(journal)/save-meal");
  }, [dismissEditingContext, entries, handleStartEditing, router, savedMeals, setSavedMealDraft, text]);

  const openGoals = useCallback(() => {
    journalHaptics.selection();
    dismissEditingContext();
    router.push("/(tabs)/(journal)/goals");
  }, [dismissEditingContext, router]);

  const openCalendar = useCallback(() => {
    journalHaptics.light();
    dismissEditingContext();
    router.push("/(tabs)/(journal)/calendar");
  }, [dismissEditingContext, router]);
  const openSettings = useCallback(() => {
    journalHaptics.light();
    dismissEditingContext();
    router.push("/(tabs)/(journal)/settings");
  }, [dismissEditingContext, router]);

  const openNutritionDetails = useCallback((detail) => {
    if (!detail || detail.type !== "ready") {
      return;
    }

    journalHaptics.light();
    setNutritionDetail({
      ...detail,
      sources: getExternalSources(detail.sources),
    });
    router.push("/(tabs)/(journal)/nutrition-details");
  }, [router, setNutritionDetail]);

  /* render ---------------------------------------------------------------- */
  return (
    <View style={[styles.root, { backgroundColor: C.bgPrimary }]}>
      <StatusBar style={colorMode === "dark" ? "light" : "dark"} />

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + WEB_TOP_INSET + 10 }]}>
        {/* Left column — fixed width to match right */}
        <View style={styles.headerSide}>
          <Image
            source={HEADER_DOG_ICON}
            style={styles.logoImage}
            resizeMode="contain"
            accessibilityLabel="Icone do NutriPal"
          />
        </View>

        {/* Center: Date pill — true center via flex */}
        <View style={styles.headerCenter}>
          <TouchableOpacity onPress={openCalendar} activeOpacity={0.7}>
            <HeaderCapsule fallback="rgba(255,255,255,0.10)" style={styles.datePill}>
              <Text style={[styles.dateLabel, { color: C.textPrimary }]}>{dateLabel}</Text>
            </HeaderCapsule>
          </TouchableOpacity>
        </View>

        {/* Right column — fixed width to match left */}
        <View style={styles.headerSideRight}>
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={openSettings} activeOpacity={0.7}>
              <HeaderCapsule fallback="rgba(255,255,255,0.10)" style={styles.rightPill}>
                <AppSymbol
                  color={C.accentOrange}
                  name="flame.fill"
                  size={15}
                  style={styles.streakSymbol}
                  weight="medium"
                />
                <Text style={[styles.streakCount, { color: C.textPrimary }]}>1</Text>
                <View style={styles.pillDivider} />
                <AppSymbol
                  color={C.textSecondary}
                  name="gearshape"
                  size={16}
                  style={styles.gearSymbol}
                  weight="regular"
                />
              </HeaderCapsule>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* ── 3-page horizontal day swiper ────────────────────────────── */}
        <FlatList
          ref={swipeRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          scrollEnabled={!keyboardVisible}
          onMomentumScrollEnd={handleDaySwipe}
          keyboardShouldPersistTaps="always"
          style={styles.flex}
          data={[prevDate, selectedDate, nextDate]}
          keyExtractor={(date) => date}
          initialScrollIndex={1}
          getItemLayout={(_, index) => ({ length: windowWidth, offset: windowWidth * index, index })}
              renderItem={({ item: date, index: idx }) => {
                const isActive = idx === 1;
                const dayEntries = isActive ? entries : getEntriesForDate(date);
                const dayJournal = isActive ? journal : getJournalForDate(date);
                const dayText = isActive ? text : (dayJournal.rawText ?? "");
                const dayLineInsights = isActive
                  ? lineInsights
                  : buildAllLineInsights(dayText, dayJournal);
                const hasJournalContent = Boolean(dayText.trim());
                return (
              <ScrollView
                ref={isActive ? scrollRef : null}
                 onScroll={isActive ? handleJournalScroll : undefined}
                scrollEventThrottle={isActive ? tabBarScrollEventThrottle : undefined}
                scrollIndicatorInsets={{
                  bottom: scrollIndicatorBottomInset,
                }}
                style={{ width: windowWidth }}
                contentContainerStyle={[
                  styles.scrollContent,
                  { paddingBottom: contentBottomInset },
                ]}
                keyboardShouldPersistTaps="always"
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
                  <MealEntryCard
                    key={entry.id}
                    entry={entry}
                    onDelete={isActive ? handleRemoveEntry : undefined}
                  />
                ))}

                    <Pressable
                      style={[
                        styles.noteSection,
                        isActive ? styles.noteSectionInteractive : null,
                      ]}
                      onPress={isActive ? handleStartEditing : undefined}
                      disabled={!isActive || isEditing}
                    >
                      {isActive && (isEditing || !hasJournalContent) ? (
                        <View style={styles.inlineComposer}>
                            <View style={styles.paragraphsContainer}>
                              {hasJournalContent ? (() => {
                                const insightMap = new Map(dayLineInsights.map((i) => [i.lineIndex, i]));
                                return splitJournalLines(dayText).map((line) => (
                                  <View key={line.lineIndex} style={pS.paragraphRow}>
                                    <View style={pS.paragraphTextTouch}>
                                      <Text
                                        style={[
                                          pS.paragraphText,
                                          {
                                            color: line.sourceText.length ? C.textPrimary : "transparent",
                                          },
                                        ]}
                                      >
                                        {line.rawText || " "}
                                      </Text>
                                    </View>
                                    <View style={pS.badgeSlot}>
                                      <AnnotationBadge
                                        insight={insightMap.get(line.lineIndex)}
                                        onPressSources={openNutritionDetails}
                                      />
                                    </View>
                                  </View>
                                ));
                              })() : null}
                            </View>

                            <TextInput
                              ref={inputRef}
                              value={text}
                              onChangeText={handleTextChange}
                              onFocus={handleInputFocus}
                              onBlur={handleInputBlur}
                              placeholder="O que você comeu?"
                              placeholderTextColor={C.textTertiary}
                              style={[
                                styles.inlineComposerInput,
                                !hasJournalContent ? styles.inlineComposerInputWide : null,
                                {
                                  color: hasJournalContent ? "transparent" : C.textPrimary,
                                },
                              ]}
                              multiline
                              blurOnSubmit={false}
                              scrollEnabled={false}
                              underlineColorAndroid="transparent"
                              selectionColor={C.accentBlue}
                              cursorColor={C.textPrimary}
                              textAlignVertical="top"
                            />
                          </View>
                        ) : false ? (
                          <TextInput
                            ref={inputRef}
                            value={text}
                            onChangeText={handleTextChange}
                            onFocus={handleInputFocus}
                            onBlur={handleInputBlur}
                            placeholder="O que você comeu?"
                            placeholderTextColor={C.textTertiary}
                            style={[styles.inlineInput, { color: C.textPrimary }]}
                            multiline
                            blurOnSubmit={false}
                            scrollEnabled={false}
                            underlineColorAndroid="transparent"
                            selectionColor={C.accentBlue}
                            cursorColor={C.textPrimary}
                            textAlignVertical="top"
                          />
                        )
                      : hasJournalContent ? (
                        <View style={styles.paragraphsContainer}>
                          {(() => {
                            const insightMap = new Map(dayLineInsights.map((i) => [i.lineIndex, i]));
                            return splitJournalLines(dayText).map((line) => {
                              return (
                                <View key={line.lineIndex} style={pS.paragraphRow}>
                                  <TouchableOpacity
                                    onPress={isActive ? handleStartEditing : undefined}
                                    activeOpacity={isActive ? 0.85 : 1}
                                    disabled={!isActive}
                                    style={pS.paragraphTextTouch}
                                  >
                                    <Text
                                      style={[
                                        pS.paragraphText,
                                        {
                                          color: line.sourceText.length ? C.textPrimary : "transparent",
                                        },
                                      ]}
                                    >
                                      {line.rawText || " "}
                                    </Text>
                                  </TouchableOpacity>
                                  <View style={pS.badgeSlot}>
                                    <AnnotationBadge
                                      insight={insightMap.get(line.lineIndex)}
                                      onPressSources={openNutritionDetails}
                                    />
                                  </View>
                                </View>
                              );
                            });
                          })()}
                        </View>
                      ) : null}
                    </Pressable>

                {!isActive && !hasJournalContent && dayEntries.length === 0 ? (
                  <Text style={[styles.placeholder, { color: C.textSecondary }]}>Sem registros neste dia.</Text>
                ) : null}
              </ScrollView>
            );
          }}
        />

      </KeyboardAvoidingView>

      {shouldShowBottomOverlay ? (
        <View
          style={[
            styles.bottomContainer,
            {
              bottom: keyboardVisible && isEditing
                ? keyboardHeight
                : WEB_BOTTOM_INSET + overlayBottomOffset - (Platform.OS === "ios" ? 3 : 0),
              paddingBottom: keyboardVisible && isEditing
                ? 0
                : undefined,
            },
          ]}
        >
          {shouldShowLegacyGoalsBar ? (
            <LegacyJournalSummaryBar
              onToggleGoals={openGoals}
              totals={totals}
            />
          ) : null}

          <ActionBar
            totals={totals}
            isEditing={isEditing}
            isListening={isListening}
            onToggleMic={handleToggleMic}
            onOpenCamera={handleOpenCamera}
            onAddSavedMeal={handleAddSavedMeal}
            onDismissKeyboard={handleDismissKeyboard}
          />
        </View>
      ) : null}

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
                <AppSymbol
                  color={C.accentBlue}
                  name="doc.text.viewfinder"
                  size={20}
                  style={styles.cameraMenuSymbol}
                  weight="medium"
                />
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Scan Menu</Text>
              </TouchableOpacity>

              <View style={styles.cameraMenuSep} />

              <TouchableOpacity
                style={styles.cameraMenuItem}
                activeOpacity={0.6}
                onPress={() => handleCameraMenuAction("library")}
              >
                <AppSymbol
                  color={C.accentGreen}
                  name="photo.on.rectangle"
                  size={20}
                  style={styles.cameraMenuSymbol}
                  weight="medium"
                />
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Choose from Library</Text>
              </TouchableOpacity>

              <View style={styles.cameraMenuSep} />

              <TouchableOpacity
                style={styles.cameraMenuItem}
                activeOpacity={0.6}
                onPress={() => handleCameraMenuAction("camera")}
              >
                <AppSymbol
                  color={C.accentPink}
                  name="camera"
                  size={20}
                  style={styles.cameraMenuSymbol}
                  weight="medium"
                />
                <Text style={[styles.cameraMenuLabel, { color: C.textPrimary }]}>Take Photo</Text>
              </TouchableOpacity>
            </GlassView>
          </View>
        </View>
      </Modal>
      {false ? (
        <>

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
              <AppSymbol
                color={C.textSecondary}
                name={dir === "left" ? "chevron.left" : "chevron.right"}
                size={18}
                style={styles.calArrow}
                weight="medium"
              />
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
              <GlassIconButton
                onPress={closeSettings}
                accessibilityLabel="Fechar ajustes"
                symbolName="xmark"
                color={C.textSecondary}
              />
            </View>

            {/* Profile */}
            <Card>
              <NavRow label="Name"  value="Pedro Moreira" />
              <NavRow label="Email" value="pedrohenriqmoreira@gmail.com" isLast />
            </Card>

            <SectionTitle title="Goals & Targets" />
            <Card>
              <NavRow
                badgeColor="#3b82f6" sfName="scalemass.fill"
                label="61.5 kg"
                sublabel="2,729 cal · P 136g · C 303g · F 91g"
              />
              <NavRow
                badgeColor="#3b82f6" sfName="chart.bar.fill"
                label="Manage Nutrition Goals"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Health Profile" />
            <Card>
              <NavRow
                badgeColor="#ef4444" sfName="heart.fill"
                label="61.5 kg (current weight)"
                sublabel="Moderately Active"
              />
              <NavRow
                badgeColor="#ef4444" sfName="doc.text.fill"
                label="Manage Health Info"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Weight Tracking" />
            <Card>
              <NavRow
                badgeColor="#a855f7" sfName="chart.line.downtrend.xyaxis"
                label="61.5 kg"
                sublabel="Log weight to see trends"
                onPress={() => {}} isLast
              />
            </Card>

            <SectionTitle title="Saved Meals" />
            <Card>
              <NavRow
                badgeColor="#f97316" sfName="fork.knife"
                label="Manage Saved Meals"
                sublabel={savedMealsLabel}
                onPress={openSavedMealsManager} isLast
              />
            </Card>

            <SectionTitle title="Preferences" />
            <Card>
              <NavRow
                badgeColor="#f97316" sfName="target"
                label="Calorie Estimate Bias"
                sublabel="Accurate"
                onPress={() => {}}
              />
              <ToggleRow
                badgeColor="#f97316" sfName="bell.fill"
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
                badgeColor="#22c55e" sfName="clock.fill"
                label="Automatic Time Zone"
                value={autoTimeZone}
                onToggle={() => setAutoTimeZone(v => !v)}
              />
              <NavRow
                badgeColor="#3b82f6" sfName="mic.fill"
                label="Dictation Language"
                value="Auto-detect ▾"
                isLast
              />
            </Card>

            <SectionTitle title="Subscription" />
            <Card>
              <NavRow
                badgeColor="#eab308" sfName="crown.fill"
                label="Subscription Active"
                sublabel="Tasanka 3 Apr 2025"
              />
              <NavRow label="Manage Subscription" onPress={() => {}} isLast />
            </Card>

            <Card>
              <NavRow badgeColor="#a855f7" sfName="star.fill" label="Give Feedback" onPress={() => {}} />
              <NavRow badgeColor="#a855f7" sfName="info.circle.fill" label="About the App" onPress={() => {}} isLast />
            </Card>

            {/* Destructive */}
            <Card>
              <NavRow badgeColor="#3b82f6" sfName="bubble.left.fill" label="Contact Support" onPress={() => {}} />
              <NavRow badgeColor="#636366" sfName="trash.fill" label="Clear Local Cache" onPress={() => {}} />
              <NavRow badgeColor="#f97316" sfName="square.and.arrow.up.fill" label="Export Data" onPress={() => {}} />
              <NavRow badgeColor="#ef4444" sfName="exclamationmark.triangle.fill" label="Delete Account" onPress={() => {}} />
              <NavRow badgeColor="#ef4444" sfName="rectangle.portrait.and.arrow.right.fill" label="Sign Out" onPress={() => {}} isLast />
            </Card>
          </BottomSheetScrollView>
      </BottomSheet>

      <BottomSheet
        ref={nutritionSheetRef}
        index={-1}
        snapPoints={["82%"]}
        enablePanDownToClose
        onClose={() => setSelectedNutritionDetail(null)}
        backgroundStyle={{ backgroundColor: C.bgSecondary, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }}
        handleIndicatorStyle={{ backgroundColor: C.systemGray3 }}
      >
        <BottomSheetScrollView contentContainerStyle={[styles.nutritionSheetContent, { paddingBottom: insets.bottom + 40 }]}>
          <View style={styles.nutritionHeader}>
            <Text style={[styles.nutritionHeaderTitle, { color: C.textSecondary }]}>Nutrition Details</Text>
            <GlassIconButton
              onPress={closeNutritionDetails}
              accessibilityLabel="Fechar detalhes nutricionais"
              symbolName="xmark"
              color={C.textSecondary}
            />
          </View>

          <Text style={[styles.nutritionSourceText, { color: C.textPrimary }]}>
            {selectedNutritionDetail?.sourceText ?? "No item selected"}
          </Text>

          <View style={[styles.nutritionSummaryCard, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}>
            <View style={styles.nutritionCaloriesBlock}>
              <Text style={[styles.nutritionCaloriesValue, { color: C.textPrimary }]}>
                {Math.round(selectedNutritionDetail?.totals?.calories ?? 0)}
              </Text>
              <Text style={[styles.nutritionCaloriesLabel, { color: C.textSecondary }]}>total calories</Text>
            </View>

            <View style={styles.nutritionMacroRow}>
              <View style={styles.nutritionMacroStat}>
                <Text style={[styles.nutritionMacroValue, { color: C.textPrimary }]}>
                  {Math.round(selectedNutritionDetail?.totals?.protein_g ?? 0)} g
                </Text>
                <Text style={[styles.nutritionMacroLabel, { color: C.protein }]}>Protein</Text>
              </View>
              <View style={styles.nutritionMacroStat}>
                <Text style={[styles.nutritionMacroValue, { color: C.textPrimary }]}>
                  {Math.round(selectedNutritionDetail?.totals?.carbs_g ?? 0)} g
                </Text>
                <Text style={[styles.nutritionMacroLabel, { color: C.carbs }]}>Carbs</Text>
              </View>
              <View style={styles.nutritionMacroStat}>
                <Text style={[styles.nutritionMacroValue, { color: C.textPrimary }]}>
                  {Math.round(selectedNutritionDetail?.totals?.fat_g ?? 0)} g
                </Text>
                <Text style={[styles.nutritionMacroLabel, { color: C.fat }]}>Fat</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.nutritionSectionTitle, { color: C.textSecondary }]}>Items</Text>
          <View style={styles.nutritionItemsList}>
            {(selectedNutritionDetail?.items?.length
              ? selectedNutritionDetail.items
              : [{ name: selectedNutritionDetail?.sourceText ?? "", calories: selectedNutritionDetail?.totals?.calories ?? 0 }]).map((item, index) => (
                <View
                  key={`${item.name}-${index}`}
                  style={[styles.nutritionItemCard, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}
                >
                  <View style={styles.nutritionItemHeader}>
                    <Text style={[styles.nutritionItemName, { color: C.textPrimary }]}>{item.name}</Text>
                    <Text style={[styles.nutritionItemCalories, { color: C.textSecondary }]}>
                      {Math.round(item.calories ?? 0)} cal
                    </Text>
                  </View>
                  {item.quantityDescription ? (
                    <Text style={[styles.nutritionItemMeta, { color: C.textSecondary }]}>
                      {item.quantityDescription}
                    </Text>
                  ) : null}
                  {item.matchedOfficialName ? (
                    <Text style={[styles.nutritionItemSource, { color: C.textTertiary }]}>
                      {item.matchedOfficialName}
                    </Text>
                  ) : null}
                </View>
              ))}
          </View>

          {selectedNutritionDetail?.sources?.length ? (
            <>
              <Text style={[styles.nutritionSectionTitle, { color: C.textSecondary }]}>Sources</Text>
              <View style={styles.nutritionSourceList}>
                {selectedNutritionDetail.sources.map((source, index) => (
                  <TouchableOpacity
                    key={`${source.url}-${index}`}
                    activeOpacity={0.75}
                    onPress={() => handleOpenSourceUrl(source.url)}
                    style={[styles.nutritionSourceCard, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}
                  >
                    <Text style={[styles.nutritionSourceLabel, { color: C.accentBlue }]}>
                      {source.label}
                    </Text>
                    <Text style={[styles.nutritionSourceName, { color: C.textPrimary }]}>
                      {source.matchName}
                    </Text>
                    <Text
                      style={[styles.nutritionSourceUrl, { color: C.textTertiary }]}
                      numberOfLines={1}
                    >
                      {source.url}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          ) : null}

          {selectedNutritionDetail?.reasoning ? (
            <>
              <Text style={[styles.nutritionSectionTitle, { color: C.textSecondary }]}>Resolution notes</Text>
              <View style={[styles.nutritionReasoningCard, { backgroundColor: C.bgPrimary, borderColor: C.separator }]}>
                <Text style={[styles.nutritionReasoningText, { color: C.textPrimary }]}>
                  {selectedNutritionDetail.reasoning}
                </Text>
              </View>
            </>
          ) : null}
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
              <GlassIconButton
                onPress={() => setSettingsView("main")}
                accessibilityLabel="Voltar para ajustes"
                symbolName="chevron.left"
                color={C.textSecondary}
              />
              <Text style={[styles.managerTitle, { color: C.textPrimary }]}>Saved Meals</Text>
              <GlassIconButton
                onPress={() => setSettingsView("main")}
                accessibilityLabel="Fechar refeicoes salvas"
                symbolName="xmark"
                color={C.textSecondary}
              />
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
                      <GlassIconButton
                        onPress={() => handleDeleteSavedMeal(meal)}
                        accessibilityLabel={`Remover ${meal.name}`}
                        symbolName="xmark"
                        tone="destructive"
                        color={C.accentRed}
                        size={30}
                        iconSize={14}
                      />
                    </View>
                    <View style={styles.savedMealMacroRow}>
                      <AppSymbol
                        color={C.accentOrange}
                        name="flame.fill"
                        size={12}
                        weight="medium"
                      />
                      <Text style={[styles.savedMealMacros, { color: C.textSecondary }]}>
                        {Math.round(meal.calories)} cal · P {Math.round(meal.protein_g)}g ·
                        {" "}C {Math.round(meal.carbs_g)}g · F {Math.round(meal.fat_g)}g
                      </Text>
                    </View>
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
              <View style={styles.modalMacroRow}>
                <AppSymbol
                  color={C.accentOrange}
                  name="flame.fill"
                  size={12}
                  weight="medium"
                />
                <Text style={[styles.modalMacros, { color: C.textSecondary }]}>
                  {Math.round(pendingSavedMeal.totals.calories)} cal · P{" "}
                  {Math.round(pendingSavedMeal.totals.protein_g)}g · C{" "}
                  {Math.round(pendingSavedMeal.totals.carbs_g)}g · F{" "}
                  {Math.round(pendingSavedMeal.totals.fat_g)}g
                </Text>
              </View>
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
        </>
      ) : null}
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
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  logoImage: {
    width: 54,
    height: 42,
  },
  datePillCenter: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCapsuleNative: {
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
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
  streakSymbol: { marginTop: 1 },
  streakCount: { fontSize: 14, fontWeight: "600", color: colors.textPrimary },
  pillDivider: {
    width: 1,
    height: 14,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginHorizontal: spacing.xs,
  },
  gearSymbol: { width: 16, height: 16 },

  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    flexGrow: 1,
  },
  noteSection: {
    paddingTop: spacing.lg,
  },
  noteSectionInteractive: {
    flexGrow: 1,
  },
  inlineInput: {
    ...typography.body,
    color: "rgba(255,255,255,0.90)",
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 0,
    paddingBottom: spacing.sm,
    paddingHorizontal: 0,
    margin: 0,
    letterSpacing: -0.3,
    lineHeight: 26,
  },
  inlineComposer: {
    position: "relative",
    minHeight: 88,
  },
  inlineComposerInput: {
    ...typography.body,
    position: "absolute",
    top: 0,
    left: 0,
    right: INLINE_BADGE_WIDTH + spacing.md,
    bottom: 0,
    minHeight: 88,
    textAlignVertical: "top",
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    margin: 0,
    letterSpacing: -0.3,
    lineHeight: 26,
    backgroundColor: "transparent",
  },
  inlineComposerInputWide: {
    right: 0,
  },
  paragraphsContainer: {
    minHeight: 88,
  },
  placeholder: {
    ...typography.body,
    color: colors.systemGray3,
    paddingTop: spacing.xs,
    lineHeight: 26,
    letterSpacing: -0.3,
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
  calArrow:  { width: 20, height: 20 },

  /* Settings sheet */
  settingsContent: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm },
  nutritionSheetContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  nutritionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nutritionHeaderTitle: {
    ...typography.subhead,
    fontWeight: "600",
  },
  nutritionSourceText: {
    ...typography.title2,
    fontWeight: "700",
    letterSpacing: -0.5,
    marginTop: spacing.sm,
  },
  nutritionSummaryCard: {
    borderRadius: radius.xl,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    gap: spacing.lg,
  },
  nutritionCaloriesBlock: {
    alignItems: "center",
    gap: spacing.xs,
  },
  nutritionCaloriesValue: {
    fontSize: 40,
    fontWeight: "700",
    letterSpacing: -1.2,
  },
  nutritionCaloriesLabel: {
    ...typography.footnote,
  },
  nutritionMacroRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nutritionMacroStat: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  nutritionMacroValue: {
    ...typography.headline,
    fontWeight: "700",
  },
  nutritionMacroLabel: {
    ...typography.caption1,
    fontWeight: "600",
  },
  nutritionSectionTitle: {
    ...typography.subhead,
    fontWeight: "600",
    marginBottom: spacing.sm,
  },
  nutritionItemsList: {
    gap: spacing.sm,
  },
  nutritionItemCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  nutritionItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  nutritionItemName: {
    ...typography.subhead,
    flex: 1,
  },
  nutritionItemCalories: {
    ...typography.footnote,
    fontWeight: "600",
  },
  nutritionItemMeta: {
    ...typography.footnote,
  },
  nutritionItemSource: {
    ...typography.caption1,
    lineHeight: 18,
  },
  nutritionSourceList: {
    gap: spacing.sm,
  },
  nutritionSourceCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  nutritionSourceLabel: {
    ...typography.caption1,
    fontWeight: "700",
  },
  nutritionSourceName: {
    ...typography.subhead,
  },
  nutritionSourceUrl: {
    ...typography.caption1,
  },
  nutritionReasoningCard: {
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.md,
  },
  nutritionReasoningText: {
    ...typography.footnote,
    lineHeight: 20,
  },

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
  savedMealMacroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  savedMealName: {
    ...typography.subhead,
    color: colors.textPrimary,
    flex: 1,
  },
  savedMealMacros: {
    ...typography.footnote,
    color: colors.systemGray,
  },
  savedMealItems: {
    ...typography.caption1,
    color: colors.systemGray3,
    marginTop: spacing.xs,
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
  },
  modalMacroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
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
  chevron: { marginLeft: spacing.xs },

  /* iOS-style icon badge — colored rounded square */
  iconBadge: {
    width: 24, height: 24,
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

/* ── paragraph + inline annotation styles ─────────────────────────────────── */
const pS = StyleSheet.create({
  paragraphRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    minHeight: 26,
  },
  paragraphTextTouch: {
    flex: 1,
  },
  paragraphText: {
    ...typography.body,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  badgeSlot: {
    width: INLINE_BADGE_WIDTH,
    alignItems: "flex-end",
  },
  badge: {
    width: "100%",
    alignItems: "flex-end",
    paddingTop: 2,
  },
  badgeStack: {
    alignItems: "flex-end",
    gap: 2,
  },
  calText: {
    ...typography.footnote,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  sourcesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  sourcesText: {
    ...typography.caption1,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  errorText: {
    ...typography.footnote,
    fontWeight: "600",
    fontStyle: "italic",
    letterSpacing: -0.08,
  },
});
