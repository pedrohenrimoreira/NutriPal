import { Tabs, useRouter, useSegments } from "expo-router";
import { NativeTabs } from "expo-router/unstable-native-tabs";
import React, { useCallback, useMemo } from "react";
import { DynamicColorIOS, Platform } from "react-native";
import { JournalTabAccessory } from "../../components/journal/JournalTabAccessory";
import { AppSymbol } from "../../components/icons/AppSymbol";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";
import { PRIMARY_TABS, type PrimaryTabRoute } from "../../constants/navigation";
import { useDailyTotals, useJournalStore } from "../../store/journalStore";
import { useThemeStore } from "../../store/themeStore";
import journalHaptics from "../../utils/journalHaptics";
import { supportsNativeBottomAccessory } from "../../utils/iosNavigation";

const TAB_CONFIG = Object.fromEntries(
  PRIMARY_TABS.map((tab) => [tab.name, tab]),
) as Record<PrimaryTabRoute, (typeof PRIMARY_TABS)[number]>;

export default function PrimaryTabsLayout() {
  const router = useRouter();
  const segments = useSegments() as string[];
  const C = useThemeStore((store) => store.colors);
  const { entries, journal } = useJournalStore();
  const totals = useDailyTotals(journal, entries);
  const isJournalTabFocused = segments[1] === "(journal)";
  const isGoalsOpen = isJournalTabFocused && segments[2] === "goals";
  const nativeTabsTintColor = useMemo(() => (
    Platform.OS === "ios"
      ? DynamicColorIOS({
        dark: "#ffffff",
        light: "#000000",
      })
      : undefined
  ), []);

  const nativeTabsInactiveTintColor = useMemo(() => (
    Platform.OS === "ios"
      ? DynamicColorIOS({
        dark: "#a0a0a0",
        light: "#707070",
      })
      : undefined
  ), []);

  const openGoals = useCallback(() => {
    journalHaptics.light();
    router.navigate("/(tabs)/(journal)/goals");
  }, [router]);

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
      <NativeTabs
        blurEffect="systemDefault"
        labelStyle={{
          color: nativeTabsTintColor,
          fontSize: 10,
          fontWeight: "600",
        }}
        minimizeBehavior={supportsNativeBottomAccessory ? "onScrollDown" : undefined}
        tintColor={nativeTabsTintColor}
      >
        {isJournalTabFocused && supportsNativeBottomAccessory ? (
          <NativeTabs.BottomAccessory>
            <JournalTabAccessory
              goalsOpen={isGoalsOpen}
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
          <NativeTabs.Trigger.Icon sf={{ default: "text.book.closed", selected: "text.book.closed.fill" }} />
          <NativeTabs.Trigger.Label>Journal</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="chat"
          role="topRated"
          contentStyle={{ backgroundColor: C.bgPrimary }}
        >
          <NativeTabs.Trigger.Icon sf={{ default: "sparkles", selected: "sparkles" }} />
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
          <NativeTabs.Trigger.Icon sf={{ default: "square.and.pencil", selected: "square.and.pencil" }} />
          <NativeTabs.Trigger.Label>Notes</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger
          name="summary"
          role="contacts"
          contentStyle={{ backgroundColor: C.bgPrimary }}
        >
          <NativeTabs.Trigger.Icon sf={{ default: "person.crop.circle", selected: "person.crop.circle.fill" }} />
          <NativeTabs.Trigger.Label>Profile</NativeTabs.Trigger.Label>
        </NativeTabs.Trigger>
      </NativeTabs>
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
