# NutriLens

Diário nutricional com visão computacional — entrada por texto livre ou foto do prato.

## Estrutura

- **`mobile/`** — App principal (Expo + React Native, com suporte web via Metro)
- **`backend/`** — API FastAPI para pipeline de visão e parsing nutricional
- **`frontend/`** — PWA React (ignorar — foco está no mobile)

## Workflows

### Start application (porta 5000 — webview)
```bash
cd mobile && CI=1 npx expo start --web --port 5000
```

### Backend API (porta 8000)
```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```

## Mobile (Expo)

- **Framework:** Expo SDK 54 + React Native
- **Roteamento:** expo-router (file-based, em `src/app/`)
- **State:** React Context + AsyncStorage
- **Estilo:** Tailwind (via NativeWind) + StyleSheet
- **Web:** Metro bundler com polyfills customizados em `polyfills/`
- **Entry web:** `index.web.tsx`
- **Entry nativo:** `index.tsx`

## Backend (FastAPI)

- FastAPI + Uvicorn
- Pillow, NumPy, OpenCV (processamento de imagem)
- RapidFuzz (busca fuzzy em dataset nutricional)
- Rotas: `/health`, `/parse/text`, `/parse/image`

## Arquitetura de análise nutricional

- **Camada 0:** Dataset local TACO/USDA (custo zero, busca fuzzy)
- **Camada 1-2:** LLMs (Claude/Gemini) para texto
- **Camada 3:** Pipeline de visão computacional (YOLOv11 + SAM 2 + Depth Anything V2)
