# NutriPal

Diário nutricional inteligente com visão computacional. Entrada por texto livre, voz ou foto do prato.

## Arquitetura

O projeto segue uma arquitetura **mobile-first** com backend separado:

```
NutriPal/
├── mobile/    # App principal — Expo + React Native
└── backend/   # API — FastAPI + pipeline de visão
```

### Mobile (Expo)

App nativo com suporte a web via Metro bundler.

- **Framework:** Expo SDK 54 + React Native 0.81
- **Roteamento:** expo-router (file-based)
- **State:** Zustand + AsyncStorage
- **UI:** NativeWind (Tailwind) + StyleSheet + Liquid Glass
- **Funcionalidades:** Journal diário, estimativa nutricional local, voz, câmera, calendário, refeições salvas

### Backend (FastAPI)

API para parsing nutricional via LLM e pipeline de visão computacional.

- **Framework:** FastAPI + Uvicorn + Pydantic
- **Processamento:** Pillow, NumPy, OpenCV
- **Busca fuzzy:** RapidFuzz (dataset local)
- **Rotas:** `GET /health`, `POST /parse/text`, `POST /parse/image`

## Filosofia do produto

- Alimentos comuns sao resolvidos localmente (sem custo de API).
- Escalonamento por camada so quando necessario.
- Pipeline de foto e o diferencial tecnico.

## Arquitetura em camadas

### Camada 0: dataset local (custo zero)

- TACO (UNICAMP)
- USDA FoodData Central
- Busca fuzzy no mobile (`nutrition.js`) e no backend (`rapidfuzz`)

### Camada 1: LLM barato para texto simples

- `gemini-2.5-flash` ou `claude-haiku-4-5-20251001`
- Entrada: texto livre + itens nao resolvidos localmente
- Saida: JSON estruturado

### Camada 2: LLM medio para texto complexo

- `claude-sonnet-4-6` ou `gemini-2.5-pro`
- Para pratos compostos e preparacoes regionais

### Camada 3: pipeline de visao (foto)

1. Segmentacao semantica (SAM 2)
2. Deteccao/classificacao (YOLOv11 fine-tuned)
3. Estimativa de profundidade (Depth Anything V2)
4. Calculo de volume por segmento
5. Conversao volume para gramas por densidade
6. Lookup nutricional em TACO/USDA
7. Validacao visual final por LLM com visao
8. Resultado com intervalo de confianca

## Como executar

### Mobile (Expo)

```bash
cd mobile
npm install
npx expo start          # Expo DevTools
npx expo start --web    # versao web (Metro)
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload  # abre em localhost:8000
```

## Pesos dos modelos

As instrucoes de download de pesos estao em:

- `backend/data/weights/README.md`

Arquivos esperados:

- `sam2_hiera_large.pt`
- `yolo11_food.pt` (ou `yolo11n.pt` como base)
- `depth_anything_v2_vitl.pth`

## Variaveis de ambiente

- Backend: `backend/.env.example`
- Monorepo: `.env.example`

## Convencoes de implementacao

- Contratos de tipos e schemas Pydantic sao a fonte de verdade.
- Cada modulo de pipeline deve continuar desacoplado por interface.
- O mobile resolve alimentos localmente (Camada 0) antes de escalar para a API.
