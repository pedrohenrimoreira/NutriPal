/**
 * MealEntryCard — displays a logged meal entry with liquid glass background.
 */
import React from 'react';
import {View, Text, Image, StyleSheet, ActivityIndicator} from 'react-native';
import {LiquidGlassView} from '@callstack/liquid-glass';
import {colors, spacing, radius, typography} from '../../theme';
import type {MealEntry} from '../../types';

interface Props {
  entry: MealEntry;
}

export function MealEntryCard({entry}: Props) {
  const time = new Date(entry.createdAt).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <LiquidGlassView style={styles.card} effect="regular" interactive>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.time}>{time}</Text>
        {entry.isProcessing && (
          <ActivityIndicator size="small" color={colors.accentGreen} />
        )}
        {entry.parsedResult && (
          <Text style={styles.calories}>
            🔥 {Math.round(entry.parsedResult.totals.calories)}
          </Text>
        )}
      </View>

      {/* Raw text */}
      {entry.rawText ? (
        <Text style={styles.rawText}>{entry.rawText}</Text>
      ) : null}

      {/* Image */}
      {entry.imageUri ? (
        <Image
          source={{uri: entry.imageUri}}
          style={styles.image}
          resizeMode="cover"
        />
      ) : null}

      {/* Parsed items */}
      {entry.parsedResult && entry.parsedResult.items.length > 0 && (
        <View style={styles.itemsContainer}>
          {entry.parsedResult.items.map((item, i) => (
            <View key={`${item.name}-${i}`} style={styles.itemRow}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemCal}>{item.calories} kcal</Text>
            </View>
          ))}
        </View>
      )}
    </LiquidGlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  time: {
    ...typography.caption1,
    color: colors.systemGray2,
  },
  calories: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  rawText: {
    ...typography.body,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 24,
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: radius.md,
    marginTop: spacing.sm,
  },
  itemsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemName: {
    ...typography.footnote,
    color: colors.systemGray,
  },
  itemCal: {
    ...typography.caption1,
    color: colors.systemGray2,
  },
});
