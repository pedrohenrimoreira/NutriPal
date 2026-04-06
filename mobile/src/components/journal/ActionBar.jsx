/**
 * ActionBar — two visual states, zero layout artifacts.
 *
 * Collapsed  →  floating nutrition summary pill (tap = toggle GoalsPanel)
 * Editing    →  floating accessory row above keyboard, no background strip
 *
 * Keyboard state is owned by the parent (index.jsx).
 * isEditing is already false when keyboard is not visible,
 * so this component never renders in an orphaned state.
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
import { SymbolView } from "expo-symbols";
import { useThemeStore } from "../../store/themeStore";
import { colors, spacing, radius } from "../../theme";

/* ── helpers ──────────────────────────────────────────────────────────────── */

const glass = (fallback) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

/**
 * Single circular action button.
 * Uses SF Symbol on iOS (expo-symbols) — crisp, native, no emoji blur.
 * Falls back to a text glyph on other platforms.
 */
function ActionBtn({ sfName, fallback, color, onPress, label, active }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.65}
      accessibilityLabel={label}
    >
      <GlassView
        isInteractive
        style={[
          styles.btn,
          glass("rgba(255,255,255,0.10)"),
          active && styles.btnActive,
        ]}
      >
        {Platform.OS === "ios" ? (
          <SymbolView
            name={sfName}
            style={styles.symbol}
            type="monochrome"
            tintColor={color ?? colors.textSecondary}
          />
        ) : (
          <Text style={[styles.fallbackIcon, { color: color ?? colors.textSecondary }]}>
            {fallback}
          </Text>
        )}
      </GlassView>
    </TouchableOpacity>
  );
}

/* ── main component ────────────────────────────────────────────────────────── */

export function ActionBar({
  totals,
  isEditing,
  isListening,
  goalsExpanded,
  onToggleGoals,
  onToggleMic,
  onOpenCamera,
  onAddSavedMeal,
  onDismissKeyboard,
}) {
  const C   = useThemeStore((s) => s.colors);
  const cal   = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot  = Math.round(totals.protein_g);
  const fat   = Math.round(totals.fat_g);

  /* ─── Collapsed: floating nutrition summary ───────────────────────────── */
  if (!isEditing) {
    return (
      <View style={styles.summaryWrapper}>
        <TouchableOpacity
          onPress={onToggleGoals}
          activeOpacity={0.75}
          accessibilityLabel="Expandir metas"
        >
          <GlassView
            isInteractive
            style={[styles.summaryPill, glass("rgba(255,255,255,0.12)")]}
          >
            <View style={styles.group}>
              <Text style={styles.flame}>🔥</Text>
              <Text style={[styles.val, { color: colors.accentOrange }]}>{cal}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.group}>
              <Text style={[styles.letter, { color: colors.carbs }]}>C</Text>
              <Text style={[styles.val, { color: C.textPrimary }]}>{carbs}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.group}>
              <Text style={[styles.letter, { color: colors.protein }]}>P</Text>
              <Text style={[styles.val, { color: C.textPrimary }]}>{prot}</Text>
            </View>
            <Text style={styles.dot}>·</Text>
            <View style={styles.group}>
              <Text style={[styles.letter, { color: colors.fat }]}>F</Text>
              <Text style={[styles.val, { color: C.textPrimary }]}>{fat}</Text>
            </View>
            <Text style={[styles.chevron, goalsExpanded && styles.chevronUp]}>⌃</Text>
          </GlassView>
        </TouchableOpacity>
      </View>
    );
  }

  /* ─── Editing: floating accessory row — NO background strip ──────────── */
  return (
    <View style={styles.accessory}>
      {/* Left: elongated calories capsule */}
      <GlassView
        isInteractive
        style={[styles.calCapsule, glass("rgba(255,255,255,0.10)")]}
      >
        <Text style={styles.capsuleFlame}>🔥</Text>
        <Text style={[styles.capsuleVal, { color: C.textPrimary }]}>{cal}</Text>
      </GlassView>

      {/* Right: circular action buttons */}
      <View style={styles.btnRow}>
        <ActionBtn
          sfName={isListening ? "mic.fill" : "mic"}
          fallback="🎙"
          color={isListening ? colors.accentRed : colors.accentBlue}
          onPress={onToggleMic}
          label={isListening ? "Parar gravação" : "Gravar voz"}
          active={isListening}
        />
        <ActionBtn
          sfName="camera"
          fallback="📷"
          color={colors.accentPink}
          onPress={onOpenCamera}
          label="Câmera"
        />
        <ActionBtn
          sfName="plus"
          fallback="+"
          color={colors.accentYellow}
          onPress={onAddSavedMeal}
          label="Adicionar refeição salva"
        />
        <ActionBtn
          sfName="keyboard.chevron.compact.down"
          fallback="⌨"
          color={colors.textSecondary}
          onPress={onDismissKeyboard}
          label="Fechar teclado"
        />
      </View>
    </View>
  );
}

/* ── styles ────────────────────────────────────────────────────────────────── */

const styles = StyleSheet.create({
  /* Nutrition summary pill ------------------------------------------------ */
  summaryWrapper: {
    alignItems: "center",
    paddingVertical: spacing.md + 4,
    paddingBottom: spacing.xl + 4,
  },
  summaryPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl + 8,
    paddingVertical: spacing.sm + 7,
    borderRadius: radius.full,
    gap: spacing.sm + 2,
  },
  group: { flexDirection: "row", alignItems: "center", gap: 4 },
  flame: { fontSize: 16 },
  letter: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  val: { fontSize: 15, fontWeight: "600", color: colors.textPrimary, letterSpacing: -0.3 },
  dot: { fontSize: 14, color: colors.systemGray3 },
  chevron: {
    fontSize: 13,
    color: colors.systemGray2,
    marginLeft: spacing.xs,
    transform: [{ rotate: "180deg" }],
  },
  chevronUp: { transform: [{ rotate: "0deg" }] },

  /* Accessory row ---------------------------------------------------------- */
  accessory: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
  },

  /* Calories capsule */
  calCapsule: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl + 4,
    paddingVertical: spacing.sm + 4,
    borderRadius: radius.full,
    overflow: "hidden",
    gap: spacing.xs + 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 8,
    elevation: 4,
  },
  capsuleFlame: { fontSize: 14, lineHeight: 20 },
  capsuleVal: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
    letterSpacing: -0.3,
    lineHeight: 20,
  },

  /* Circular buttons */
  btnRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm + 1,
  },
  btn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  btnActive: {},
  symbol: {
    width: 21,
    height: 21,
  },
  fallbackIcon: {
    fontSize: 18,
    textAlign: "center",
  },
});
