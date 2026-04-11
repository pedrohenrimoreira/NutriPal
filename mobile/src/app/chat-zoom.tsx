import { useRouter } from "expo-router";
import React, { useCallback, useEffect } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { AiAssistantPanel } from "../components/assistant/AiAssistantPanel";
import { AppSymbol } from "../components/icons/AppSymbol";
import { JournalCompactChrome } from "../components/journal/JournalCompactChrome";
import { useJournalUiStore } from "../store/journalUiStore";
import { useDailyTotals, useJournalStore } from "../store/journalStore";
import { useSettingsStore } from "../store/settingsStore";
import { useThemeStore } from "../store/themeStore";
import { radius, spacing, typography } from "../theme";
import journalHaptics from "../utils/journalHaptics";
import {
  journalGoalsPresentationRoute,
  supportsNativeBottomAccessory,
} from "../utils/iosNavigation";

const glass = (fallback: string) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

export default function ChatZoomScreen() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const journalBottomAccessoryMode = useSettingsStore((store) => store.journalBottomAccessoryMode);
  const journalComposerActive = useJournalUiStore((store) => store.journalComposerActive);
  const { entries, journal } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const showsCompactChrome =
    supportsNativeBottomAccessory
    && journalBottomAccessoryMode === "compact"
    && !journalComposerActive;
  const contentReveal = useSharedValue(0);

  useEffect(() => {
    contentReveal.value = withDelay(
      140,
      withTiming(1, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      }),
    );
  }, [contentReveal]);

  const contentRevealStyle = useAnimatedStyle(() => ({
    opacity: contentReveal.value,
    transform: [
      { translateY: (1 - contentReveal.value) * 8 } as const,
    ],
  }));

  const openGoals = useCallback(() => {
    journalHaptics.light();
    router.navigate(journalGoalsPresentationRoute);
  }, [router]);

  const openJournalComposer = useCallback(() => {
    router.navigate({
      pathname: "/(tabs)/(journal)",
      params: {
        openKeyboard: Date.now().toString(),
      },
    });
  }, [router]);

  return (
    <SafeAreaView edges={["top"]} style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
      <View style={[styles.container, { backgroundColor: C.bgPrimary }]}>
        <View style={styles.header}>
          {/* Left: hamburger + title pill */}
          <View style={styles.headerLeft}>
            <TouchableOpacity activeOpacity={0.82} accessibilityLabel="Menu">
              <GlassView
                colorScheme={colorMode}
                glassEffectStyle="clear"
                isInteractive
                style={[styles.headerIconBtn, glass(C.glassBgHover), {
                  borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
                }]}
              >
                <AppSymbol color={C.textPrimary} name="line.3.horizontal" size={22} weight="medium" />
              </GlassView>
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.82} accessibilityLabel="AI Assistant">
              <GlassView
                colorScheme={colorMode}
                glassEffectStyle="clear"
                isInteractive
                style={[styles.titlePill, glass(C.glassBgHover), {
                  borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
                }]}
              >
                <Text style={[styles.titleText, { color: C.accentBlue }]}>AI Assistant</Text>
              </GlassView>
            </TouchableOpacity>
          </View>

          {/* Right: keyboard button */}
          <TouchableOpacity activeOpacity={0.82} accessibilityLabel="Keyboard">
            <GlassView
              colorScheme={colorMode}
              glassEffectStyle="clear"
              isInteractive
              style={[styles.headerIconBtn, glass(C.glassBgHover), {
                borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
              }]}
            >
              <AppSymbol color={C.textPrimary} name="ellipsis" size={22} weight="medium" />
            </GlassView>
          </TouchableOpacity>
        </View>

        <Animated.View style={[styles.panelWrap, contentRevealStyle]}>
          <AiAssistantPanel
            bottomInset={showsCompactChrome ? 82 : 0}
            scrollBottomInset={showsCompactChrome ? 136 : 48}
            scrollIndicatorBottomInset={showsCompactChrome ? 82 : 0}
          />
        </Animated.View>

        {showsCompactChrome ? (
          <JournalCompactChrome
            chatDisabled
            chatZoomTarget
            goalsOpen={false}
            interactionDisabled={false}
            onOpenComposer={openJournalComposer}
            onOpenGoals={openGoals}
            totals={totals}
          />
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
  },
  headerLeft: {
    alignItems: "center",
    flexDirection: "row",
    gap: spacing.sm,
  },
  headerIconBtn: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  titlePill: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
  },
  titleText: {
    ...typography.headline,
    fontWeight: "600",
  },
  panelWrap: {
    flex: 1,
    marginTop: spacing.sm,
  },
});
