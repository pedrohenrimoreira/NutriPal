import { Tabs, useRouter, useSegments } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { DynamicColorIOS, Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { JournalTabAccessory } from "../../components/journal/JournalTabAccessory";
import { JournalGoalsZoomMiniSurface } from "../../components/journal/JournalGoalsZoomMiniSurface";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";
import { PRIMARY_TABS, type PrimaryTabRoute } from "../../constants/navigation";
import { useJournalUiStore } from "../../store/journalUiStore";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useThemeStore } from "../../store/themeStore";
import journalHaptics from "../../utils/journalHaptics";
import {
  journalGoalsPresentationRoute,
  journalGoalsZoomRoute,
  supportsNativeBottomAccessory,
  usesJournalGoalsZoomMiniSurface,
} from "../../utils/iosNavigation";

const TAB_CONFIG = Object.fromEntries(
  PRIMARY_TABS.map((tab) => [tab.name, tab]),
) as Record<PrimaryTabRoute, (typeof PRIMARY_TABS)[number]>;

export default function PrimaryTabsLayout() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const insets = useSafeAreaInsets();
  const C = useThemeStore((store) => store.colors);
  const journalComposerActive = useJournalUiStore((store) => store.journalComposerActive);
  const { entries, journal } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const isTabbedJournalRoute = segments[0] === "(tabs)" && segments[1] === "(journal)";
  const isRootGoalsOverlayRoute = segments[0] === "goals-zoom";
  const isGoalsZoomJournalRoute = isTabbedJournalRoute && segments[2] === "goals-zoom";
  const isJournalContextActive = isTabbedJournalRoute || isRootGoalsOverlayRoute;
  const isJournalRootScreen = isTabbedJournalRoute && !segments[2];
  const isGoalsOpen = segments.includes("goals") || segments.includes("goals-zoom");
  const [hideNativeTabsBar, setHideNativeTabsBar] = useState(false);
  const [isGoalsAccessoryPrimed, setIsGoalsAccessoryPrimed] = useState(false);
  const goalsOpenTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const goalsAccessoryResetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showZoomMiniSurface =
    Platform.OS === "ios"
    && usesJournalGoalsZoomMiniSurface
    && !journalComposerActive
    && (isJournalRootScreen || isGoalsZoomJournalRoute);
  const zoomMiniSurfaceBottom = insets.bottom + 58;
  const goalsAccessoryActive = isGoalsAccessoryPrimed;
  const nativeTabsTintColor = useMemo(() => (
    Platform.OS === "ios"
      ? DynamicColorIOS({
        dark: "#ffffff",
        light: "#000000",
      })
      : undefined
  ), []);

  const openGoals = useCallback(() => {
    if (isGoalsOpen || isGoalsAccessoryPrimed) {
      return;
    }

    if (goalsOpenTimeoutRef.current) {
      clearTimeout(goalsOpenTimeoutRef.current);
      goalsOpenTimeoutRef.current = null;
    }

    if (goalsAccessoryResetTimeoutRef.current) {
      clearTimeout(goalsAccessoryResetTimeoutRef.current);
      goalsAccessoryResetTimeoutRef.current = null;
    }

    setIsGoalsAccessoryPrimed(true);
    journalHaptics.light();
    goalsOpenTimeoutRef.current = setTimeout(() => {
      goalsOpenTimeoutRef.current = null;
      router.navigate(journalGoalsPresentationRoute);
    }, 56);
    goalsAccessoryResetTimeoutRef.current = setTimeout(() => {
      goalsAccessoryResetTimeoutRef.current = null;
      setIsGoalsAccessoryPrimed(false);
    }, 240);
  }, [isGoalsAccessoryPrimed, isGoalsOpen, router]);

  useEffect(() => () => {
    if (goalsOpenTimeoutRef.current) {
      clearTimeout(goalsOpenTimeoutRef.current);
    }

    if (goalsAccessoryResetTimeoutRef.current) {
      clearTimeout(goalsAccessoryResetTimeoutRef.current);
    }
  }, []);

  useEffect(() => {
    if (!supportsNativeBottomAccessory) {
      setHideNativeTabsBar(false);
      return;
    }

    if (!isRootGoalsOverlayRoute) {
      setHideNativeTabsBar(false);
      return;
    }

    const timeout = setTimeout(() => {
      setHideNativeTabsBar(true);
    }, 180);

    return () => {
      clearTimeout(timeout);
    };
  }, [isRootGoalsOverlayRoute]);

  const primeGoalsZoomTransition = useCallback(() => {
    journalHaptics.light();
  }, []);

  const openJournalComposer = useCallback(() => {
    router.navigate({
      pathname: "/(tabs)/(journal)",
      params: {
        openKeyboard: Date.now().toString(),
      },
    });
  }, [router]);

  const sharedTabsScreenOptions = useCallback(({
    route,
  }: {
    route: { name: string };
  }) => {
    const routeName = route.name as PrimaryTabRoute;
    const tab = TAB_CONFIG[routeName];

    return {
      headerShown: false,
      sceneStyle: {
        backgroundColor: C.bgPrimary,
      },
      tabBarActiveTintColor: C.accentBlue,
      tabBarIcon: ({ color, focused }: { color: string; focused: boolean }) => (
        <AppSymbol
          color={color}
          name={focused ? tab.icon.selected : tab.icon.default}
          size={18}
          weight={focused ? "medium" : "regular"}
        />
      ),
      title: tab.title,
    };
  }, [C.accentBlue, C.bgPrimary]);

  if (Platform.OS === "ios") {
    return (
      <View style={styles.iosRoot}>
        <NativeTabs
          blurEffect="systemDefault"
          hidden={hideNativeTabsBar}
          labelStyle={{
            color: nativeTabsTintColor,
            fontSize: 10,
            fontWeight: "600",
          }}
          minimizeBehavior={supportsNativeBottomAccessory ? "onScrollDown" : undefined}
          tintColor={nativeTabsTintColor}
        >
          {isJournalContextActive && supportsNativeBottomAccessory ? (
            <NativeTabs.BottomAccessory>
              <JournalTabAccessory
                interactionDisabled={isGoalsOpen || isGoalsAccessoryPrimed}
                goalsOpen={goalsAccessoryActive}
                onPress={openGoals}
                totals={totals}
              />
            </NativeTabs.BottomAccessory>
          ) : null}
          <NativeTabs.Trigger
            name="(journal)"
            role="bookmarks"
            contentStyle={{ backgroundColor: C.bgPrimary }}
          >
            <NativeTabs.Trigger.Icon sf={{ default: "book.closed", selected: "book.closed.fill" }} />
            <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name="chat"
            role="topRated"
            contentStyle={{ backgroundColor: C.bgPrimary }}
          >
            <NativeTabs.Trigger.Icon sf={{ default: "message", selected: "message.fill" }} />
            <NativeTabs.Trigger.Label>Assistant</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name="notes"
            role="search"
            contentStyle={{ backgroundColor: C.bgPrimary }}
            disableAutomaticContentInsets
            listeners={{
              tabPress: () => {
                requestAnimationFrame(() => {
                  openJournalComposer();
                });
              },
            }}
          >
            <NativeTabs.Trigger.Icon sf={{ default: "star", selected: "star.fill" }} />
            <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
          <NativeTabs.Trigger
            name="summary"
            role="contacts"
            contentStyle={{ backgroundColor: C.bgPrimary }}
          >
            <NativeTabs.Trigger.Icon sf={{ default: "person", selected: "person.fill" }} />
            <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
          </NativeTabs.Trigger>
        </NativeTabs>

        {showZoomMiniSurface ? (
          <View pointerEvents="box-none" style={styles.zoomMiniSurfaceHost}>
            <View style={[styles.zoomMiniSurfaceFrame, { bottom: zoomMiniSurfaceBottom }]}>
              <JournalGoalsZoomMiniSurface
                goalsOpen={isGoalsOpen}
                href={journalGoalsZoomRoute}
                onPress={primeGoalsZoomTransition}
                totals={totals}
              />
            </View>
          </View>
        ) : null}
      </View>
    );
  }

  return (
    <Tabs
      screenOptions={({ route }) => ({
        animation: "fade",
        ...sharedTabsScreenOptions({ route: { name: route.name } }),
      })}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {PRIMARY_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={({ route }) => sharedTabsScreenOptions({ route: { name: route.name } })}
          listeners={tab.name === "notes" ? {
            tabPress: () => {
              requestAnimationFrame(() => {
                openJournalComposer();
              });
            },
          } : undefined}
        />
      ))}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iosRoot: {
    flex: 1,
  },
  zoomMiniSurfaceHost: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  zoomMiniSurfaceFrame: {
    alignSelf: "center",
    position: "absolute",
    width: "84%",
    maxWidth: 360,
  },
});
