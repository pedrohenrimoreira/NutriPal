"""
api/routes/health.py — Health-check endpoint.

GET /health
Retorna status do serviço e modelos carregados.
"""

from fastapi import APIRouter

router = APIRouter()


@router.get("/health")
async def health_check() -> dict:
    """
    Verifica se o serviço está operacional.

    Returns:
        dict com status, versão e modelos carregados.

    TODO: verificar se modelos de ML estão carregados em memória.
    """
    return {
        "status": "ok",
        "version": "0.1.0",
        "models_loaded": [],  # TODO: listar modelos carregados
    }
