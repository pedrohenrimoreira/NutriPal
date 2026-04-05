/**
 * Global theme store (Zustand).
 *
 * Components subscribe here to get reactive dark/light colors without
 * needing React Context or useColorScheme (which caused hook issues on web).
 *
 * Usage in any component:
 *   const C = useThemeStore((s) => s.colors);
 *   const colorMode = useThemeStore((s) => s.colorMode);
 *   const setColorMode = useThemeStore((s) => s.setColorMode);
 */

import { create } from "zustand";
import { Appearance, Platform } from "react-native";
import { darkColors, lightColors } from "../theme";

export const useThemeStore = create((set) => ({
  colorMode: "dark",
  colors: darkColors,

  setColorMode: (mode) => {
    try {
      if (Platform.OS !== "web" && typeof Appearance.setColorScheme === "function") {
        Appearance.setColorScheme(mode);
      }
    } catch (_) { /* Appearance.setColorScheme may not be available on all platforms */ }

    set({
      colorMode: mode,
      colors: mode === "dark" ? darkColors : lightColors,
    });
  },
}));
