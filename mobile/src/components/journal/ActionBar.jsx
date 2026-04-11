import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  View,
} from "react-native";
import {
  GlassView,
  isLiquidGlassAvailable,
} from "expo-glass-effect";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing } from "../../theme";
import { GlassIconButton } from "../GlassIconButton";
import { AppSymbol } from "../icons/AppSymbol";

const glass = (fallback) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

function resolveFallbackBackground(colorMode) {
  return colorMode === "dark"
    ? "rgba(255,255,255,0.16)"
    : "rgba(0,0,0,0.07)";
}

function resolveActionBorder(colorMode) {
  return colorMode === "dark"
    ? "rgba(255,255,255,0.16)"
    : "rgba(255,255,255,0.58)";
}

export function ActionBar({
  totals,
  isEditing,
  isListening,
  onToggleMic,
  onOpenCamera,
  onAddSavedMeal,
  onDismissKeyboard,
}) {
  const C = useThemeStore((s) => s.colors);
  const colorMode = useThemeStore((s) => s.colorMode);
  const cal = Math.round(totals.calories);

  if (!isEditing) {
    return null;
  }

  return (
    <View style={styles.accessory}>
      <TouchableOpacity
        activeOpacity={1}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={styles.calCapsuleTouchable}
      >
        <GlassView
          isInteractive
          style={[
            styles.calCapsule,
            {
              borderColor: C.glassBorder ?? resolveActionBorder(colorMode),
            },
            glass(resolveFallbackBackground(colorMode)),
          ]}
        >
          <AppSymbol
            color={C.accentOrange}
            name="flame.fill"
            size={14}
            style={styles.capsuleSymbol}
            weight="medium"
          />
          <Text style={[styles.capsuleVal, { color: C.textPrimary }]}>{cal}</Text>
        </GlassView>
      </TouchableOpacity>

      <View style={styles.btnRow}>
        <GlassIconButton
          symbolName={isListening ? "mic.fill" : "mic"}
          color={isListening ? C.accentRed : C.accentBlue}
          onPress={onToggleMic}
          accessibilityLabel={isListening ? "Parar ditado" : "Iniciar ditado"}
          size={40}
          iconSize={18}
          active={isListening}
        />
        <GlassIconButton
          symbolName="camera"
          color={C.accentPink}
          onPress={onOpenCamera}
          accessibilityLabel="Adicionar foto"
          size={40}
          iconSize={18}
        />
        <GlassIconButton
          symbolName="plus"
          color={C.accentYellow}
          onPress={onAddSavedMeal}
          accessibilityLabel="Salvar refeicao"
          size={40}
          iconSize={18}
        />
        <GlassIconButton
          symbolName="keyboard.chevron.compact.down"
          color={C.textSecondary}
          onPress={onDismissKeyboard}
          accessibilityLabel="Fechar teclado"
          size={40}
          iconSize={16}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accessory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
  },
  calCapsuleTouchable: {
    overflow: "visible",
  },
  calCapsule: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 40,
    minWidth: 66,
    paddingHorizontal: spacing.lg + 2,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: "hidden",
    borderCurve: "continuous",
    gap: spacing.xs + 1,
  },
  capsuleSymbol: {
    marginTop: 1,
  },
  capsuleVal: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.3,
    lineHeight: 20,
  },
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs + 2,
  },
});
