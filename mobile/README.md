# NutriPal Mobile

React Native app using `@callstack/liquid-glass` for native iOS liquid glass effects.

## Requirements

- **Mac** with Xcode 26+
- **iOS 26+** device or simulator
- Node 18+
- Ruby (for CocoaPods)

## Setup

```bash
# Install JS dependencies
cd mobile
npm install

# Install iOS native dependencies
cd ios
pod install
cd ..

# Run on iOS simulator
npm run ios

# Run on device (select your device in Xcode or via CLI)
npm run ios -- --device "Your iPhone Name"
```

## Liquid Glass usage

`@callstack/liquid-glass` is applied to:

| Element | Component | Effect |
|---|---|---|
| Header date pill | `LiquidGlassView` | `regular` |
| Streak pill | `LiquidGlassView` | `regular` |
| Meal entry cards | `LiquidGlassView` | `regular` (interactive) |
| Keyboard accessory bar | `LiquidGlassContainerView` | merged |
| Action buttons (mic/cam/+) | `LiquidGlassView` | `clear` (interactive) |
| Bottom tab bar | `LiquidGlassView` | `regular` |
| Settings cards | `LiquidGlassView` | `regular` |
| Macros totals pill | `LiquidGlassView` | `regular` |

## Keyboard

Uses `KeyboardAvoidingView` (native) with `behavior="padding"` — the `ActionBar`
rises with the keyboard automatically, no JS hacks needed.
