/**
 * MealEntryCard
 *
 * Image entries remain separate blocks inside the journal flow.
 * Typed text now lives in the single shared journal note input.
 */
import React from "react";
import {
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Image } from "expo-image";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius, typography } from "../../theme";
import { GlassIconButton } from "../GlassIconButton";

function resolveImageAsset(entry) {
  if (entry?.imageAsset?.uri) return entry.imageAsset;
  if (entry?.image?.uri) return entry.image;
  if (entry?.imageUri) return { uri: entry.imageUri };
  return null;
}

function buildImageCaption(imageAsset) {
  if (!imageAsset) return "";
  const parts = [];

  if (imageAsset.source) parts.push(imageAsset.source);
  if (imageAsset.fileName) parts.push(imageAsset.fileName);

  if (typeof imageAsset.fileSize === "number" && imageAsset.fileSize > 0) {
    const kb = imageAsset.fileSize / 1024;
    parts.push(kb < 1024 ? `${kb.toFixed(0)} KB` : `${(kb / 1024).toFixed(1)} MB`);
  }

  return parts.join(" \u00B7 ");
}

export function MealEntryCard({ entry, onDelete }) {
  const C = useThemeStore((s) => s.colors);

  const time = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const imageAsset = resolveImageAsset(entry);
  const imageCaption = buildImageCaption(imageAsset);
  const hasBreakdown = !entry.isProcessing && entry.parsedResult?.items?.length > 0;

  if (!imageAsset?.uri && !entry.rawText?.trim()) {
    return null;
  }

  return (
    <View style={styles.entry}>
      <View style={styles.meta}>
        <Text style={[styles.time, { color: C.textTertiary }]}>{time}</Text>
        <View style={styles.metaRight}>
          {entry.isProcessing ? (
            <Text style={[styles.processing, { color: C.textTertiary }]}>analisando</Text>
          ) : entry.parsedResult ? (
            <Text style={[styles.kcal, { color: C.textSecondary }]}>
              {Math.round(entry.parsedResult.totals.calories)} kcal
            </Text>
          ) : null}
          {onDelete ? (
            <GlassIconButton
              onPress={() => onDelete(entry.id)}
              accessibilityLabel="Remover refeicao"
              symbolName="xmark"
              fallbackIconName="close"
              color={C.textTertiary}
              tone="destructive"
              size={28}
              iconSize={14}
            />
          ) : null}
        </View>
      </View>

      {entry.rawText?.trim() ? (
        <Text style={[styles.body, { color: C.textPrimary }]}>{entry.rawText}</Text>
      ) : null}

      {imageAsset?.uri ? (
        <View style={styles.imageBlock}>
          <Image
            source={{ uri: imageAsset.uri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {imageCaption ? (
            <Text style={[styles.imageCaption, { color: C.textTertiary }]} numberOfLines={1}>
              {imageCaption}
            </Text>
          ) : null}
        </View>
      ) : null}

      {hasBreakdown ? (
        <View style={styles.breakdown}>
          {entry.parsedResult.items.map((item, index) => (
            <Text key={`${item.name}-${index}`} style={[styles.breakdownItem, { color: C.textSecondary }]}>
              {item.name}
              <Text style={[styles.breakdownDot, { color: C.textTertiary }]}> {" \u00B7 "} </Text>
              <Text style={[styles.breakdownCal, { color: C.textTertiary }]}>{item.calories} kcal</Text>
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs + 2,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  processing: {
    fontSize: 12,
    fontStyle: "italic",
    letterSpacing: 0.4,
  },
  kcal: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: -0.1,
  },
  body: {
    ...typography.body,
    lineHeight: 26,
    letterSpacing: -0.3,
  },
  imageBlock: {
    marginTop: spacing.sm,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
  },
  imageCaption: {
    fontSize: 12,
    marginTop: spacing.xs,
    letterSpacing: -0.1,
  },
  breakdown: {
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  breakdownItem: {
    ...typography.footnote,
  },
  breakdownDot: {
    ...typography.caption1,
  },
  breakdownCal: {
    ...typography.caption1,
  },
});
