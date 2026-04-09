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
export const supportsNativeBottomAccessory =
  Platform.OS === "ios" && IOS_MAJOR_VERSION >= 26;
