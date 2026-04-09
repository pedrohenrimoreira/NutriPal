import React from "react";
import { View } from "react-native";
import { useThemeStore } from "../../store/themeStore";

export default function NotesScreen() {
  const backgroundColor = useThemeStore((store) => store.colors.bgPrimary);

  return <View style={{ flex: 1, backgroundColor }} />;
}
