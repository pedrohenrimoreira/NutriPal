"""
pipeline/nutrition/llm_enricher.py — Validação e enriquecimento por LLM visual.

Modelo: Gemini Flash 2.5 com visão (google-generativeai)

Etapa 7 do pipeline de visão. Recebe a foto original + lista de itens
já detectados pelo YOLO e:
  1. Valida se os nomes fazem sentido para o que está visível
  2. Identifica itens que o YOLO não detectou (molhos, temperos, guarnições)
  3. Descreve a aparência do prato para justificar estimativas
  4. Gera uncertainty_notes em português
  5. NÃO recalcula nutrição — apenas valida e enriquece

Input:  imagem + detecções do YOLO + nutrição calculada
Output: detecções refinadas + uncertainty_notes
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL import Image as PILImage

    from pipeline.detection.yolo_detector import DetectionResult


# ---------------------------------------------------------------------------
# Prompt de sistema para o LLM visual
# ---------------------------------------------------------------------------

VISION_VALIDATION_PROMPT = """
Você é um nutricionista especialista analisando uma foto de refeição.

Você receberá:
1. Uma foto de um prato de comida
2. Uma lista de alimentos já detectados por IA (com nomes e quantidades)

Sua tarefa:
- Validar se os nomes dos alimentos detectados fazem sentido com o que é visível
- Identificar alimentos que NÃO foram detectados (molhos, temperos, guarnições pequenas)
- Descrever brevemente a aparência do prato
- Gerar notas de incerteza em PORTUGUÊS para exibir ao usuário
- NÃO recalcular calorias ou nutrição — apenas validar e enriquecer

Retorne um JSON com:
{
  "validated_items": [
    {"name": "...", "is_correct": true/false, "suggested_name": "..."}
  ],
  "missed_items": [
    {"name": "...", "estimated_quantity": "..."}
  ],
  "plate_description": "...",
  "uncertainty_notes": "...",
  "overall_confidence": "high" | "medium" | "low"
}
""".strip()


@dataclass
class EnrichmentResult:
    """Resultado do enriquecimento por LLM visual."""

    validated_items: list[dict]
    missed_items: list[dict]
    plate_description: str
    uncertainty_notes: str
    overall_confidence: str


async def validate_and_enrich(
    image: "PILImage.Image",
    detections: list["DetectionResult"],
) -> EnrichmentResult:
    """
    Usa Gemini Flash com visão para validar e enriquecer as detecções.

    Args:
        image: imagem original do prato.
        detections: itens detectados pelo YOLO.

    Returns:
        EnrichmentResult com validações, itens perdidos e notas.

    TODO: implement — chamar google.generativeai com imagem + prompt.
    """
    raise NotImplementedError("TODO: implement validate_and_enrich")
