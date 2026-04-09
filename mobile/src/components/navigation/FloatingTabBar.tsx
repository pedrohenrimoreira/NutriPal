import { PlatformPressable } from "@react-navigation/elements";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useLinkBuilder } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import React, { useEffect, useMemo } from "react";
import {
  Keyboard,
  Platform,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";

import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PRIMARY_TABS,
  PRIMARY_TAB_BAR_BOTTOM_MARGIN,
  PRIMARY_TAB_BAR_COMPACT_HEIGHT,
  PRIMARY_TAB_BAR_COMPACT_WIDTH,
  PRIMARY_TAB_BAR_EXPANDED_HEIGHT,
  PRIMARY_TAB_BAR_SIDE_INSET,
  type PrimaryTabRoute,
} from "../../constants/navigation";
import { useBottomNavStore } from "../../store/bottomNavStore";
import { useThemeStore } from "../../store/themeStore";
import { radius, typography } from "../../theme";
import { AppSymbol } from "../icons/AppSymbol";

const TAB_CONFIG = Object.fromEntries(
  PRIMARY_TABS.map((tab) => [tab.name, tab]),
) as Record<PrimaryTabRoute, (typeof PRIMARY_TABS)[number]>;

export function FloatingTabBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps) {
  const { buildHref } = useLinkBuilder();
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const mode = useBottomNavStore((store) => store.mode);
  const keyboardVisible = useBottomNavStore((store) => store.keyboardVisible);
  const setKeyboardVisible = useBottomNavStore((store) => store.setKeyboardVisible);
  const setMode = useBottomNavStore((store) => store.setMode);
  const activeIndex = state.index;

  const compactProgress = useSharedValue(0);
  const hiddenProgress = useSharedValue(0);
  const activeIndexProgress = useSharedValue(activeIndex);

  const expandedWidth = Math.min(
    312,
    Math.max(258, windowWidth - PRIMARY_TAB_BAR_SIDE_INSET * 4),
  );
  const compactWidth = useMemo(() => {
    const nextWidth = Math.min(
      PRIMARY_TAB_BAR_COMPACT_WIDTH,
      Math.max(212, expandedWidth - 44),
    );

    return Math.min(expandedWidth, nextWidth);
  }, [expandedWidth]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSubscription = Keyboard.addListener(showEvent, () => {
      setKeyboardVisible(true);
    });
    const hideSubscription = Keyboard.addListener(hideEvent, () => {
      setKeyboardVisible(false);
      setMode("expanded");
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [setKeyboardVisible, setMode]);

  useEffect(() => {
    compactProgress.value = withSpring(mode === "compact" ? 1 : 0, {
      damping: 18,
      mass: 0.9,
      stiffness: 180,
    });
  }, [compactProgress, mode]);

  useEffect(() => {
    hiddenProgress.value = withTiming(keyboardVisible ? 1 : 0, {
      duration: keyboardVisible ? 180 : 260,
      easing: Easing.out(Easing.cubic),
    });
  }, [hiddenProgress, keyboardVisible]);

  useEffect(() => {
    activeIndexProgress.value = withSpring(activeIndex, {
      damping: 18,
      mass: 0.9,
      stiffness: 180,
    });
  }, [activeIndex, activeIndexProgress]);

  const shellStyle = useAnimatedStyle(() => ({
    height: interpolate(
      compactProgress.value,
      [0, 1],
      [PRIMARY_TAB_BAR_EXPANDED_HEIGHT, PRIMARY_TAB_BAR_COMPACT_HEIGHT + 2],
    ),
    transform: [
      {
        translateY: interpolate(
          hiddenProgress.value,
          [0, 1],
          [0, PRIMARY_TAB_BAR_EXPANDED_HEIGHT + insets.bottom + 28],
        ),
      },
    ],
    width: interpolate(
      compactProgress.value,
      [0, 1],
      [expandedWidth, compactWidth],
    ),
  }));

  const activePillStyle = useAnimatedStyle(() => {
    const shellWidth = interpolate(
      compactProgress.value,
      [0, 1],
      [expandedWidth, compactWidth],
    );
    const horizontalPadding = interpolate(compactProgress.value, [0, 1], [6, 10]);
    const segmentWidth = (shellWidth - horizontalPadding * 2) / PRIMARY_TABS.length;
    const pillHorizontalInset = interpolate(compactProgress.value, [0, 1], [3, 4]);

    return {
      width: segmentWidth,
      transform: [{
        translateX: horizontalPadding + segmentWidth * activeIndexProgress.value,
      }],
      top: 6,
      bottom: 6,
      left: 0,
      position: "absolute",
      paddingHorizontal: pillHorizontalInset,
    };
  });

  const rowStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(compactProgress.value, [0, 1], [7, 10]),
    paddingVertical: interpolate(compactProgress.value, [0, 1], [7, 5]),
  }));

  const labelWrapStyle = useAnimatedStyle(() => {
    const translateY = interpolate(compactProgress.value, [0, 1], [0, 2]);
    const scale = interpolate(compactProgress.value, [0, 1], [1, 0.84]);

    return {
      marginTop: interpolate(compactProgress.value, [0, 1], [3, 0]),
      maxHeight: interpolate(compactProgress.value, [0, 1], [14, 0]),
      opacity: interpolate(compactProgress.value, [0, 1], [1, 0]),
      transform: [{ translateY }, { scale }] as const,
    };
  });

  const itemSurfaceStyle = useAnimatedStyle(() => ({
    paddingHorizontal: interpolate(compactProgress.value, [0, 1], [8, 6]),
    paddingVertical: interpolate(compactProgress.value, [0, 1], [6, 4]),
  }));

  const blurProps = Platform.OS === "android"
    ? { experimentalBlurMethod: "dimezisBlurView" as const }
    : {};

  return (
    <View
      pointerEvents={keyboardVisible ? "none" : "box-none"}
      style={styles.portal}
    >
      <View
        pointerEvents="box-none"
        style={[
          styles.lane,
          {
            bottom: insets.bottom + PRIMARY_TAB_BAR_BOTTOM_MARGIN,
          },
        ]}
      >
        <Animated.View style={[styles.shell, shellStyle]}>
          <View style={[styles.surfaceClip, { borderColor: C.separator }]}>
            <BlurView
              {...blurProps}
              intensity={Platform.OS === "android" ? 72 : 100}
              style={StyleSheet.absoluteFill}
              tint={colorMode === "dark" ? "dark" : "light"}
            />

            <Animated.View
              pointerEvents="none"
              style={[
                activePillStyle,
                styles.activePillFallbackWrap,
              ]}
            >
              <View
                style={[
                  styles.activePillFallback,
                  {
                    backgroundColor: colorMode === "dark"
                      ? "rgba(255,255,255,0.08)"
                      : "rgba(255,255,255,0.24)",
                    borderColor: C.separator,
                  },
                ]}
              />
            </Animated.View>

            <Animated.View style={[styles.row, rowStyle]}>
              {state.routes.map((route, index) => {
                const routeName = route.name as PrimaryTabRoute;
                const config = TAB_CONFIG[routeName];

                if (!config) {
                  return null;
                }

                const { options } = descriptors[route.key];
                const isFocused = state.index === index;

                const onPress = () => {
                  const event = navigation.emit({
                    type: "tabPress",
                    target: route.key,
                    canPreventDefault: true,
                  });

                  if (!isFocused && !event.defaultPrevented) {
                    navigation.navigate(route.name, route.params);
                  }
                };

                const onLongPress = () => {
                  navigation.emit({
                    type: "tabLongPress",
                    target: route.key,
                  });
                };

                return (
                  <PlatformPressable
                    key={route.key}
                    accessibilityLabel={options.tabBarAccessibilityLabel}
                    accessibilityRole="tab"
                    accessibilityState={isFocused ? { selected: true } : {}}
                    href={buildHref(route.name, route.params)}
                    onLongPress={onLongPress}
                    onPress={onPress}
                    style={styles.item}
                  >
                    <Animated.View style={[styles.itemSurface, itemSurfaceStyle, styles.itemSurfaceIdle]}>
                      <AppSymbol
                        color={isFocused ? C.accentBlue : C.textSecondary}
                        name={isFocused ? config.icon.selected : config.icon.default}
                        size={18}
                        weight={isFocused ? "medium" : "regular"}
                      />
                      <Animated.View style={[styles.labelWrap, labelWrapStyle]}>
                        <Text
                          numberOfLines={1}
                          style={[
                            styles.label,
                            {
                              color: isFocused ? C.textPrimary : C.textSecondary,
                            },
                          ]}
                        >
                          {config.title}
                        </Text>
                      </Animated.View>
                    </Animated.View>
                  </PlatformPressable>
                );
              })}
            </Animated.View>
          </View>
        </Animated.View>
      </View>
    </View>
  );
}

export default FloatingTabBar;

const styles = StyleSheet.create({
  portal: {
    ...StyleSheet.absoluteFillObject,
  },
  lane: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
  },
  shell: {
    alignSelf: "center",
    borderCurve: "continuous",
    overflow: "hidden",
  },
  surfaceClip: {
    flex: 1,
    position: "relative",
    borderRadius: radius.xxl,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
  },
  row: {
    flex: 1,
    flexDirection: "row",
    alignItems: "stretch",
  },
  item: {
    flex: 1,
    height: "100%",
  },
  itemSurface: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
  },
  itemSurfaceIdle: {
    backgroundColor: "transparent",
    borderColor: "transparent",
  },
  activePillFallbackWrap: {
    overflow: "hidden",
  },
  activePillFallback: {
    flex: 1,
    borderRadius: radius.xl,
    borderWidth: StyleSheet.hairlineWidth,
  },
  labelWrap: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  label: {
    ...typography.caption2,
    fontWeight: "600",
    letterSpacing: -0.1,
    textAlign: "center",
  },
});
