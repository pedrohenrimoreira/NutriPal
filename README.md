# NutriPal

NutriPal agora esta organizado como um projeto mobile-first com backend separado.
O legado do app web foi removido desta branch para concentrar o desenvolvimento no app Expo/React Native.

## Superficies ativas

- `mobile/`: aplicativo Expo Router para iPhone/Android.
- `backend/`: API FastAPI e stubs do pipeline nutricional/visao.

## Replit

- Esta branch deve ser tratada como `mobile-first`.
- O app ativo fica em `mobile/`.
- Nao existe frontend web separado nesta branch.
- No Replit, use o fluxo nativo do ambiente para abrir e iterar no app Expo/Expo Go.
- O `backend/` continua separado e pode ser executado quando voce precisar de parsing/enriquecimento.

## Filosofia do produto

- Texto livre e foto devem alimentar o mesmo fluxo de diario.
- A resolucao local vem antes de qualquer chamada de modelo pago.
- A data selecionada no diario e a fonte de verdade da experiencia.
- O backend existe para parsing e enriquecimento, nao para reconstruir a UI.

## Arquitetura em camadas

### Camada 0: resolucao local

- TACO (UNICAMP)
- USDA FoodData Central (SQLite local)
- heuristicas e tabelas locais no app / backend

### Camada 1: texto simples

- parser barato/rapido para itens triviais
- fallback para LLM apenas quando a camada local nao resolve

### Camada 2: texto complexo

- pratos compostos, receitas, ambiguidade regional

### Camada 3: foto

1. Segmentacao
2. Deteccao/classificacao
3. Estimativa de profundidade
4. Conversao de volume para gramas
5. Lookup nutricional
6. Validacao final

## Fluxo de dados

1. O usuario digita ou anexa uma foto no app mobile.
2. O app tenta resolver localmente o maximo possivel.
3. O backend recebe somente o que exige parsing/enriquecimento.
4. O resultado retorna ao mesmo dia selecionado no diario.

## Variaveis de ambiente

- `mobile/`: configuracao do app Expo
- `backend/.env.example`: chaves e configuracao da API
- `.env.example`: defaults compartilhados do workspace

## Como executar

### Mobile (Expo)

```bash
npm run mobile:start
```

Ou diretamente:

```bash
cd mobile
npm install
npx expo start --go --lan
```

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
source venv/bin/activate   # Windows: venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## Pesos dos modelos

- `backend/data/weights/README.md`

Arquivos esperados:

- `sam2_hiera_large.pt`
- `yolo11_food.pt`
- `depth_anything_v2_vitl.pth`

## Estado atual

O repositorio ainda e um scaffold em varias partes:

- o app mobile ja tem a tela principal e stores locais
- o backend ainda tem varios `TODO`
- a integracao real com LLM e pipeline de visao ainda precisa ser concluida
