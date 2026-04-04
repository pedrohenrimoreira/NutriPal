# NutriLens

A nutritional diary Progressive Web App (PWA) for tracking food intake via free-text input and plate photography.

## Architecture

This is a monorepo with separate frontend and backend:

- **`frontend/`** — React 18 + Vite PWA (TypeScript, Tailwind CSS, Zustand, Dexie/IndexedDB)
- **`backend/`** — FastAPI (Python) serving a computer vision and LLM-based nutrition pipeline

## Running the App

### Frontend (port 5000)
```bash
cd frontend && npm run dev
```
Configured as the "Start application" workflow on port 5000.

### Backend (port 8000)
```bash
cd backend && uvicorn main:app --host 0.0.0.0 --port 8000
```
Configured as the "Backend API" workflow on port 8000.

The frontend proxies `/api/*` requests to the backend via Vite's proxy config.

## Key Files

- `frontend/vite.config.ts` — Vite config (proxy, host, port, PWA)
- `frontend/src/App.tsx` — Main React app entry point
- `frontend/src/store/journalStore.ts` — Zustand state management
- `frontend/src/services/nutritionRouter.ts` — Routes queries to local dataset, text API, or image API
- `backend/main.py` — FastAPI app entry point (CORS, routes)
- `backend/api/routes/` — health, text parsing, image processing endpoints
- `backend/pipeline/orchestrator.py` — Computer vision pipeline coordination

## Dependencies

### Frontend
- React 18, Vite, TypeScript, Tailwind CSS
- Zustand (state), Dexie (IndexedDB), Fuse.js (fuzzy search)
- vite-plugin-pwa (PWA support)

### Backend
- FastAPI, Uvicorn, Pydantic
- Pillow, NumPy, OpenCV (image processing)
- RapidFuzz (fuzzy search for nutritional datasets)
- Optional (commented out): Ultralytics YOLOv11, SAM 2, Google Generative AI, Anthropic

## Deployment

Configured for autoscale deployment:
- **Build:** `cd frontend && npm install && npm run build`
- **Run:** `cd backend && uvicorn main:app --host 0.0.0.0 --port 5000`

## Architecture Notes

The nutrition analysis uses a layered approach:
- **Layer 0:** Local TACO/USDA dataset lookup (zero-cost)
- **Layer 1-2:** LLM-based parsing (Claude/Gemini) for text descriptions
- **Layer 3:** Computer vision pipeline (YOLOv11 + SAM 2 + Depth Anything V2) for photo analysis
