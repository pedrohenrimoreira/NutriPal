import React, { useEffect } from "react";
import { View, Text, Platform, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolateColor,
} from "react-native-reanimated";
import { useThemeStore } from "../../store/themeStore";
import { typography } from "../../theme";

const CYCLE_MS = 2200;

/**
 * Animated "Thinking" text with a soft shimmer moving across the letters.
 *
 * On native: uses MaskedView + LinearGradient for a true gradient wipe.
 * On web (or if MaskedView unavailable): uses a pulsing opacity fallback.
 */

let MaskedView = null;
let LinearGradient = null;

try {
  MaskedView = require("@react-native-masked-view/masked-view").default;
} catch {}
try {
  LinearGradient = require("expo-linear-gradient").LinearGradient;
} catch {}

const canUseNativeShimmer = Platform.OS !== "web" && MaskedView && LinearGradient;

/* ── Native shimmer (gradient wipe through text mask) ──────────────────── */

function NativeShimmer() {
  const C = useThemeStore((s) => s.colors);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const gradientStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -100 + progress.value * 200 }],
  }));

  const base = C.textTertiary ?? "rgba(150,150,150,0.4)";
  const highlight = C.textSecondary ?? "rgba(150,150,150,0.8)";

  return (
    <MaskedView maskElement={<Text style={[s.text, { color: "#000" }]}>Thinking</Text>}>
      <View style={[s.colorLayer, { backgroundColor: base }]}>
        <Animated.View style={[s.gradientWrap, gradientStyle]}>
          <LinearGradient
            colors={["transparent", highlight, "transparent"]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </MaskedView>
  );
}

/* ── Web / fallback shimmer (pulsing opacity) ──────────────────────────── */

function FallbackShimmer() {
  const C = useThemeStore((s) => s.colors);
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: CYCLE_MS, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [progress]);

  const animStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + progress.value * 0.55,
  }));

  return (
    <Animated.Text style={[s.text, { color: C.textSecondary }, animStyle]}>
      Thinking
    </Animated.Text>
  );
}

/* ── Public component ──────────────────────────────────────────────────── */

export function ThinkingShimmer() {
  return (
    <View style={s.container}>
      {canUseNativeShimmer ? <NativeShimmer /> : <FallbackShimmer />}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    height: 20,
    justifyContent: "center",
  },
  text: {
    ...typography.footnote,
    fontWeight: "500",
    letterSpacing: -0.04,
  },
  colorLayer: {
    height: 20,
    width: 80,
    overflow: "hidden",
  },
  gradientWrap: {
    ...StyleSheet.absoluteFillObject,
    width: 200,
  },
});
