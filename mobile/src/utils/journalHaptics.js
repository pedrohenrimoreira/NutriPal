import { Platform } from "react-native";
import * as Haptics from "expo-haptics";

const isWeb = Platform.OS === "web";

async function runHaptic(action) {
  if (isWeb) return;

  try {
    await action();
  } catch (_) {
    // Safe no-op fallback when haptics are unavailable or blocked.
  }
}

export function selection() {
  return runHaptic(() => Haptics.selectionAsync?.());
}

export function light() {
  return runHaptic(() =>
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Light),
  );
}

export function medium() {
  return runHaptic(() =>
    Haptics.impactAsync?.(Haptics.ImpactFeedbackStyle.Medium),
  );
}

export const journalHaptics = {
  selection,
  light,
  medium,
};

export default journalHaptics;
