import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius } from "../../theme";
import { GlassIconButton } from "../GlassIconButton";

const glass = (fallback) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

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
  const cal = Math.round(totals.calories);

  if (!isEditing) {
    return null;
  }

  return (
    <View style={styles.accessory}>
      <GlassView
        isInteractive
        style={[styles.calCapsule, glass("rgba(255,255,255,0.10)")]}
      >
        <Text style={styles.capsuleFlame}>{"\u{1F525}"}</Text>
        <Text style={[styles.capsuleVal, { color: C.textPrimary }]}>{cal}</Text>
      </GlassView>

      <View style={styles.btnRow}>
        <GlassIconButton
          symbolName={isListening ? "mic.fill" : "mic"}
          fallbackIconName="mic"
          color={isListening ? C.accentRed : C.accentBlue}
          onPress={onToggleMic}
          accessibilityLabel={isListening ? "Parar ditado" : "Iniciar ditado"}
          size={44}
          iconSize={20}
          active={isListening}
        />
        <GlassIconButton
          symbolName="camera"
          fallbackIconName="camera-outline"
          color={C.accentPink}
          onPress={onOpenCamera}
          accessibilityLabel="Adicionar foto"
          size={44}
          iconSize={20}
        />
        <GlassIconButton
          symbolName="plus"
          fallbackIconName="add"
          color={C.accentYellow}
          onPress={onAddSavedMeal}
          accessibilityLabel="Salvar refeicao"
          size={44}
          iconSize={20}
        />
        <GlassIconButton
          symbolName="keyboard.chevron.compact.down"
          fallbackIconName="chevron-down"
          color={C.textSecondary}
          onPress={onDismissKeyboard}
          accessibilityLabel="Fechar teclado"
          size={44}
          iconSize={18}
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
  calCapsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
    overflow: "hidden",
    gap: spacing.xs + 1,
  },
  capsuleFlame: {
    fontSize: 14,
    lineHeight: 20,
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
    gap: spacing.sm + 1,
  },
});
