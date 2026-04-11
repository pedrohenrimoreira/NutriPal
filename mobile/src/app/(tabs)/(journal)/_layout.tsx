import { Stack, useRouter } from "expo-router";
import React from "react";
import { Platform, StyleSheet, TouchableOpacity } from "react-native";
import { AppSymbol } from "../../../components/icons/AppSymbol";
import { useThemeStore } from "../../../store/themeStore";
import journalHaptics from "../../../utils/journalHaptics";

export const unstable_settings = {
  initialRouteName: "index",
};

const IOS_SHEET = Platform.OS === "ios";

export default function JournalTabStackLayout() {
  const router = useRouter();
  const C = useThemeStore((store) => store.colors);

  const settingsChildBackButton = () => (
    <TouchableOpacity
      accessibilityLabel="Go back"
      activeOpacity={0.78}
      onPress={() => {
        journalHaptics.selection();
        router.back();
      }}
      style={styles.backButton}
    >
      <AppSymbol color={C.textPrimary} name="chevron.left" size={18} weight="medium" />
    </TouchableOpacity>
  );

  return (
    <Stack
      screenOptions={{
        contentStyle: {
          backgroundColor: C.bgPrimary,
        },
        headerBackButtonDisplayMode: "minimal",
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: C.bgPrimary,
        },
        headerTintColor: C.textPrimary,
        headerTitleStyle: {
          color: C.textPrimary,
          fontSize: 17,
          fontWeight: "600",
        },
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: IOS_SHEET,
          headerTransparent: IOS_SHEET,
          headerShadowVisible: false,
        }}
      />
      <Stack.Screen
        name="calendar"
        options={{
          headerShown: false,
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? "fitToContents" : undefined,
          sheetGrabberVisible: IOS_SHEET,
          // bgSecondary fills the entire sheet background (slightly lighter than
          // bgPrimary) so the whole formSheet has the lighter tone, not just an
          // inner card.
          contentStyle: { backgroundColor: C.bgSecondary },
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          headerShown: false,
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.92] : undefined,
          sheetGrabberVisible: IOS_SHEET,
          title: "Settings",
        }}
      />
      <Stack.Screen
        name="nutrition-details"
        options={{
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.82] : undefined,
          sheetGrabberVisible: IOS_SHEET,
          title: "Nutrition Details",
        }}
      />
      <Stack.Screen
        name="goals"
        options={{
          headerShown: false,
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.42, 0.9] : undefined,
          sheetCornerRadius: IOS_SHEET ? 34 : undefined,
          sheetExpandsWhenScrolledToEdge: IOS_SHEET,
          sheetGrabberVisible: IOS_SHEET,
          sheetInitialDetentIndex: IOS_SHEET ? 0 : undefined,
          sheetLargestUndimmedDetentIndex: IOS_SHEET ? "last" : undefined,
        }}
      />
      <Stack.Screen
        name="goals-zoom"
        options={{
          headerShown: false,
          // Transparent content lets the Journal (which stays mounted in the
          // native stack) show through the area above the card.  This is what
          // gives the expanded Goals screen the "still in Journal" feel without
          // transparentModal or a manual backdrop.
          contentStyle: { backgroundColor: "transparent" },
        }}
      />
      <Stack.Screen
        name="save-meal"
        options={{
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.48] : undefined,
          sheetGrabberVisible: IOS_SHEET,
          title: "Save Meal",
        }}
      />
      <Stack.Screen
        name="saved-meals"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Saved Meals",
        }}
      />
      <Stack.Screen
        name="nutrition-goals"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Nutrition Goals",
        }}
      />
      <Stack.Screen
        name="health-profile"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Health Profile",
        }}
      />
      <Stack.Screen
        name="weight-tracking"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Weight Tracking",
        }}
      />
      <Stack.Screen
        name="calorie-bias"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Calorie Estimate Bias",
        }}
      />
      <Stack.Screen
        name="dictation-language"
        options={{
          headerBackVisible: false,
          headerLeft: settingsChildBackButton,
          presentation: IOS_SHEET ? "modal" : "card",
          title: "Dictation Language",
        }}
      />
    </Stack>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
    minHeight: 36,
    minWidth: 36,
  },
});
