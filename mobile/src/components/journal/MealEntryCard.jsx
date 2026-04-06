/**
 * MealEntryCard — inline notebook entry.
 *
 * Renders as flowing text on the journal page, not a boxed card or bubble.
 * Each entry is time-stamped, shows raw text, and optionally a photo or
 * parsed nutrition breakdown — all inline, notebook-style.
 *
 * Tapping the body text switches to an inline TextInput (Notion-like).
 * After a 1-second debounce without changes, or on blur, the entry is
 * re-analysed with the updated text.
 */
import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Image } from "expo-image";
import { useThemeStore } from "../../store/themeStore";
import { spacing, radius, typography } from "../../theme";

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

export function MealEntryCard({ entry, onDelete, onEdit }) {
  const C = useThemeStore((s) => s.colors);

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(entry.rawText ?? "");
  const debounceRef = useRef(null);
  const lastCommittedRef = useRef(entry.rawText ?? "");

  const time = new Date(entry.createdAt).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const imageAsset = resolveImageAsset(entry);
  const imageCaption = buildImageCaption(imageAsset);

  const showText = Boolean(entry.rawText?.trim()) && !imageAsset?.uri;
  const hasBreakdown =
    !entry.isProcessing &&
    entry.parsedResult?.items?.length > 0;

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const commitEdit = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (trimmed && trimmed !== lastCommittedRef.current && onEdit) {
        lastCommittedRef.current = trimmed;
        onEdit(entry.id, trimmed);
      }
    },
    [entry.id, onEdit],
  );

  const handleTapBody = useCallback(() => {
    if (imageAsset?.uri) return;
    setEditText(entry.rawText ?? "");
    lastCommittedRef.current = entry.rawText ?? "";
    setIsEditing(true);
  }, [entry.rawText, imageAsset]);

  const handleChangeText = useCallback(
    (value) => {
      setEditText(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        setIsEditing(false);
        commitEdit(value);
      }, 1000);
    },
    [commitEdit],
  );

  const handleBlur = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    setIsEditing(false);
    commitEdit(editText);
  }, [editText, commitEdit]);

  return (
    <View style={[styles.entry, { borderBottomColor: C.separator }]}>
      {/* ── Meta row: time · processing indicator · kcal ─────────────── */}
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
          {onDelete && (
            <TouchableOpacity
              onPress={() => onDelete(entry.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.deleteButton}
            >
              <Text style={[styles.deleteIcon, { color: C.textTertiary }]}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* ── Body text (editable) ───────────────────────────────────────── */}
      {showText && (
        isEditing ? (
          <TextInput
            style={[styles.body, styles.bodyInput, { color: C.textPrimary }]}
            value={editText}
            onChangeText={handleChangeText}
            onBlur={handleBlur}
            autoFocus
            multiline
            scrollEnabled={false}
            selectionColor={C.accent ?? "#007AFF"}
            underlineColorAndroid="transparent"
          />
        ) : (
          <TouchableOpacity onPress={handleTapBody} activeOpacity={0.7}>
            <Text style={[styles.body, { color: C.textPrimary }]}>{entry.rawText}</Text>
          </TouchableOpacity>
        )
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
            <Text style={[styles.imageCaption, { color: C.textTertiary }]} numberOfLines={1}>
              {imageCaption}
            </Text>
          ) : null}
        </View>
      )}

      {/* ── Parsed items breakdown ────────────────────────────────────── */}
      {hasBreakdown && (
        <View style={styles.breakdown}>
          {entry.parsedResult.items.map((item, i) => (
            <Text key={`${item.name}-${i}`} style={[styles.breakdownItem, { color: C.textSecondary }]}>
              {item.name}
              <Text style={[styles.breakdownDot, { color: C.textTertiary }]}> · </Text>
              <Text style={[styles.breakdownCal, { color: C.textTertiary }]}>{item.calories} kcal</Text>
            </Text>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  entry: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },

  meta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.xs + 2,
  },
  time: {
    fontSize: 12,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
  metaRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  processing: {
    fontSize: 12,
    fontStyle: "italic",
    letterSpacing: 0.5,
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
  bodyInput: {
    padding: 0,
    margin: 0,
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
    gap: 3,
    paddingLeft: 2,
  },
  breakdownItem: {
    fontSize: 13,
    lineHeight: 19,
    letterSpacing: -0.1,
  },
  breakdownDot: {
  },
  breakdownCal: {
    fontWeight: "400",
  },

  deleteButton: {
    marginLeft: spacing.xs,
    padding: 2,
  },
  deleteIcon: {
    fontSize: 13,
    fontWeight: "500",
    color: "#48484a",
  },
});
