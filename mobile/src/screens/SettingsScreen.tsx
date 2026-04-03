import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {LiquidGlassView} from '@callstack/liquid-glass';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {colors, spacing, radius, typography} from '../theme';

function SettingsRow({label, value}: {label: string; value?: string}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      {value ? <Text style={styles.rowValue}>{value}</Text> : null}
    </View>
  );
}

export function SettingsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={[styles.root]}
      contentContainerStyle={{paddingTop: insets.top + 16, paddingBottom: 40}}
    >
      <Text style={styles.title}>Configurações</Text>

      <Text style={styles.sectionHeader}>METAS DIÁRIAS</Text>
      <LiquidGlassView style={styles.card} effect="regular">
        <SettingsRow label="Calorias" value="2000 kcal" />
        <View style={styles.separator} />
        <SettingsRow label="Proteína" value="150 g" />
        <View style={styles.separator} />
        <SettingsRow label="Carboidratos" value="250 g" />
        <View style={styles.separator} />
        <SettingsRow label="Gordura" value="65 g" />
      </LiquidGlassView>

      <Text style={styles.sectionHeader}>PREFERÊNCIAS</Text>
      <LiquidGlassView style={styles.card} effect="regular">
        <SettingsRow label="Idioma" value="Português (BR)" />
        <View style={styles.separator} />
        <SettingsRow label="Viés calórico" value="Preciso" />
      </LiquidGlassView>

      <Text style={styles.sectionHeader}>DADOS</Text>
      <LiquidGlassView style={styles.card} effect="regular">
        <SettingsRow label="Exportar dados" />
        <View style={styles.separator} />
        <SettingsRow label="Limpar cache" />
      </LiquidGlassView>

      <Text style={styles.version}>NutriPal v0.1.0</Text>
    </ScrollView>
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
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.systemGray2,
    letterSpacing: 0.5,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  card: {
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
    minHeight: 48,
  },
  rowLabel: {
    ...typography.body,
  },
  rowValue: {
    ...typography.body,
    color: colors.systemGray,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginLeft: spacing.lg,
  },
  version: {
    ...typography.footnote,
    textAlign: 'center',
    marginTop: spacing.xxl,
    color: colors.systemGray3,
  },
});
