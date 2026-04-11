import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { useThemeStore } from "../store/themeStore";

void SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: "(tabs)",
};

export default function RootLayout() {
  const colorMode = useThemeStore((store) => store.colorMode);
  const C = useThemeStore((store) => store.colors);
  const navigationTheme = colorMode === "dark"
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: C.bgPrimary,
        card: C.bgPrimary,
      },
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: C.bgPrimary,
        card: C.bgPrimary,
      },
    };

  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: C.bgPrimary }}>
      <ThemeProvider value={navigationTheme}>
        <Stack
          initialRouteName="(tabs)"
          screenOptions={{
            contentStyle: {
              backgroundColor: C.bgPrimary,
            },
            headerShown: false,
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="chat-zoom" />
          <Stack.Screen
            name="goals-zoom"
            options={{
              contentStyle: {
                backgroundColor: "transparent",
              },
              gestureEnabled: false,
              headerShown: false,
              presentation: "transparentModal",
            }}
          />
          <Stack.Screen name="ai" />
        </Stack>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
