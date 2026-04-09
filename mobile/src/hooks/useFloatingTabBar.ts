import { useFocusEffect } from "@react-navigation/native";
import { useCallback, useMemo, useRef } from "react";
import type {
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  PRIMARY_TAB_BAR_BOTTOM_MARGIN,
  PRIMARY_TAB_BAR_CONTENT_PADDING,
  PRIMARY_TAB_BAR_EXPANDED_HEIGHT,
} from "../constants/navigation";
import { useBottomNavStore } from "../store/bottomNavStore";

interface FloatingTabBarInsets {
  composerBottomInset: number;
  contentBottomInset: number;
  overlayBottomOffset: number;
  scrollIndicatorBottomInset: number;
  tabBarFootprint: number;
}

type ScrollEvent = NativeSyntheticEvent<NativeScrollEvent>;

export function useFloatingTabBarInsets(extraBottomPadding = 0): FloatingTabBarInsets {
  const insets = useSafeAreaInsets();

  return useMemo(() => {
    if (Platform.OS === "ios") {
      const tabBarFootprint = insets.bottom + 49;

      return {
        composerBottomInset: tabBarFootprint + 4,
        contentBottomInset: tabBarFootprint + 12 + extraBottomPadding,
        overlayBottomOffset: tabBarFootprint + 4,
        scrollIndicatorBottomInset: tabBarFootprint,
        tabBarFootprint,
      };
    }

    const tabBarFootprint =
      PRIMARY_TAB_BAR_EXPANDED_HEIGHT
      + PRIMARY_TAB_BAR_BOTTOM_MARGIN
      + insets.bottom;

    return {
      composerBottomInset: tabBarFootprint + 8,
      contentBottomInset: tabBarFootprint + PRIMARY_TAB_BAR_CONTENT_PADDING + extraBottomPadding,
      overlayBottomOffset: tabBarFootprint + 8,
      scrollIndicatorBottomInset: tabBarFootprint,
      tabBarFootprint,
    };
  }, [extraBottomPadding, insets.bottom]);
}

export function useFloatingTabBarScroll() {
  if (Platform.OS === "ios") {
    return {
      onScroll: undefined,
      scrollEventThrottle: 16 as const,
    };
  }

  const setMode = useBottomNavStore((state) => state.setMode);
  const lastOffsetRef = useRef(0);
  const lastModeRef = useRef<"expanded" | "compact">("expanded");

  const syncMode = useCallback((nextMode: "expanded" | "compact") => {
    if (lastModeRef.current === nextMode) {
      return;
    }

    lastModeRef.current = nextMode;
    setMode(nextMode);
  }, [setMode]);

  const onScroll = useCallback((event: ScrollEvent) => {
    const nextOffset = Math.max(0, event.nativeEvent.contentOffset.y);
    const delta = nextOffset - lastOffsetRef.current;
    lastOffsetRef.current = nextOffset;

    if (nextOffset <= 4) {
      syncMode("expanded");
      return;
    }

    if (delta > 10 && nextOffset > 32) {
      syncMode("compact");
      return;
    }

    if (delta < -8) {
      syncMode("expanded");
    }
  }, [syncMode]);

  useFocusEffect(
    useCallback(() => {
      lastOffsetRef.current = 0;
      lastModeRef.current = "expanded";
      setMode("expanded");

      return () => {
        lastOffsetRef.current = 0;
        lastModeRef.current = "expanded";
        setMode("expanded");
      };
    }, [setMode]),
  );

  return {
    onScroll,
    scrollEventThrottle: 16 as const,
  };
}
