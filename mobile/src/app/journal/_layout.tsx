import { Stack } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { useThemeStore } from "../../store/themeStore";

const IOS_SHEET = Platform.OS === "ios";

export default function JournalFlowLayout() {
  const C = useThemeStore((store) => store.colors);

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
        name="calendar"
        options={{
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.66] : undefined,
          sheetGrabberVisible: IOS_SHEET,
          title: "Calendar",
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
          sheetAllowedDetents: IOS_SHEET ? "fitToContents" : undefined,
          sheetExpandsWhenScrolledToEdge: IOS_SHEET,
          sheetGrabberVisible: IOS_SHEET,
          sheetLargestUndimmedDetentIndex: IOS_SHEET ? "last" : undefined,
        }}
      />
      <Stack.Screen
        name="nutrition-goals"
        options={{
          presentation: "card",
          title: "Nutrition Goals",
        }}
      />
      <Stack.Screen
        name="health-profile"
        options={{
          presentation: "card",
          title: "Health Profile",
        }}
      />
      <Stack.Screen
        name="weight-tracking"
        options={{
          presentation: "card",
          title: "Weight Tracking",
        }}
      />
      <Stack.Screen
        name="calorie-bias"
        options={{
          presentation: "card",
          title: "Calorie Estimate Bias",
        }}
      />
      <Stack.Screen
        name="dictation-language"
        options={{
          presentation: "card",
          title: "Dictation Language",
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
          presentation: IOS_SHEET ? "card" : "modal",
          title: "Saved Meals",
        }}
      />
      <Stack.Screen
        name="settings"
        options={{
          presentation: IOS_SHEET ? "formSheet" : "modal",
          sheetAllowedDetents: IOS_SHEET ? [0.92] : undefined,
          sheetGrabberVisible: IOS_SHEET,
          title: "Settings",
        }}
      />
    </Stack>
  );
}
