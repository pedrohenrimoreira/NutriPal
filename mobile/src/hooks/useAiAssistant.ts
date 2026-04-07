import { useCallback, useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import type { DocumentPickerAsset } from "expo-document-picker";
import type { ImagePickerAsset } from "expo-image-picker";
import { AiApiError, chat, toolChat, uploadFile, vision, webChat } from "../services/aiApi";
import type {
  AiMode,
  AiUiMessage,
  ChatHistoryMessage,
  LocalAsset,
} from "../types/ai";

const CHAT_SYSTEM_PROMPT = [
  "You are NutriPal's mobile AI assistant.",
  "Be concise, practical, and truthful.",
  "When the user asks for facts that may depend on current data, say when web search would improve confidence.",
].join(" ");

const TOOL_SYSTEM_PROMPT = [
  "You are NutriPal's backend tools demo.",
  "Use the available tools whenever they can answer the user's request.",
  "Summarize the result clearly after using tools.",
].join(" ");

const VISION_SYSTEM_PROMPT = [
  "You analyze user-submitted images for a mobile assistant.",
  "Describe what is visible and answer the user's question directly.",
].join(" ");

const MAX_HISTORY = 10;

function mapUiMessagesToHistory(messages: AiUiMessage[]) {
  return messages
    .filter((message): message is AiUiMessage & { role: "user" | "assistant" } =>
      message.role === "user" || message.role === "assistant",
    )
    .slice(-MAX_HISTORY)
    .map<ChatHistoryMessage>((message) => ({
      role: message.role,
      text: message.text,
    }));
}

function toLocalImage(asset: ImagePickerAsset): LocalAsset {
  return {
    uri: asset.uri,
    name: asset.fileName ?? "photo.jpg",
    type: asset.mimeType ?? "image/jpeg",
    size: asset.fileSize ?? undefined,
  };
}

function toLocalFile(asset: DocumentPickerAsset): LocalAsset {
  return {
    uri: asset.uri,
    name: asset.name,
    type: asset.mimeType ?? undefined,
    size: asset.size ?? undefined,
  };
}

function createMessage(message: Omit<AiUiMessage, "id" | "createdAt">): AiUiMessage {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    createdAt: new Date().toISOString(),
    ...message,
  };
}

export function useAiAssistant() {
  const [mode, setMode] = useState<AiMode>("chat");
  const [useWeb, setUseWeb] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<AiUiMessage[]>([
    createMessage({
      role: "assistant",
      text: "Posso responder com OpenAI, analisar imagem, usar web search e demonstrar tool calling no backend.",
    }),
  ]);
  const [selectedImage, setSelectedImage] = useState<LocalAsset | null>(null);
  const [selectedFile, setSelectedFile] = useState<LocalAsset | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSend = useMemo(
    () => Boolean(input.trim() || selectedImage),
    [input, selectedImage],
  );

  const pickImage = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setError("Permita acesso a fotos para anexar imagens.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"] as any,
      allowsEditing: false,
      quality: 1,
      selectionLimit: 1,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSelectedImage(toLocalImage(result.assets[0]));
    setError(null);
  }, []);

  const clearImage = useCallback(() => {
    setSelectedImage(null);
  }, []);

  const pickFile = useCallback(async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
    });

    if (result.canceled || !result.assets?.length) {
      return;
    }

    setSelectedFile(toLocalFile(result.assets[0]));
    setError(null);
  }, []);

  const clearFile = useCallback(() => {
    setSelectedFile(null);
  }, []);

  const uploadSelectedFile = useCallback(async () => {
    if (!selectedFile || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const uploaded = await uploadFile({ file: selectedFile });
      setMessages((current) => [
        ...current,
        createMessage({
          role: "assistant",
          text: `Arquivo enviado: ${uploaded.filename} (${Math.round(uploaded.bytes / 1024)} KB).`,
          fileName: uploaded.filename,
        }),
      ]);
      setSelectedFile(null);
    } catch (uploadError) {
      const nextError = uploadError instanceof AiApiError
        ? uploadError.message
        : "Nao foi possivel enviar o arquivo.";
      setError(nextError);
      setMessages((current) => [
        ...current,
        createMessage({
          role: "error",
          text: nextError,
          errorCode: uploadError instanceof AiApiError ? uploadError.code : null,
        }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, selectedFile]);

  const sendMessage = useCallback(async () => {
    if (!canSend || isLoading) {
      return;
    }

    const text = input.trim() || (selectedImage ? "Analyze the selected image." : "");
    const userMessage = createMessage({
      role: "user",
      text,
      imageUri: selectedImage?.uri ?? null,
      fileName: selectedFile?.name ?? null,
    });

    const nextHistory = mapUiMessagesToHistory([...messages, userMessage]);

    setMessages((current) => [...current, userMessage]);
    setInput("");
    setError(null);
    setIsLoading(true);

    try {
      const response = mode === "tools"
        ? await toolChat({
            messages: nextHistory,
            systemPrompt: TOOL_SYSTEM_PROMPT,
          })
        : selectedImage
          ? await vision({
              input: text,
              history: nextHistory.slice(0, -1),
              systemPrompt: VISION_SYSTEM_PROMPT,
              image: selectedImage,
            })
          : useWeb
            ? await webChat({
                messages: nextHistory,
                systemPrompt: CHAT_SYSTEM_PROMPT,
                useWeb: true,
              })
            : await chat({
                messages: nextHistory,
                systemPrompt: CHAT_SYSTEM_PROMPT,
              });

      setMessages((current) => [
        ...current,
        createMessage({
          role: "assistant",
          text: response.outputText,
          citations: response.citations,
          toolInvocations: response.toolInvocations,
        }),
      ]);
      setSelectedImage(null);
      setSelectedFile(null);
    } catch (sendError) {
      const nextError = sendError instanceof AiApiError
        ? sendError.message
        : "Nao foi possivel falar com o backend de IA.";

      setError(nextError);
      setMessages((current) => [
        ...current,
        createMessage({
          role: "error",
          text: nextError,
          errorCode: sendError instanceof AiApiError ? sendError.code : null,
        }),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [canSend, input, isLoading, messages, mode, selectedFile, selectedImage, useWeb]);

  return {
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
  };
}
