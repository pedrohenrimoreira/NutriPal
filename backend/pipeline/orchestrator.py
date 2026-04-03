"""
pipeline/orchestrator.py — Orquestrador do pipeline de visão computacional.

Coordena a execução sequencial das etapas:
1. Segmentação  (SAM 2)       → máscaras por alimento
2. Detecção     (YOLOv11)     → labels + bounding boxes
3. Profundidade (Depth Any.)  → mapa de profundidade
4. Volume       (voxels)      → cm³ por segmento
5. Densidade    (tabela)      → gramas por item
6. Nutrição     (TACO/USDA)   → calorias e macros
7. Validação    (Gemini)      → refinamento + uncertainty_notes

Cada etapa é um módulo independente com interface bem definida.
O orchestrator gerencia o fluxo de dados entre eles.
"""

from __future__ import annotations

from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL import Image as PILImage

    from models.schemas import ImageParseRequest, ParseResponse


async def run_pipeline(
    image: "PILImage.Image",
    request: "ImageParseRequest",
) -> "ParseResponse":
    """
    Executa o pipeline completo de visão computacional.

    Args:
        image: imagem PIL decodificada do base64.
        request: metadata da requisição (referência, etc.).

    Returns:
        ParseResponse com itens identificados, totais e incerteza.

    Raises:
        NotImplementedError: stub.

    Pipeline:
        1. sam2_segmenter.segment(image) → masks
        2. yolo_detector.detect(image, masks) → detections
        3. depth_estimator.estimate(image) → depth_map
        4. volume_calculator.calculate(masks, depth_map, reference) → volumes
        5. density_table.convert(detections, volumes) → grams
        6. dataset_lookup.lookup(detections, grams) → nutrition
        7. llm_enricher.validate(image, detections, nutrition) → refined
    """
    raise NotImplementedError("TODO: implement run_pipeline")
