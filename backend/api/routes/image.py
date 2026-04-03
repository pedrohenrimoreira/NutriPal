"""
api/routes/image.py — POST /parse/image

Recebe uma imagem de um prato e executa a pipeline de visão
computacional completa para identificar e quantificar alimentos.

Pipeline:
  Imagem → SAM 2 (segmentação) → YOLO (detecção) → Depth Anything (profundidade)
  → Cálculo de volume → Conversão gramas → Lookup nutricional → LLM visual (validação)
"""

from fastapi import APIRouter

from models.schemas import ImageParseRequest, ParseResponse

router = APIRouter()


@router.post("/image", response_model=ParseResponse)
async def parse_image(request: ImageParseRequest) -> ParseResponse:
    """
    Analisa foto de prato e retorna estimativa nutricional.

    Args:
        request: ImageParseRequest com imagem base64 e metadata.

    Returns:
        ParseResponse com itens, totais, notas de incerteza e
        margem de erro percentual.

    Raises:
        NotImplementedError: stub — lógica ainda não implementada.
    """
    # TODO: implement
    # 1. Decodificar base64 → PIL Image
    # 2. Chamar pipeline.orchestrator.run_pipeline(image, request)
    # 3. Retornar ParseResponse consolidada
    raise NotImplementedError("TODO: implement parse_image route")
