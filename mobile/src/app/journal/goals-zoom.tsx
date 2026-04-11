import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { Link, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { CompactGoalsCard } from "../../components/journal/CompactGoalsCard";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { JournalZoomBackdrop } from "../../components/journal/JournalZoomBackdrop";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useSettingsStore } from "../../store/settingsStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";
import {
  getGoalsZoomCollapsedHeight,
  getGoalsZoomExpandedHeight,
} from "../../utils/goalsZoomSheet";
import journalHaptics from "../../utils/journalHaptics";

const SPRING_CONFIG = {
  damping: 28,
  mass: 0.92,
  stiffness: 260,
};

const DISMISS_DISTANCE = 124;
const DISMISS_VELOCITY = 1680;
const EXPAND_VELOCITY = -860;

type SheetSnap = "collapsed" | "expanded";
type SurfacePhase = "transitioning" | "resting" | "closing";

export default function GoalsZoomScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView | null>(null);
  const { height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const nutritionGoals = useSettingsStore((store) => store.nutritionGoals);
  const { entries, journal } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const [sheetSnap, setSheetSnap] = useState<SheetSnap>("collapsed");
  const [scrollEnabled, setScrollEnabled] = useState(false);
  const [surfacePhase, setSurfacePhase] = useState<SurfacePhase>("transitioning");
  const scrollOffsetY = useSharedValue(0);

  const expandedHeight = useMemo(
    () => getGoalsZoomExpandedHeight(windowHeight, insets.top),
    [insets.top, windowHeight],
  );

  const collapsedHeight = useMemo(
    () => getGoalsZoomCollapsedHeight(windowHeight, insets.top),
    [insets.top, windowHeight],
  );

  const sheetHeight = useSharedValue(collapsedHeight);
  const gestureStartHeight = useSharedValue(collapsedHeight);
  const nativeScrollGesture = useMemo(() => Gesture.Native(), []);
  const useGlassSurface = isLiquidGlassAvailable() && surfacePhase === "resting";

  const fallbackTone = useMemo(
    () => (colorMode === "dark" ? "rgba(24,24,26,0.94)" : "rgba(244,239,229,0.98)"),
    [colorMode],
  );

  const collapseSheet = useCallback((withHaptic = false) => {
    if (withHaptic) {
      journalHaptics.selection();
    }
    scrollRef.current?.scrollTo({ animated: false, y: 0 });
    setSheetSnap("collapsed");
    setScrollEnabled(false);
    sheetHeight.value = withSpring(collapsedHeight, SPRING_CONFIG);
  }, [collapsedHeight, sheetHeight]);

  const expandSheet = useCallback((withHaptic = false) => {
    if (withHaptic) {
      journalHaptics.selection();
    }
    setSheetSnap("expanded");
    setScrollEnabled(true);
    sheetHeight.value = withSpring(expandedHeight, SPRING_CONFIG);
  }, [expandedHeight, sheetHeight]);

  const handleClose = useCallback(() => {
    if (surfacePhase === "closing") {
      return;
    }

    setScrollEnabled(false);
    setSurfacePhase("closing");
    journalHaptics.light();

    if (sheetSnap === "expanded") {
      scrollRef.current?.scrollTo({ animated: false, y: 0 });
      setSheetSnap("collapsed");
      sheetHeight.value = withSpring(collapsedHeight, SPRING_CONFIG);
      setTimeout(() => {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            router.back();
          });
        });
      }, 120);
      return;
    }

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        router.back();
      });
    });
  }, [collapsedHeight, router, sheetHeight, sheetSnap, surfacePhase]);

  const handleManageGoals = useCallback(() => {
    journalHaptics.light();
    router.push("/(tabs)/(journal)/nutrition-goals");
  }, [router]);

  const toggleSheet = useCallback(() => {
    if (sheetSnap === "collapsed") {
      expandSheet(true);
      return;
    }

    collapseSheet(true);
  }, [collapseSheet, expandSheet, sheetSnap]);

  useEffect(() => {
    if (sheetSnap === "expanded") {
      sheetHeight.value = expandedHeight;
      return;
    }

    sheetHeight.value = collapsedHeight;
  }, [collapsedHeight, expandedHeight, sheetHeight, sheetSnap]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setSurfacePhase((currentPhase) => (
        currentPhase === "transitioning" ? "resting" : currentPhase
      ));
    }, 240);

    return () => {
      clearTimeout(timeout);
    };
  }, []);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollOffsetY.value = event.contentOffset.y;
    },
  });

  const dragGesture = useMemo(
    () => Gesture.Pan()
      .enabled(surfacePhase === "resting")
      .simultaneousWithExternalGesture(nativeScrollGesture)
      .activeOffsetY([-8, 8])
      .onBegin(() => {
        gestureStartHeight.value = sheetHeight.value;
      })
      .onUpdate((event) => {
        const isExpandedStart = gestureStartHeight.value >= expandedHeight - 1;
        const isDraggingDown = event.translationY > 0;
        const isDraggingUp = event.translationY < 0;
        const isScrollPinnedToTop = scrollOffsetY.value <= 0.5;

        if (isExpandedStart && !isScrollPinnedToTop && (isDraggingDown || isDraggingUp)) {
          return;
        }

        const rawHeight = gestureStartHeight.value - event.translationY;

        if (rawHeight > expandedHeight) {
          sheetHeight.value = expandedHeight + (rawHeight - expandedHeight) * 0.18;
          return;
        }

        if (rawHeight < collapsedHeight) {
          sheetHeight.value = collapsedHeight - (collapsedHeight - rawHeight) * 0.72;
          return;
        }

        sheetHeight.value = rawHeight;
      })
      .onEnd((event) => {
        const currentHeight = sheetHeight.value;
        const startedNearCollapsed = gestureStartHeight.value <= collapsedHeight + 24;
        const dismissDelta = collapsedHeight - currentHeight;
        const shouldDismiss =
          startedNearCollapsed
          && (
            dismissDelta > DISMISS_DISTANCE
            || (dismissDelta > 48 && event.velocityY > DISMISS_VELOCITY)
          );

        if (shouldDismiss) {
          runOnJS(handleClose)();
          return;
        }

        const shouldExpand =
          event.velocityY < EXPAND_VELOCITY
          || currentHeight > (collapsedHeight + expandedHeight) / 2;

        if (shouldExpand) {
          runOnJS(expandSheet)(true);
          return;
        }

        runOnJS(collapseSheet)(true);
      }),
    [collapseSheet, collapsedHeight, expandedHeight, expandSheet, gestureStartHeight, handleClose, nativeScrollGesture, scrollOffsetY, sheetHeight, surfacePhase],
  );

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(
      sheetHeight.value,
      [collapsedHeight - DISMISS_DISTANCE, collapsedHeight, expandedHeight],
      [0, 0.04, 0.12],
      Extrapolation.CLAMP,
    ),
  }));

  const sheetShadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(
      sheetHeight.value,
      [collapsedHeight, expandedHeight],
      [0.12, 0.22],
      Extrapolation.CLAMP,
    ),
    transform: [
      {
        translateY: interpolate(
          sheetHeight.value,
          [collapsedHeight - DISMISS_DISTANCE, collapsedHeight, expandedHeight],
          [24, 0, 0],
          Extrapolation.CLAMP,
        ),
      },
    ],
  }));

  const sheetFrameStyle = useAnimatedStyle(() => ({
    height: sheetHeight.value,
  }));

  const sheetContent = (
    <>
      <View style={styles.dragRegion}>
        <Pressable
          accessibilityHint="Drag or tap to expand the goals sheet"
          accessibilityLabel="Goals sheet handle"
          accessibilityRole="button"
          hitSlop={10}
          onPress={toggleSheet}
          style={styles.dragPressable}
        >
          <View style={[styles.grabber, { backgroundColor: C.textTertiary }]} />
          <View style={styles.dragHintRow}>
            <AppSymbol
              color={C.textSecondary}
              name={sheetSnap === "expanded" ? "chevron.down" : "chevron.up"}
              size={12}
              weight="medium"
            />
          </View>
        </Pressable>
      </View>

      <GestureDetector gesture={nativeScrollGesture}>
        <Animated.ScrollView
          ref={scrollRef}
          bounces={sheetSnap === "expanded"}
          contentContainerStyle={[
            styles.content,
            { paddingBottom: spacing.xl + insets.bottom + spacing.sm },
          ]}
          contentInsetAdjustmentBehavior="never"
          indicatorStyle="white"
          keyboardDismissMode="interactive"
          onScroll={scrollHandler}
          scrollEnabled={scrollEnabled && surfacePhase === "resting"}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={scrollEnabled && surfacePhase === "resting"}
        >
          <CompactGoalsCard
            embedded
            nutritionGoals={nutritionGoals}
            onClose={handleClose}
            onManageGoals={handleManageGoals}
            scrollable={false}
            totals={totals}
          />
        </Animated.ScrollView>
      </GestureDetector>
    </>
  );

  return (
    <View style={styles.screen}>
      <JournalZoomBackdrop />

      <Pressable
        accessibilityLabel="Close goals"
        accessibilityRole="button"
        onPress={handleClose}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View
          pointerEvents="none"
          style={[styles.backdrop, backdropStyle]}
        />
      </Pressable>

      <SafeAreaView
        edges={["left", "right"]}
        pointerEvents="box-none"
        style={StyleSheet.absoluteFill}
      >
        <View pointerEvents="box-none" style={styles.sheetHost}>
          <View pointerEvents="box-none" style={styles.sheetInsets}>
            <GestureDetector gesture={dragGesture}>
              <Animated.View
                style={[
                  styles.sheetShadowFrame,
                  surfacePhase !== "resting" && styles.sheetShadowFrameIdle,
                  sheetShadowStyle,
                ]}
              >
                <Link.AppleZoomTarget>
                  <Animated.View
                    collapsable={false}
                    style={[styles.sheetFrame, sheetFrameStyle]}
                  >
                    {useGlassSurface ? (
                      <GlassView isInteractive={false} style={styles.sheetSurfaceGlass}>
                        {sheetContent}
                      </GlassView>
                    ) : (
                      <View
                        style={[
                          styles.sheetSurfaceFallback,
                          {
                            backgroundColor: fallbackTone,
                            borderColor: C.separator,
                          },
                        ]}
                      >
                        {sheetContent}
                      </View>
                    )}
                  </Animated.View>
                </Link.AppleZoomTarget>
              </Animated.View>
            </GestureDetector>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  sheetHost: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  sheetInsets: {
    paddingHorizontal: spacing.sm,
  },
  sheetShadowFrame: {
    alignSelf: "stretch",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: -10 },
    shadowRadius: 32,
    width: "100%",
  },
  sheetShadowFrameIdle: {
    shadowOpacity: 0,
  },
  sheetFrame: {
    alignSelf: "stretch",
    width: "100%",
  },
  sheetSurfaceGlass: {
    borderColor: "transparent",
    borderCurve: "continuous",
    borderRadius: radius.xxl + 6,
    overflow: "hidden",
  },
  sheetSurfaceFallback: {
    borderCurve: "continuous",
    borderRadius: radius.xxl + 6,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  dragRegion: {
    minHeight: 42,
    paddingTop: spacing.xs,
  },
  dragPressable: {
    alignItems: "center",
    justifyContent: "center",
  },
  grabber: {
    borderRadius: radius.full,
    height: 5,
    width: 42,
  },
  dragHintRow: {
    alignItems: "center",
    justifyContent: "center",
    minHeight: 18,
    paddingTop: 2,
  },
  content: {
    gap: spacing.md,
    paddingHorizontal: spacing.md + 2,
    paddingTop: spacing.xs,
  },
});
