import React from "react";
import {
  SymbolView,
  type SFSymbol,
  type SymbolType,
  type SymbolWeight,
} from "expo-symbols";
import {
  StyleSheet,
  Text,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";

const FALLBACK_GLYPHS: Partial<Record<SFSymbol, string>> = {
  house: "[]",
  "house.fill": "[]",
  message: "...",
  "message.fill": "...",
  magnifyingglass: "?",
  bell: "!",
  "bell.fill": "!",
  "person.crop.circle": "@",
  "person.crop.circle.fill": "@",
  "book.closed": "[]",
  "book.closed.fill": "[]",
  "list.bullet.rectangle": "[]",
  "list.bullet.rectangle.fill": "[]",
  "bubble.left": "...",
  "bubble.left.fill": "...",
  "square.and.pencil": "[]",
  "bubbles.and.sparkles": "*",
  "bubbles.and.sparkles.fill": "*",
  "wand.and.sparkles": "*",
  "chart.bar": "|||",
  "chart.bar.fill": "|||",
  "flame.fill": "*",
  gearshape: "*",
  xmark: "x",
  plus: "+",
  "arrow.up": "^",
  camera: "o",
  photo: "[]",
  "photo.on.rectangle": "[]",
  paperclip: "/\\",
  mic: "!",
  "mic.fill": "!",
  "ellipsis": "...",
  "keyboard": "[]",
  "keyboard.chevron.compact.down": "v",
  "line.3.horizontal": "≡",
  "chevron.left": "<",
  "chevron.right": ">",
  "chevron.up": "^",
  "chevron.down": "v",
  "doc.text.viewfinder": "[]",
  "scalemass.fill": "=",
  "doc.text.fill": "[]",
  "chart.line.downtrend.xyaxis": "\\",
  "fork.knife": "Y",
  target: "*",
  "figure.walk": ">",
  "clock.fill": "o",
  "slider.horizontal.3": "===",
  "moon.fill": "C",
  "sun.max.fill": "*",
  "crown.fill": "^",
  "star.fill": "*",
  "info.circle.fill": "i",
  "square.and.arrow.up.fill": "^",
  "exclamationmark.triangle.fill": "!",
  "rectangle.portrait.and.arrow.right.fill": ">",
};

interface AppSymbolProps {
  name: SFSymbol;
  color?: string;
  size?: number;
  weight?: SymbolWeight;
  type?: SymbolType;
  style?: StyleProp<ViewStyle>;
  fallbackStyle?: StyleProp<TextStyle>;
}

export function AppSymbol({
  name,
  color,
  size = 20,
  weight = "regular",
  type = "monochrome",
  style,
  fallbackStyle,
}: AppSymbolProps) {
  return (
    <SymbolView
      fallback={(
        <Text
          style={[
            styles.fallback,
            {
              color,
              fontSize: Math.max(size - 1, 12),
              lineHeight: size,
            },
            style as StyleProp<TextStyle>,
            fallbackStyle,
          ]}
        >
          {FALLBACK_GLYPHS[name] ?? "o"}
        </Text>
      )}
      name={name}
      size={size}
      style={style}
      tintColor={color}
      type={type}
      weight={weight}
    />
  );
}

const styles = StyleSheet.create({
  fallback: {
    includeFontPadding: false,
    textAlign: "center",
  },
});

export default AppSymbol;
