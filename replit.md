# NutriPal

Diário nutricional com visão computacional — entrada por texto livre ou foto do prato.

## Estrutura

- **`mobile/`** — App principal (Expo + React Native, com suporte web via Metro)
- **`backend/`** — API FastAPI para pipeline de visão e parsing nutricional

## Workflows

### Start application (porta 5000 — webview)
```bash
cd mobile && npx expo start --tunnel --port 5000 --clear
```

### Backend API (porta 8000)
```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

## Mobile (Expo)

- **Framework:** Expo SDK 54 + React Native
- **Roteamento:** expo-router (file-based, em `src/app/`)
- **State:** Zustand stores (journalStore, settingsStore, themeStore)
- **Estilo:** StyleSheet RN + expo-glass-effect (Liquid Glass)
- **Web:** Metro bundler com polyfills customizados em `polyfills/`
- **Entry web:** `index.web.tsx`
- **Entry nativo:** `index.tsx`

## Arquitetura de análise nutricional

- **Camada 0:** Dataset local TACO/USDA (custo zero, busca fuzzy)
- **Camada 1-2:** Gemini (via `mobile/src/services/gemini.js`) — precisa de EXPO_PUBLIC_GEMINI_API_KEY
- **Camada 3:** Pipeline de visão computacional (YOLOv11 + SAM 2 + Depth Anything V2)

## Theme System

- `mobile/src/store/themeStore.js` — Zustand store (colorMode, colors, setColorMode)
- Componentes subscrevem via `useThemeStore((s) => s.colors)` — seguro no web
- Light/Dark: `darkColors` / `lightColors` exportados de `mobile/src/theme/index.js`
- **NÃO usar:** `useColorScheme()`, `useContext(ThemeContext)` — causam "Invalid hook call" no web

## Estrutura de arquivos importantes

```
mobile/src/
  app/
    index.jsx             — Tela principal do diário
  components/journal/
    MealEntryCard.jsx     — Entrada inline de refeição (usa themeStore)
    ActionBar.jsx         — Barra de ações + pill de nutrição (usa themeStore)
    GoalsPanel.jsx        — Painel de metas expandido (usa themeStore)
  store/
    journalStore.js       — Entradas, data selecionada, totais
    settingsStore.js      — Refeições salvas, configurações
    themeStore.js         — Tema dark/light (Zustand, seguro no web)
  services/
    gemini.js             — Serviço Gemini AI (plug-and-play)
  config/
    ai.js                 — Config de AI (EXPO_PUBLIC_GEMINI_API_KEY)
  theme/
    index.js              — Tokens de design (cores, espaçamento, tipografia)
```

## Regras críticas

- NUNCA usar `useContext` em componentes dentro de `@gorhom/bottom-sheet` → "Invalid hook call" no web
- NUNCA usar `useThemeColors()` (chama `useColorScheme` do react-native — múltiplas instâncias no web)
- SEMPRE usar `useThemeStore` para acessar cores de tema em qualquer componente
- TextInput multiline: Enter = nova linha (não submete). Usar botão ✓ (checkmark) para submeter
- `bottomContainer` é `position: absolute` — usa `bottom: keyboardHeight` quando teclado visível
