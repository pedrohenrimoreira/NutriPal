import React, { useEffect, useRef } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useAiAssistant } from "../../hooks/useAiAssistant";
import { AiMessageBubble } from "./AiMessageBubble";
import { GlassIconButton } from "../GlassIconButton";
import { useThemeStore } from "../../store/themeStore";
import { radius, spacing, typography } from "../../theme";

const glass = (fallback: string) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

interface AiAssistantPanelProps {
  embedded?: boolean;
  bottomInset?: number;
  scrollBottomInset?: number;
  onScroll?: ScrollViewProps["onScroll"];
  scrollEventThrottle?: number;
  scrollIndicatorBottomInset?: number;
}

export function AiAssistantPanel({
  embedded = false,
  bottomInset = 0,
  scrollBottomInset,
  onScroll,
  scrollEventThrottle,
  scrollIndicatorBottomInset = 0,
}: AiAssistantPanelProps) {
  const C = useThemeStore((state) => state.colors);
  const scrollRef = useRef<ScrollView>(null);
  const {
    mode,
    setMode,
    useWeb,
    setUseWeb,
    input,
    setInput,
    messages,
    selectedImage,
    selectedFile,
    isLoading,
    error,
    canSend,
    pickImage,
    clearImage,
    pickFile,
    clearFile,
    uploadSelectedFile,
    sendMessage,
  } = useAiAssistant();

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(id);
  }, [isLoading, messages.length]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={0}
    >
      {embedded ? (
        <View style={styles.embeddedHero}>
          <Text style={[styles.embeddedEyebrow, { color: C.accentCyan }]}>NUTRI ASSISTANT</Text>
          <Text style={[styles.embeddedTitle, { color: C.textPrimary }]}>
            Chat de IA dentro da navegação principal
          </Text>
          <Text style={[styles.embeddedBody, { color: C.textSecondary }]}>
            Pergunte sobre refeições, macros, ajustes no dia e fontes nutricionais.
          </Text>
        </View>
      ) : null}

      <View style={[styles.modeRow, embedded && styles.modeRowEmbedded]}>
        {(["chat", "tools"] as const).map((value) => {
          const active = mode === value;
          return (
            <TouchableOpacity
              key={value}
              activeOpacity={0.8}
              onPress={() => setMode(value)}
              style={[
                styles.modeChip,
                {
                  backgroundColor: active ? C.accentBlue : C.bgSecondary,
                  borderColor: active ? C.accentBlue : C.separator,
                },
              ]}
            >
              <Text style={[styles.modeChipText, { color: active ? "#fff" : C.textSecondary }]}>
                {value === "chat" ? "Chat" : "Tools"}
              </Text>
            </TouchableOpacity>
          );
        })}

        <View
          style={[
            styles.webToggle,
            { borderColor: C.separator, backgroundColor: C.bgSecondary },
          ]}
        >
          <Text style={[styles.webToggleText, { color: C.textSecondary }]}>Usar web</Text>
          <Switch
            value={useWeb}
            onValueChange={setUseWeb}
            disabled={mode === "tools"}
          />
        </View>
      </View>

      <ScrollView
        ref={scrollRef}
        style={styles.messages}
        contentContainerStyle={[
          styles.messagesContent,
          embedded && styles.messagesContentEmbedded,
          { paddingBottom: spacing.xl + (scrollBottomInset ?? bottomInset) },
        ]}
        onScroll={onScroll}
        scrollEventThrottle={scrollEventThrottle}
        scrollIndicatorInsets={{
          bottom: scrollIndicatorBottomInset,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {messages.length === 0 && embedded ? (
          <GlassView style={[styles.emptyState, glass(C.glassBg)]}>
            <Text style={[styles.emptyStateTitle, { color: C.textPrimary }]}>
              Sem mensagens ainda
            </Text>
            <Text style={[styles.emptyStateBody, { color: C.textSecondary }]}>
              Experimente pedir um resumo do dia ou perguntar como melhorar proteína e calorias.
            </Text>
          </GlassView>
        ) : null}

        {messages.map((message) => (
          <AiMessageBubble key={message.id} message={message} />
        ))}
        {isLoading ? <AiMessageBubble isThinking /> : null}
      </ScrollView>

      <GlassView
        style={[
          styles.composerShell,
          glass(C.glassBg),
          bottomInset ? { marginBottom: spacing.lg + bottomInset } : null,
        ]}
      >
        <View style={styles.attachmentsRow}>
          {selectedImage ? (
            <View style={[styles.attachmentChip, { borderColor: C.separator }]}>
              <Text style={[styles.attachmentText, { color: C.textPrimary }]}>Image attached</Text>
              <TouchableOpacity onPress={clearImage} activeOpacity={0.75}>
                <Text style={[styles.attachmentAction, { color: C.accentRed }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          {selectedFile ? (
            <View style={[styles.attachmentChip, { borderColor: C.separator }]}>
              <Text style={[styles.attachmentText, { color: C.textPrimary }]} numberOfLines={1}>
                {selectedFile.name ?? "file"}
              </Text>
              <TouchableOpacity onPress={clearFile} activeOpacity={0.75}>
                <Text style={[styles.attachmentAction, { color: C.accentRed }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder={mode === "tools" ? "Ex.: status do pedido 10023" : "Digite sua mensagem"}
          placeholderTextColor={C.textTertiary}
          style={[styles.input, { color: C.textPrimary }]}
          multiline
          textAlignVertical="top"
        />

        {error ? (
          <Text style={[styles.errorText, { color: C.accentRed }]}>{error}</Text>
        ) : null}

        <View style={styles.actionsRow}>
          <View style={styles.leftActions}>
            <GlassIconButton
              onPress={pickImage}
              accessibilityLabel="Selecionar imagem"
              symbolName="photo"
              color={C.accentPink}
              size={42}
              iconSize={19}
            />
            <GlassIconButton
              onPress={pickFile}
              accessibilityLabel="Selecionar arquivo"
              symbolName="paperclip"
              color={C.accentYellow}
              size={42}
              iconSize={19}
            />
            <TouchableOpacity
              activeOpacity={0.82}
              onPress={uploadSelectedFile}
              disabled={!selectedFile || isLoading}
              style={[
                styles.uploadButton,
                {
                  backgroundColor: selectedFile && !isLoading ? C.bgSecondary : C.bgTertiary,
                  borderColor: C.separator,
                  opacity: selectedFile && !isLoading ? 1 : 0.5,
                },
              ]}
            >
              <Text style={[styles.uploadButtonText, { color: C.textSecondary }]}>Upload</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            activeOpacity={0.82}
            onPress={sendMessage}
            disabled={!canSend || isLoading}
            style={[
              styles.sendButton,
              {
                backgroundColor: canSend && !isLoading ? C.accentBlue : C.bgTertiary,
                opacity: canSend && !isLoading ? 1 : 0.6,
              },
            ]}
          >
            <Text style={styles.sendButtonText}>Enviar</Text>
          </TouchableOpacity>
        </View>
      </GlassView>
    </KeyboardAvoidingView>
  );
}

export default AiAssistantPanel;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  embeddedHero: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.xs,
  },
  embeddedEyebrow: {
    ...typography.caption1,
    fontWeight: "700",
    letterSpacing: 1,
  },
  embeddedTitle: {
    ...typography.title3,
    fontWeight: "700",
  },
  embeddedBody: {
    ...typography.footnote,
    lineHeight: 18,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
  },
  modeRowEmbedded: {
    paddingTop: spacing.md,
  },
  modeChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
  },
  modeChipText: {
    ...typography.footnote,
    fontWeight: "700",
  },
  webToggle: {
    marginLeft: "auto",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radius.full,
    paddingLeft: spacing.md,
    paddingRight: spacing.sm,
    paddingVertical: spacing.xs,
  },
  webToggleText: {
    ...typography.footnote,
    fontWeight: "600",
  },
  messages: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
    gap: spacing.md,
  },
  messagesContentEmbedded: {
    paddingTop: spacing.lg,
  },
  emptyState: {
    borderRadius: radius.xl,
    overflow: "hidden",
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.xs,
  },
  emptyStateTitle: {
    ...typography.headline,
    fontWeight: "700",
  },
  emptyStateBody: {
    ...typography.footnote,
    lineHeight: 18,
  },
  composerShell: {
    marginHorizontal: spacing.xl,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
    borderRadius: radius.xl,
    overflow: "hidden",
    padding: spacing.md,
    gap: spacing.sm,
  },
  attachmentsRow: {
    gap: spacing.xs,
  },
  attachmentChip: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  attachmentText: {
    ...typography.footnote,
    flex: 1,
  },
  attachmentAction: {
    ...typography.caption1,
    fontWeight: "700",
  },
  input: {
    ...typography.body,
    minHeight: 96,
    maxHeight: 180,
    paddingVertical: spacing.xs,
  },
  errorText: {
    ...typography.caption1,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: spacing.md,
  },
  leftActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  uploadButton: {
    borderWidth: 1,
    borderRadius: radius.full,
    paddingHorizontal: spacing.md + 2,
    paddingVertical: spacing.sm,
  },
  uploadButtonText: {
    ...typography.footnote,
    fontWeight: "700",
  },
  sendButton: {
    borderRadius: radius.full,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
  },
  sendButtonText: {
    ...typography.footnote,
    color: "#fff",
    fontWeight: "700",
  },
});
