import React, { useMemo } from "react";
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";
import { ThinkingShimmer } from "../journal/ThinkingShimmer";
import type { AiUiMessage } from "../../types/ai";

function formatToolResult(value: unknown) {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

interface Props {
  message?: AiUiMessage;
  isThinking?: boolean;
}

export function AiMessageBubble({ message, isThinking = false }: Props) {
  const C = useThemeStore((state) => state.colors);

  const bubbleStyle = useMemo(() => {
    if (isThinking) {
      return [styles.bubble, { backgroundColor: C.bgSecondary, borderColor: C.separator }];
    }

    if (!message) {
      return [styles.bubble, { backgroundColor: C.bgSecondary, borderColor: C.separator }];
    }

    if (message.role === "user") {
      return [styles.bubble, styles.userBubble, { backgroundColor: C.accentBlue, borderColor: C.accentBlue }];
    }

    if (message.role === "error") {
      return [styles.bubble, { backgroundColor: "rgba(220,38,38,0.10)", borderColor: "rgba(220,38,38,0.24)" }];
    }

    return [styles.bubble, { backgroundColor: C.bgSecondary, borderColor: C.separator }];
  }, [C, isThinking, message]);

  if (isThinking) {
    return (
      <View style={bubbleStyle}>
        <ThinkingShimmer />
      </View>
    );
  }

  if (!message) return null;

  return (
    <View style={bubbleStyle}>
      {message.imageUri ? (
        <Image source={{ uri: message.imageUri }} style={styles.imagePreview} resizeMode="cover" />
      ) : null}

      <Text
        style={[
          styles.messageText,
          {
            color: message.role === "user" ? "#fff" : C.textPrimary,
          },
        ]}
      >
        {message.text}
      </Text>

      {message.toolInvocations?.length ? (
        <View style={styles.toolsList}>
          {message.toolInvocations.map((tool, index) => (
            <View key={`${tool.name}-${index}`} style={[styles.toolCard, { borderColor: C.separator }]}>
              <Text style={[styles.toolName, { color: C.accentBlue }]}>{tool.name}</Text>
              <Text style={[styles.toolResult, { color: C.textSecondary }]}>
                {formatToolResult(tool.result)}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      {message.citations?.length ? (
        <View style={styles.citationRow}>
          {message.citations.map((citation, index) => (
            <TouchableOpacity
              key={`${citation.url}-${index}`}
              activeOpacity={0.75}
              onPress={() => Linking.openURL(citation.url)}
              style={[styles.citationChip, { borderColor: C.separator }]}
            >
              <Text style={[styles.citationText, { color: C.accentBlue }]}>
                {citation.domain || citation.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  bubble: {
    borderWidth: 1,
    borderRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  userBubble: {
    alignSelf: "flex-end",
  },
  messageText: {
    ...typography.body,
    lineHeight: 24,
  },
  imagePreview: {
    width: "100%",
    height: 176,
    borderRadius: radius.lg,
  },
  toolsList: {
    gap: spacing.sm,
  },
  toolCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  toolName: {
    ...typography.caption1,
    fontWeight: "700",
  },
  toolResult: {
    ...typography.footnote,
  },
  citationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
  },
  citationChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs + 2,
  },
  citationText: {
    ...typography.caption1,
    fontWeight: "600",
  },
});
