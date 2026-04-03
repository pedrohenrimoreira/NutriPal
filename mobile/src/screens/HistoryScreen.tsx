import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {LiquidGlassView} from '@callstack/liquid-glass';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, typography} from '../theme';

export function HistoryScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, {paddingTop: insets.top + 16}]}>
      <Text style={styles.title}>Histórico</Text>
      <LiquidGlassView style={styles.placeholder} effect="regular">
        <Text style={styles.placeholderText}>
          📅 Calendário com resumo por dia — em breve
        </Text>
      </LiquidGlassView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bgPrimary,
    paddingHorizontal: spacing.xl,
  },
  title: {
    ...typography.largeTitle,
    marginBottom: spacing.xl,
  },
  placeholder: {
    padding: spacing.xl,
    borderRadius: 16,
    alignItems: 'center',
  },
  placeholderText: {
    ...typography.body,
    color: colors.systemGray,
    textAlign: 'center',
  },
});
