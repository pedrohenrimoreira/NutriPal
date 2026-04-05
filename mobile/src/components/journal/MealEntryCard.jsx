/**
 * MealEntryCard — inline notebook entry.
 *
 * Renders as flowing text on the journal page, not a boxed card or bubble.
 * Each entry is time-stamped, shows raw text, and optionally a photo or
 * parsed nutrition breakdown — all inline, notebook-style.
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Image } from "expo-image";
import { colors, spacing, radius, typography } from "../../theme";

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
  return parts.join(" · ");
}

export function MealEntryCard({ entry }) {
  const time = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const imageAsset = resolveImageAsset(entry);
  const imageCaption = buildImageCaption(imageAsset);

  // Only show rawText for text-only entries (image entries speak for themselves)
  const showText = Boolean(entry.rawText?.trim()) && !imageAsset?.uri;
  const hasBreakdown =
    !entry.isProcessing &&
    entry.parsedResult?.items?.length > 0;

  return (
    <View style={styles.entry}>
      {/* ── Meta row: time · processing indicator · kcal ─────────────── */}
      <View style={styles.meta}>
        <Text style={styles.time}>{time}</Text>
        <View style={styles.metaRight}>
          {entry.isProcessing ? (
            <Text style={styles.processing}>analisando</Text>
          ) : entry.parsedResult ? (
            <Text style={styles.kcal}>
              {Math.round(entry.parsedResult.totals.calories)} kcal
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Body text ─────────────────────────────────────────────────── */}
      {showText && (
        <Text style={styles.body}>{entry.rawText}</Text>
      )}

      {/* ── Photo ─────────────────────────────────────────────────────── */}
      {imageAsset?.uri && (
        <View style={styles.imageBlock}>
          <Image
            source={{ uri: imageAsset.uri }}
            style={styles.image}
            contentFit="cover"
            transition={200}
          />
          {imageCaption ? (
            <Text style={styles.imageCaption} numberOfLines={1}>
              {imageCaption}
            </Text>
          ) : null}
        </View>
      )}

      {/* ── Parsed items breakdown ────────────────────────────────────── */}
      {hasBreakdown && (
        <View style={styles.breakdown}>
          {entry.parsedResult.items.map((item, i) => (
            <Text key={`${item.name}-${i}`} style={styles.breakdownItem}>
              {item.name}
              <Text style={styles.breakdownDot}> · </Text>
              <Text style={styles.breakdownCal}>{item.calories} kcal</Text>
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  /* Inline entry — no card, no border-box, just content */
  entry: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },

  /* Meta row */
  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs + 2,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    color: colors.systemGray2,
    letterSpacing: 0.3,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  processing: {
    fontSize: 12,
    color: colors.systemGray3,
    fontStyle: "italic",
    letterSpacing: 0.5,
  },
  kcal: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.systemGray,
    letterSpacing: -0.1,
  },

  /* Body text — notebook style, large and natural */
  body: {
    ...typography.body,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 26,
    letterSpacing: -0.3,
  },

  /* Photo block — borderless, full-width */
  imageBlock: {
    marginTop: spacing.sm,
  },
  image: {
    width: "100%",
    height: 220,
    borderRadius: radius.lg,
    backgroundColor: colors.bgTertiary,
  },
  imageCaption: {
    fontSize: 12,
    color: colors.systemGray2,
    marginTop: spacing.xs,
    letterSpacing: -0.1,
  },

  /* Parsed items — subtle indented breakdown */
  breakdown: {
    marginTop: spacing.sm,
    gap: 3,
    paddingLeft: 2,
  },
  breakdownItem: {
    fontSize: 13,
    color: colors.systemGray2,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  breakdownDot: {
    color: colors.systemGray3,
  },
  breakdownCal: {
    color: colors.systemGray3,
    fontWeight: "400",
  },
});
