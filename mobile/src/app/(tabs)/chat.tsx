import React from "react";
import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AiAssistantPanel } from "../../components/assistant/AiAssistantPanel";
import {
  useFloatingTabBarInsets,
  useFloatingTabBarScroll,
} from "../../hooks/useFloatingTabBar";
import { useThemeStore } from "../../store/themeStore";

export default function ChatScreen() {
  const C = useThemeStore((store) => store.colors);
  const { composerBottomInset, contentBottomInset, scrollIndicatorBottomInset } = useFloatingTabBarInsets();
  const { onScroll, scrollEventThrottle } = useFloatingTabBarScroll();

  return (
    <SafeAreaView edges={["top"]} style={{ flex: 1, backgroundColor: C.bgPrimary }}>
      <View collapsable={false} style={{ flex: 1, backgroundColor: C.bgPrimary }}>
        <AiAssistantPanel
          bottomInset={composerBottomInset}
          scrollBottomInset={contentBottomInset}
          onScroll={onScroll}
          scrollEventThrottle={scrollEventThrottle}
          scrollIndicatorBottomInset={scrollIndicatorBottomInset}
        />
      </View>
    </SafeAreaView>
  );
}
