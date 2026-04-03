/**
 * ActionBar — keyboard input accessory bar using LiquidGlassView.
 *
 * Two modes:
 * - isEditing = false → macro totals pill (bottom of screen)
 * - isEditing = true  → action buttons above keyboard (KeyboardAvoidingView handles position)
 */
import React, {useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import {LiquidGlassView, LiquidGlassContainerView} from '@callstack/liquid-glass';
import {colors, spacing, radius} from '../../theme';
import type {NutritionTotals} from '../../types';

interface Props {
  totals: NutritionTotals;
  isEditing: boolean;
  isListening: boolean;
  onToggleMic: () => void;
  onOpenCamera: () => void;
  onAddSavedMeal: () => void;
  onDismissKeyboard: () => void;
}

export function ActionBar({
  totals,
  isEditing,
  isListening,
  onToggleMic,
  onOpenCamera,
  onAddSavedMeal,
  onDismissKeyboard,
}: Props) {
  const cal = Math.round(totals.calories);
  const carbs = Math.round(totals.carbs_g);
  const prot = Math.round(totals.protein_g);
  const fat = Math.round(totals.fat_g);

  /* ── Keyboard closed: macro summary pill ── */
  if (!isEditing) {
    return (
      <View style={styles.totalBarWrapper}>
        <LiquidGlassView style={styles.totalsPill} effect="regular">
          <Text style={styles.totalsText}>
            <Text style={{color: colors.accentOrange}}>🔥</Text>
            <Text style={styles.totalsVal}> {cal}</Text>
            <Text style={styles.totalsDot}>  ·  </Text>
            <Text style={{color: colors.carbs}}>C</Text>
            <Text style={styles.totalsVal}> {carbs}</Text>
            <Text style={styles.totalsDot}>  ·  </Text>
            <Text style={{color: colors.protein}}>P</Text>
            <Text style={styles.totalsVal}> {prot}</Text>
            <Text style={styles.totalsDot}>  ·  </Text>
            <Text style={{color: colors.fat}}>F</Text>
            <Text style={styles.totalsVal}> {fat}</Text>
          </Text>
        </LiquidGlassView>
      </View>
    );
  }

  /* ── Keyboard open: accessory bar with liquid glass ── */
  return (
    <LiquidGlassContainerView style={styles.accessoryBar}>
      {/* Calories pill */}
      <LiquidGlassView style={styles.calPill} effect="regular">
        <Text style={styles.calText}>🔥 {cal}</Text>
      </LiquidGlassView>

      {/* Action buttons grouped */}
      <View style={styles.actions}>
        {/* Mic */}
        <TouchableOpacity
          onPress={onToggleMic}
          activeOpacity={0.7}
          accessibilityLabel={isListening ? 'Parar gravação' : 'Gravar voz'}
        >
          <LiquidGlassView
            style={[styles.actionBtn, isListening && styles.actionBtnActive]}
            effect="clear"
            interactive
          >
            <Text style={[styles.actionIcon, {color: isListening ? colors.accentRed : colors.accentBlue}]}>
              🎙️
            </Text>
          </LiquidGlassView>
        </TouchableOpacity>

        {/* Camera */}
        <TouchableOpacity
          onPress={onOpenCamera}
          activeOpacity={0.7}
          accessibilityLabel="Abrir câmera"
        >
          <LiquidGlassView style={styles.actionBtn} effect="clear" interactive>
            <Text style={[styles.actionIcon, {color: colors.accentPink}]}>📷</Text>
          </LiquidGlassView>
        </TouchableOpacity>

        {/* Add saved meal */}
        <TouchableOpacity
          onPress={onAddSavedMeal}
          activeOpacity={0.7}
          accessibilityLabel="Adicionar refeição salva"
        >
          <LiquidGlassView style={styles.actionBtn} effect="clear" interactive>
            <Text style={[styles.actionIcon, {color: colors.textSecondary}]}>＋</Text>
          </LiquidGlassView>
        </TouchableOpacity>

        {/* Dismiss keyboard */}
        <TouchableOpacity
          onPress={onDismissKeyboard}
          activeOpacity={0.7}
          accessibilityLabel="Fechar teclado"
        >
          <LiquidGlassView style={styles.actionBtn} effect="clear" interactive>
            <Text style={[styles.actionIcon, {color: colors.textSecondary}]}>⌨️</Text>
          </LiquidGlassView>
        </TouchableOpacity>
      </View>
    </LiquidGlassContainerView>
  );
}

const styles = StyleSheet.create({
  /* Totals bar */
  totalBarWrapper: {
    alignItems: 'center',
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
    fontWeight: '500',
    color: colors.textPrimary,
    letterSpacing: -0.1,
  },
  totalsVal: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  totalsDot: {
    color: colors.systemGray3,
  },

  /* Accessory bar */
  accessoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    fontWeight: '700',
    color: colors.textPrimary,
  },

  /* Action buttons */
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnActive: {
    // subtle red tint for listening state — handled by color
  },
  actionIcon: {
    fontSize: 18,
  },
});
