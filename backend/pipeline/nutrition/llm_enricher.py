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

import io
import json
import os
import re
from dataclasses import dataclass
from typing import TYPE_CHECKING

import google.generativeai as genai

if TYPE_CHECKING:
    from PIL import Image as PILImage

    from pipeline.detection.yolo_detector import DetectionResult


# ---------------------------------------------------------------------------
# Prompt de sistema para o LLM visual
# ---------------------------------------------------------------------------

VISION_VALIDATION_PROMPT = """
Você é um nutricionista especialista analisando uma foto de refeição com foco em precisão calórica.

Você receberá:
1. Uma foto de um prato de comida
2. Uma lista de alimentos já detectados por IA (com nomes e quantidades estimadas)

Sua tarefa:
- Validar se os nomes dos alimentos detectados fazem sentido com o que é visível na foto
- Identificar alimentos que NÃO foram detectados: molhos, temperos, guarnições pequenas, acompanhamentos
- Estimar o tamanho das porções visíveis usando referências visuais:
  * Prato raso cheio (~400-500g total), meia-porção (~200-250g)
  * Tigela grande (~300-400ml), tigela pequena (~150-200ml)
  * Colher de sopa (~15-20g), colher de servir (~50-80g)
  * Comparar com utensílios ou bordas do prato visíveis
- Identificar o método de preparo pelo aspecto visual:
  * Dourado/crocante com superfície oleosa = frito em imersão
  * Marcas paralelas escuras na superfície = grelhado
  * Cor pálida e textura úmida = cozido na água ou vapor
  * Crosta dourada uniforme = assado no forno
  * Superfície brilhante avermelhada = refogado com molho
- Incluir no missed_items o método de preparo quando relevante para calorias (ex: "azeite de dendê para refogado", "óleo de fritura absorvido")
- Descrever cor e textura que indiquem o método de preparo
- Gerar notas de incerteza em PORTUGUÊS para exibir ao usuário
- NÃO recalcular calorias ou nutrição — apenas validar e enriquecer

Retorne um JSON com:
{
  "validated_items": [
    {"name": "...", "is_correct": true/false, "suggested_name": "...", "cooking_method": "frito|grelhado|cozido|assado|refogado|cru"}
  ],
  "missed_items": [
    {"name": "...", "estimated_quantity": "...", "cooking_method": "frito|grelhado|cozido|assado|refogado|cru|desconhecido", "visual_cue": "descrição do que na foto indica a presença deste item"}
  ],
  "plate_description": "descrição detalhada do prato incluindo cores, texturas e método de preparo aparente",
  "uncertainty_notes": "notas em português sobre o que pode estar impreciso na estimativa calórica",
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


def _get_model() -> genai.GenerativeModel:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=VISION_VALIDATION_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
            max_output_tokens=1024,
        ),
    )


def _pil_to_bytes(image: "PILImage.Image") -> bytes:
    buf = io.BytesIO()
    fmt = image.format or "JPEG"
    image.save(buf, format=fmt)
    return buf.getvalue()


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
    """
    model = _get_model()

    detection_list = "\n".join(
        f"- {d.label} (quantidade estimada: {getattr(d, 'quantity_description', 'desconhecida')})"
        for d in detections
    )
    user_message = (
        f"Alimentos detectados pela IA:\n{detection_list}\n\n"
        "Analise a imagem com atenção especial a:\n"
        "1. Tamanho real das porções comparado com o prato/utensílios visíveis\n"
        "2. Método de preparo (cor, textura, brilho, marcas de grelha)\n"
        "3. Ingredientes ocultos ou secundários (molhos, óleos, temperos, guarnições)\n"
        "Retorne o JSON de validação conforme instruído."
    )

    image_bytes = _pil_to_bytes(image)
    mime_type = f"image/{(image.format or 'jpeg').lower()}"

    response = await model.generate_content_async(
        [
            {"mime_type": mime_type, "data": image_bytes},
            user_message,
        ]
    )

    raw = response.text.strip()
    match = re.search(r"\{.*\}", raw, re.DOTALL)
    if match:
        raw = match.group(0)
    try:
        data: dict = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"validate_and_enrich: resposta inválida do Gemini — {exc}") from exc

    return EnrichmentResult(
        validated_items=data.get("validated_items", []),
        missed_items=data.get("missed_items", []),
        plate_description=data.get("plate_description", ""),
        uncertainty_notes=data.get("uncertainty_notes", ""),
        overall_confidence=data.get("overall_confidence", "low"),
    )
