# NutriLens

NutriLens e um diario nutricional com tres formas de entrada:

1. Texto livre
2. Foto do prato
3. Barcode (futuro)

Este repositorio esta em formato de scaffold. O objetivo e documentar arquitetura, contratos e pontos de extensao. A logica de negocio ainda nao foi implementada.

## Filosofia do produto

- Alimentos comuns devem ser resolvidos localmente (sem custo de API).
- Escalonamento por camada so quando necessario.
- Pipeline de foto e o diferencial tecnico.

## Arquitetura em camadas

### Camada 0: dataset local (custo zero)

- TACO (UNICAMP)
- USDA FoodData Central (SQLite local)
- Open Food Facts (base para barcode)
- Busca fuzzy: `Fuse.js` no frontend e `rapidfuzz` no backend

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

## Fluxo de dados (alto nivel)

1. Usuario envia texto ou foto.
2. Frontend aplica roteamento (`services/nutritionRouter.ts`).
3. Camada 0 tenta resolver primeiro.
4. Itens nao resolvidos sobem para parser textual no backend.
5. Foto executa pipeline completo no backend.
6. Resultado consolidado retorna em `ParseResponse`.
7. Frontend persiste em Zustand + IndexedDB (Dexie).

## Estrutura do projeto

- `frontend/`: React 18 + TypeScript + Vite + PWA + Tailwind + Zustand + Dexie.
- `backend/`: FastAPI + contratos Pydantic + stubs de pipeline de visao.

## Variaveis de ambiente

- Frontend: `frontend/.env.example`
- Backend: `backend/.env.example`
- Monorepo (opcional): `.env.example`

## Como executar

### Frontend (PWA)

```bash
cd frontend
npm install
npm run dev          # abre em localhost:5173
npm run build        # build de producao
npm run preview      # preview do build
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate
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

## O que este scaffold NAO implementa

- Logica de negocio real
- Chamadas reais de API para LLM
- Carregamento real de modelos
- Autenticacao de usuario
- Banco de dados de producao

## Convencoes de implementacao para a proxima fase

- Funcoes de servico permanecem com stubs e `TODO`.
- Contratos de tipos e schemas sao a fonte de verdade.
- Cada modulo de pipeline deve continuar desacoplado por interface.
