import React, { useEffect, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useRouter } from "expo-router";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useAiAssistant } from "../hooks/useAiAssistant";
import { AiMessageBubble } from "../components/assistant/AiMessageBubble";
import { GlassIconButton } from "../components/GlassIconButton";
import { useThemeStore } from "../store/themeStore";
import { radius, spacing, typography } from "../theme";

const glass = (fallback: string) =>
  isLiquidGlassAvailable() ? {} : { backgroundColor: fallback };

export default function AiScreen() {
  const router = useRouter();
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
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={[styles.safeArea, { backgroundColor: C.bgPrimary }]}>
        <View style={styles.header}>
          <GlassIconButton
            onPress={() => router.back()}
            accessibilityLabel="Voltar"
            symbolName="chevron.left"
            fallbackIconName="chevron-back"
            color={C.textSecondary}
            size={40}
            iconSize={18}
          />

          <View style={styles.headerCopy}>
            <Text style={[styles.title, { color: C.textPrimary }]}>AI Assistant</Text>
            <Text style={[styles.subtitle, { color: C.textSecondary }]}>
              OpenAI via backend seguro
            </Text>
          </View>
        </View>

        <View style={styles.modeRow}>
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

          <View style={[styles.webToggle, { borderColor: C.separator, backgroundColor: C.bgSecondary }]}>
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
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <AiMessageBubble key={message.id} message={message} />
          ))}
          {isLoading ? <AiMessageBubble isThinking /> : null}
        </ScrollView>

        <GlassView style={[styles.composerShell, glass(C.glassBg)]}>
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
                fallbackIconName="image-outline"
                color={C.accentPink}
                size={42}
                iconSize={19}
              />
              <GlassIconButton
                onPress={pickFile}
                accessibilityLabel="Selecionar arquivo"
                symbolName="paperclip"
                fallbackIconName="attach"
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
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    gap: spacing.md,
  },
  headerCopy: {
    flex: 1,
  },
  title: {
    ...typography.title2,
  },
  subtitle: {
    ...typography.footnote,
  },
  modeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    gap: spacing.sm,
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
