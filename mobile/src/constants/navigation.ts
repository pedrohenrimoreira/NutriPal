import type { SFSymbol } from "expo-symbols";

export type PrimaryTabRoute = "(journal)" | "chat" | "summary";

export interface PrimaryTabIconPair {
  default: SFSymbol;
  selected: SFSymbol;
}

export interface PrimaryTabConfig {
  name: PrimaryTabRoute;
  title: string;
  icon: PrimaryTabIconPair;
}

export const PRIMARY_TABS: readonly PrimaryTabConfig[] = [
  {
    name: "(journal)",
    title: "Journal",
    icon: { default: "book.closed", selected: "book.closed.fill" },
  },
  {
    name: "chat",
    title: "Chat",
    icon: { default: "bubble.left", selected: "bubble.left.fill" },
  },
  {
    name: "summary",
    title: "Summary",
    icon: { default: "chart.bar", selected: "chart.bar.fill" },
  },
] as const;

export const PRIMARY_TAB_BAR_EXPANDED_HEIGHT = 64;
export const PRIMARY_TAB_BAR_COMPACT_HEIGHT = 52;
export const PRIMARY_TAB_BAR_LABEL_WIDTH = 72;
export const PRIMARY_TAB_BAR_SIDE_INSET = 18;
export const PRIMARY_TAB_BAR_BOTTOM_MARGIN = 12;
export const PRIMARY_TAB_BAR_COMPACT_WIDTH = 248;
export const PRIMARY_TAB_BAR_CONTENT_PADDING = 24;
