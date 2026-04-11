import { Link, type Href } from "expo-router";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";
import journalHaptics from "../../utils/journalHaptics";
import { AppSymbol } from "../icons/AppSymbol";
import { JournalTabAccessorySurface } from "./JournalTabAccessory";

interface JournalCompactChromeProps {
  chatDisabled?: boolean;
  chatHref?: Href;
  chatZoomTarget?: boolean;
  goalsOpen?: boolean;
  interactionDisabled?: boolean;
  onOpenComposer: () => void;
  onOpenGoals: () => void;
  totals: {
    calories: number;
    carbs_g: number;
    fat_g: number;
    protein_g: number;
  };
}

const glass = (fallback: string) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

function CompactChromeButton({
  accessibilityLabel,
  color,
  iconSize,
  onPress,
  symbolName,
}: {
  accessibilityLabel: string;
  color: string;
  iconSize: number;
  onPress: () => void;
  symbolName: React.ComponentProps<typeof AppSymbol>["name"];
}) {
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);

  return (
    <TouchableOpacity
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      activeOpacity={0.92}
      hitSlop={8}
      onPress={onPress}
      style={styles.actionTouch}
    >
      <GlassView
        colorScheme={colorMode}
        glassEffectStyle="clear"
        isInteractive
        style={[
          styles.actionButton,
          glass(C.glassBgHover),
          {
            borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
          },
        ]}
      >
        <AppSymbol
          color={color}
          name={symbolName}
          size={iconSize}
          weight="medium"
        />
      </GlassView>
    </TouchableOpacity>
  );
}

export function JournalCompactChrome({
  chatDisabled = false,
  chatHref = "/chat-zoom",
  chatZoomTarget = false,
  goalsOpen = false,
  interactionDisabled = false,
  onOpenComposer,
  onOpenGoals,
  totals,
}: JournalCompactChromeProps) {
  const insets = useSafeAreaInsets();
  const C = useThemeStore((store) => store.colors);
  const colorMode = useThemeStore((store) => store.colorMode);
  const actionButtonGlassStyle = StyleSheet.flatten([
    styles.actionButton,
    glass(C.glassBgHover),
    {
      borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
    },
  ]);
  const centerSlotGlassStyle = StyleSheet.flatten([
    styles.centerSlot,
    glass(C.glassBgHover),
    {
      borderColor: colorMode === "dark" ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.58)",
    },
  ]);

  return (
    <View pointerEvents="box-none" style={styles.host}>
      <View style={[styles.frame, { bottom: Math.max(insets.bottom, 10) + 8 }]}>
        {chatDisabled ? (
          chatZoomTarget ? (
            <Link.AppleZoomTarget>
              <View collapsable={false} style={styles.actionTouch}>
                <GlassView
                  colorScheme={colorMode}
                  glassEffectStyle="clear"
                  isInteractive={false}
                  style={actionButtonGlassStyle}
                >
                  <AppSymbol
                    color={C.textPrimary}
                    name="message"
                    size={22}
                    weight="medium"
                  />
                </GlassView>
              </View>
            </Link.AppleZoomTarget>
          ) : (
            <GlassView
              colorScheme={colorMode}
              glassEffectStyle="clear"
              isInteractive={false}
              style={actionButtonGlassStyle}
            >
              <AppSymbol
                color={C.textPrimary}
                name="message"
                size={22}
                weight="medium"
              />
            </GlassView>
          )
        ) : (
          <Link asChild href={chatHref}>
            <TouchableOpacity
              accessibilityLabel="Open chat"
              accessibilityRole="button"
              activeOpacity={0.92}
              hitSlop={8}
              onPressIn={() => {
                journalHaptics.light();
              }}
              style={styles.actionTouch}
            >
              <Link.AppleZoom>
                <GlassView
                  colorScheme={colorMode}
                  glassEffectStyle="clear"
                  isInteractive
                  style={actionButtonGlassStyle}
                >
                  <AppSymbol
                    color={C.textPrimary}
                    name="message"
                    size={22}
                    weight="medium"
                  />
                </GlassView>
              </Link.AppleZoom>
            </TouchableOpacity>
          </Link>
        )}

        <GlassView
          colorScheme={colorMode}
          glassEffectStyle="clear"
          isInteractive={false}
          style={centerSlotGlassStyle}
        >
          <JournalTabAccessorySurface
            displayMode="compact"
            goalsOpen={goalsOpen}
            interactionDisabled={interactionDisabled}
            onPress={onOpenGoals}
            placement="inline"
            totals={totals}
          />
        </GlassView>

        <CompactChromeButton
          accessibilityLabel="Search or write entry"
          color={C.textPrimary}
          onPress={onOpenComposer}
          symbolName="square.and.pencil"
          iconSize={22}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  frame: {
    alignItems: "center",
    alignSelf: "center",
    flexDirection: "row",
    gap: spacing.md,
    maxWidth: 420,
    paddingHorizontal: spacing.lg,
    position: "absolute",
    width: "100%",
  },
  actionTouch: {
    borderRadius: radius.full,
  },
  actionButton: {
    alignItems: "center",
    borderCurve: "continuous",
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    width: 48,
  },
  centerSlot: {
    borderRadius: radius.full,
    borderCurve: "continuous",
    borderWidth: StyleSheet.hairlineWidth,
    flex: 1,
    height: 48,
    justifyContent: "center",
    overflow: "hidden",
    paddingHorizontal: spacing.xs,
  },
});

export default JournalCompactChrome;
