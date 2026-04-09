import { Tabs } from "expo-router";
import {
  Icon,
  Label,
  NativeTabs,
} from "expo-router/unstable-native-tabs";
import React from "react";
import { Platform } from "react-native";
import { FloatingTabBar } from "../../components/navigation/FloatingTabBar";
import { PRIMARY_TABS } from "../../constants/navigation";
import { useThemeStore } from "../../store/themeStore";

export default function PrimaryTabsLayout() {
  const C = useThemeStore((store) => store.colors);

  if (Platform.OS === "ios") {
    return (
      <NativeTabs minimizeBehavior="onScrollDown">
        {PRIMARY_TABS.map((tab) => (
          <NativeTabs.Trigger
            key={tab.name}
            name={tab.name}
          >
            <Icon sf={tab.icon} />
            <Label>{tab.title}</Label>
          </NativeTabs.Trigger>
        ))}
      </NativeTabs>
    );
  }

  return (
    <Tabs
      screenOptions={{
        animation: "fade",
        headerShown: false,
        sceneStyle: {
          backgroundColor: C.bgPrimary,
        },
      }}
      tabBar={(props) => <FloatingTabBar {...props} />}
    >
      {PRIMARY_TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
          }}
        />
      ))}
    </Tabs>
  );
}
