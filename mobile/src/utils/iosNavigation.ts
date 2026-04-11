import { Platform } from "react-native";

function getIOSMajorVersion() {
  if (Platform.OS !== "ios") {
    return 0;
  }

  const version = Platform.Version;

  if (typeof version === "string") {
    const major = Number.parseInt(version.split(".")[0] ?? "0", 10);
    return Number.isFinite(major) ? major : 0;
  }

  return version;
}

export const IOS_MAJOR_VERSION = getIOSMajorVersion();
export const supportsAppleZoomTransition =
  Platform.OS === "ios" && IOS_MAJOR_VERSION >= 18;

export const journalGoalsLegacySheetRoute = "/(tabs)/(journal)/goals" as const;
export const journalGoalsZoomRoute = "/goals-zoom" as const;

type JournalGoalsPresentationMode = "appleMusicSheet" | "legacyFormSheet";

function getJournalGoalsPresentationMode(): JournalGoalsPresentationMode {
  return "legacyFormSheet";
}

const USE_JOURNAL_GOALS_ZOOM_MINI_SURFACE = false;
export const JOURNAL_GOALS_PRESENTATION_MODE = getJournalGoalsPresentationMode();

export const JOURNAL_GOALS_SHELL_MODE = USE_JOURNAL_GOALS_ZOOM_MINI_SURFACE
  ? "zoomMiniSurface"
  : JOURNAL_GOALS_PRESENTATION_MODE === "appleMusicSheet"
    ? "nativeAccessoryZoomSheet"
    : "nativeAccessoryFormSheet";

export const usesJournalGoalsZoomMiniSurface =
  USE_JOURNAL_GOALS_ZOOM_MINI_SURFACE && supportsAppleZoomTransition;

export const supportsNativeBottomAccessory =
  !USE_JOURNAL_GOALS_ZOOM_MINI_SURFACE
  && Platform.OS === "ios"
  && IOS_MAJOR_VERSION >= 26;

export const usesJournalGoalsCustomZoomSheet =
  JOURNAL_GOALS_PRESENTATION_MODE === "appleMusicSheet"
  && supportsNativeBottomAccessory
  && supportsAppleZoomTransition;

export const journalGoalsPresentationRoute = usesJournalGoalsCustomZoomSheet
  ? journalGoalsZoomRoute
  : journalGoalsLegacySheetRoute;

export const usesJournalGoalsAccessoryAppleZoom =
  !usesJournalGoalsZoomMiniSurface && usesJournalGoalsCustomZoomSheet;
