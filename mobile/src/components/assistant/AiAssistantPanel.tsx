import React, { useEffect, useRef, useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Keyboard,
  LayoutAnimation,
  Platform,
  ScrollView,
  type ScrollViewProps,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useAiAssistant } from "../../hooks/useAiAssistant";
import { AiMessageBubble } from "./AiMessageBubble";
import { AppSymbol } from "../icons/AppSymbol";
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
  const colorMode = useThemeStore((state) => state.colorMode);
  const [keyboardOpen, setKeyboardOpen] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
    isLoading,
    error,
    pickImage,
    takePhoto,
    clearImage,
    pickAndUploadFile,
    sendMessage,
  } = useAiAssistant();
  const inputRef = useRef<TextInput>(null);
  const hasInputText = Boolean(input.trim());

  useEffect(() => {
    const id = setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 60);

    return () => clearTimeout(id);
  }, [isLoading, messages.length]);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const show = Keyboard.addListener(showEvent, (e) => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardOpen(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hide = Keyboard.addListener(hideEvent, () => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setKeyboardOpen(false);
      setKeyboardHeight(0);
    });
    return () => { show.remove(); hide.remove(); };
  }, []);

  function openAttachmentMenu() {
    const actions = [
      {
        label: "Take Photo",
        run: () => {
          void takePhoto();
        },
      },
      {
        label: "Choose from Library",
        run: () => {
          void pickImage();
        },
      },
      {
        label: "Upload File",
        run: () => {
          void pickAndUploadFile();
        },
      },
    ];

    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          cancelButtonIndex: actions.length,
          options: [...actions.map((action) => action.label), "Cancel"],
          userInterfaceStyle: "dark",
        },
        (buttonIndex) => {
          if (buttonIndex == null || buttonIndex >= actions.length) {
            return;
          }
          actions[buttonIndex]?.run();
          requestAnimationFrame(() => {
            inputRef.current?.focus();
          });
        },
      );
      return;
    }

    Alert.alert(
      "Add to chat",
      undefined,
      [
        ...actions.map((action) => ({
          text: action.label,
          onPress: () => {
            action.run();
            requestAnimationFrame(() => {
              inputRef.current?.focus();
            });
          },
        })),
        { text: "Cancel", style: "cancel" },
      ],
      { cancelable: true },
    );
  }

  return (
    <View style={styles.container}>
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

      <View
        style={[
          styles.composerShell,
          {
            marginHorizontal: keyboardOpen ? spacing.lg : 32,
            marginBottom: keyboardHeight > 0
              ? keyboardHeight + spacing.lg
              : spacing.lg + (bottomInset || 0),
          },
        ]}
      >
        {selectedImage ? (
          <View style={styles.attachmentsRow}>
            <View style={[styles.attachmentChip, { borderColor: C.separator }]}>
              <Text style={[styles.attachmentText, { color: C.textPrimary }]}>Image attached</Text>
              <TouchableOpacity onPress={clearImage} activeOpacity={0.75}>
                <Text style={[styles.attachmentAction, { color: C.accentRed }]}>Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        {error ? (
          <Text style={[styles.errorText, { color: C.accentRed }]}>{error}</Text>
        ) : null}

        {/* Row that holds the (optionally separated) + button and the input pill */}
        <View style={keyboardOpen ? styles.composerRowWrap : null}>
          {keyboardOpen ? (
            <TouchableOpacity
              accessibilityLabel="Add to chat"
              activeOpacity={0.82}
              disabled={isLoading}
              onPress={openAttachmentMenu}
            >
              <GlassView
                colorScheme={colorMode}
                glassEffectStyle="regular"
                isInteractive
                style={[
                  styles.plusCircle,
                  glass(C.glassBg),
                  { borderColor: colorMode === "dark" ? "rgba(255,255,255,0.14)" : "rgba(0,0,0,0.08)" },
                ]}
              >
                <AppSymbol color={C.textPrimary} name="plus" size={22} weight="regular" />
              </GlassView>
            </TouchableOpacity>
          ) : null}

          <GlassView
            colorScheme={colorMode}
            glassEffectStyle="regular"
            isInteractive={false}
            style={[
              styles.composerRow,
              keyboardOpen && { flex: 1 },
              glass(C.glassBg),
              {
                borderColor: colorMode === "dark"
                  ? "rgba(255,255,255,0.14)"
                  : "rgba(0,0,0,0.08)",
              },
            ]}
          >
            {!keyboardOpen ? (
              <TouchableOpacity
                activeOpacity={0.82}
                accessibilityLabel="Add to chat"
                disabled={isLoading}
                onPress={openAttachmentMenu}
                style={styles.plusButton}
              >
                <AppSymbol color={C.textPrimary} name="plus" size={22} weight="regular" />
              </TouchableOpacity>
            ) : null}

            <TextInput
              ref={inputRef}
              value={input}
              onChangeText={setInput}
              placeholder={mode === "tools" ? "Ex.: status do pedido 10023" : "Pergunte ao Chat"}
              placeholderTextColor={C.textTertiary}
              style={[styles.input, { color: C.textPrimary }]}
              multiline
              scrollEnabled
              textAlignVertical="center"
            />

            <TouchableOpacity
              activeOpacity={0.86}
              onPress={sendMessage}
              disabled={!hasInputText || isLoading}
              style={styles.sendButtonTouch}
            >
              <View
                style={[
                  styles.sendButton,
                  hasInputText && !isLoading
                    ? styles.sendButtonActive
                    : [styles.sendButtonIdle, { borderColor: C.separator }],
                ]}
              >
                <AppSymbol
                  color={hasInputText && !isLoading ? "#111111" : C.textTertiary}
                  name="arrow.up"
                  size={18}
                  weight="semibold"
                />
              </View>
            </TouchableOpacity>
          </GlassView>
        </View>
      </View>
    </View>
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
    marginTop: spacing.sm,
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
    flex: 1,
    maxHeight: 120,
    minHeight: 24,
    paddingVertical: 0,
    paddingHorizontal: spacing.xs,
  },
  errorText: {
    ...typography.caption1,
    fontWeight: "600",
  },
  composerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    minHeight: 46,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.full,
    overflow: "hidden",
    paddingLeft: spacing.sm,
    paddingRight: 5,
    paddingVertical: 3,
  },
  plusButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonTouch: {
    borderRadius: radius.full,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonActive: {
    backgroundColor: "#ffffff",
  },
  sendButtonIdle: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
  },
  composerRowWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  plusCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderCurve: "continuous",
  },
});
