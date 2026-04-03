/**
 * ActionBar — keyboard input accessory bar using GlassView.
 *
 * Two modes:
 * - isEditing = false → macro totals pill (bottom of screen)
 * - isEditing = true  → action buttons above keyboard (KeyboardAvoidingView handles position)
 */
import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, spacing, radius } from "../../theme";

export function ActionBar({
  totals,
  isEditing,
  isListening,
  onToggleMic,
  onOpenCamera,
  onAddSavedMeal,
  onDismissKeyboard,
}) {
  const cal = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);

  /* ── Keyboard closed: macro summary pill ── */
  if (!isEditing) {
    return (
      <View style={styles.totalBarWrapper}>
        <GlassView
          isInteractive={true}
          style={[
            styles.totalsPill,
            isLiquidGlassAvailable()
              ? {}
              : { backgroundColor: "rgba(255, 255, 255, 0.15)" },
          ]}
        >
          <Text style={styles.totalsText}>
            <Text style={{ color: colors.accentOrange }}>🔥</Text>
            <Text style={styles.totalsVal}> {cal}</Text>
            <Text style={styles.totalsDot}> · </Text>
            <Text style={{ color: colors.carbs }}>C</Text>
            <Text style={styles.totalsVal}> {carbs}</Text>
            <Text style={styles.totalsDot}> · </Text>
            <Text style={{ color: colors.protein }}>P</Text>
            <Text style={styles.totalsVal}> {prot}</Text>
            <Text style={styles.totalsDot}> · </Text>
            <Text style={{ color: colors.fat }}>F</Text>
            <Text style={styles.totalsVal}> {fat}</Text>
          </Text>
        </GlassView>
      </View>
    );
  }

  /* ── Keyboard open: accessory bar with liquid glass ── */
  return (
    <View style={styles.accessoryBar}>
      {/* Calories pill */}
      <GlassView
        isInteractive={true}
        style={[
          styles.calPill,
          isLiquidGlassAvailable()
            ? {}
            : { backgroundColor: "rgba(255, 255, 255, 0.15)" },
        ]}
      >
        <Text style={styles.calText}>🔥 {cal}</Text>
      </GlassView>

      {/* Action buttons grouped */}
      <View style={styles.actions}>
        {/* Mic */}
        <TouchableOpacity
          onPress={onToggleMic}
          activeOpacity={0.7}
          accessibilityLabel={isListening ? "Parar gravação" : "Gravar voz"}
        >
          <GlassView
            isInteractive={true}
            style={[
              styles.actionBtn,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <Text
              style={[
                styles.actionIcon,
                { color: isListening ? colors.accentRed : colors.accentBlue },
              ]}
            >
              🎙️
            </Text>
          </GlassView>
        </TouchableOpacity>

        {/* Camera */}
        <TouchableOpacity
          onPress={onOpenCamera}
          activeOpacity={0.7}
          accessibilityLabel="Abrir câmera"
        >
          <GlassView
            isInteractive={true}
            style={[
              styles.actionBtn,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <Text style={[styles.actionIcon, { color: colors.accentPink }]}>
              📷
            </Text>
          </GlassView>
        </TouchableOpacity>

        {/* Add saved meal */}
        <TouchableOpacity
          onPress={onAddSavedMeal}
          activeOpacity={0.7}
          accessibilityLabel="Adicionar refeição salva"
        >
          <GlassView
            isInteractive={true}
            style={[
              styles.actionBtn,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>
              ＋
            </Text>
          </GlassView>
        </TouchableOpacity>

        {/* Dismiss keyboard */}
        <TouchableOpacity
          onPress={onDismissKeyboard}
          activeOpacity={0.7}
          accessibilityLabel="Fechar teclado"
        >
          <GlassView
            isInteractive={true}
            style={[
              styles.actionBtn,
              isLiquidGlassAvailable()
                ? {}
                : { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            ]}
          >
            <Text style={[styles.actionIcon, { color: colors.textSecondary }]}>
              ⌨️
            </Text>
          </GlassView>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  /* Totals bar */
  totalBarWrapper: {
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingBottom: spacing.md,
  },
  totalsPill: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: radius.full,
  },
  totalsText: {
    fontSize: 14,
    fontWeight: "500",
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  totalsVal: {
    color: colors.textPrimary,
    fontWeight: "600",
  },
  totalsDot: {
    color: colors.systemGray3,
  },

  /* Accessory bar */
  accessoryBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 0,
  },

  /* Calories pill in accessory */
  calPill: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  calText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },

  /* Action buttons */
  actions: {
    flexDirection: "row",
    gap: spacing.sm,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnActive: {
    // subtle red tint for listening state — handled by color
  },
  actionIcon: {
    fontSize: 18,
  },
});
