/**
 * MealEntryCard - displays a logged meal entry with liquid glass background.
 */
import React from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { colors, spacing, radius, typography } from "../../theme";

function resolveImageAsset(entry) {
  if (entry?.imageAsset && typeof entry.imageAsset === "object") {
    return entry.imageAsset;
  }

  if (entry?.image && typeof entry.image === "object") {
    return entry.image;
  }

  if (entry?.imageUri) {
    return { uri: entry.imageUri };
  }

  return null;
}

function formatFileSize(fileSize) {
  if (typeof fileSize !== "number" || !Number.isFinite(fileSize) || fileSize <= 0) {
    return "";
  }

  if (fileSize < 1024) {
    return `${fileSize} B`;
  }

  const units = ["KB", "MB", "GB"];
  let size = fileSize / 1024;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  const rounded = size >= 10 ? Math.round(size) : size.toFixed(1);
  return `${rounded} ${units[unitIndex]}`;
}

function buildImageCaption(imageAsset) {
  if (!imageAsset) {
    return "";
  }

  const parts = [];

  if (imageAsset.source) {
    parts.push(imageAsset.source);
  }

  if (imageAsset.fileName) {
    parts.push(imageAsset.fileName);
  }

  const sizeLabel = formatFileSize(imageAsset.fileSize);
  if (sizeLabel) {
    parts.push(sizeLabel);
  }

  return parts.join(" · ");
}

export function MealEntryCard({ entry }) {
  const time = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const imageAsset = resolveImageAsset(entry);
  const imageCaption = buildImageCaption(imageAsset);

  return (
    <GlassView
      isInteractive={true}
      style={[
        styles.card,
        isLiquidGlassAvailable()
          ? {}
          : { backgroundColor: "rgba(255,255,255,0.08)" },
      ]}
    >
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

      {entry.rawText ? (
        <Text style={styles.rawText}>{entry.rawText}</Text>
      ) : null}

      {imageAsset?.uri ? (
        <View style={styles.imageBlock}>
          <Image
            source={{ uri: imageAsset.uri }}
            style={styles.image}
            contentFit="cover"
            transition={100}
          />
          {imageCaption ? (
            <Text style={styles.imageCaption} numberOfLines={1}>
              {imageCaption}
            </Text>
          ) : null}
        </View>
      ) : null}

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
    </GlassView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.glassBorder,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  time: {
    ...typography.caption1,
    color: colors.systemGray2,
  },
  calories: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textPrimary,
  },
  rawText: {
    ...typography.body,
    color: "rgba(255,255,255,0.9)",
    lineHeight: 24,
  },
  imageBlock: {
    marginTop: spacing.sm,
  },
  image: {
    width: "100%",
    height: 200,
    borderRadius: radius.md,
  },
  imageCaption: {
    ...typography.caption1,
    color: colors.systemGray2,
    marginTop: spacing.xs,
  },
  itemsContainer: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.08)",
    gap: spacing.xs,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
