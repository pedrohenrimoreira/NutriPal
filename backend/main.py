"""
NutriLens Backend — Entrypoint FastAPI.

Inicializa o app, configura CORS, registra rotas.

Execução:
    uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import health, text, image

# ---------------------------------------------------------------------------
# App
# ---------------------------------------------------------------------------

app = FastAPI(
    title="NutriLens API",
    description="Pipeline de visão computacional e parsing nutricional.",
    version="0.1.0",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------

# TODO: ler CORS_ORIGINS do .env via python-dotenv
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://nutrilens.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------

app.include_router(health.router, tags=["health"])
app.include_router(text.router, prefix="/parse", tags=["text"])
app.include_router(image.router, prefix="/parse", tags=["image"])
