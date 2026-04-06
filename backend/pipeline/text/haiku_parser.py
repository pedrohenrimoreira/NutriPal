"""
pipeline/text/haiku_parser.py — Parser de texto simples via LLM barato.

Camada 1: usa Gemini Flash 2.5.
Custo estimado: < $0.003 por chamada.

Ativado quando: texto tem alimentos comuns não resolvidos pelo dataset.

Biblioteca: google-generativeai (Gemini)
"""

from __future__ import annotations

import json
import os
import re

import google.generativeai as genai

from models.schemas import NutritionItemResponse

# ---------------------------------------------------------------------------
# Prompt de sistema
# ---------------------------------------------------------------------------

HAIKU_SYSTEM_PROMPT = """
Você é um nutricionista que analisa listas de alimentos em texto livre.

Regras:
1. Receba a lista de alimentos em qualquer idioma
2. Use porções típicas brasileiras quando a quantidade não for especificada:
   - arroz: 150g (1 colher de servir)
   - feijão: 100g (1 concha média)
   - bife: 120g (1 unidade média)
   - salada: 80g (1 porção)
3. NUNCA peça esclarecimento — sempre estime
4. Retorne APENAS JSON puro, sem markdown, sem explicação
5. Marque confidence como "low" quando a quantidade for estimada

Formato de retorno:
[
  {
    "name": "nome do alimento",
    "quantity_description": "1 colher de servir (~150g)",
    "calories": 195,
    "protein_g": 4.0,
    "carbs_g": 42.0,
    "fat_g": 0.5,
    "confidence": "medium",
    "resolved_by": "llm_cheap"
  }
]
""".strip()


def _get_model() -> genai.GenerativeModel:
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY not set in environment")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        model_name="gemini-2.5-flash",
        system_instruction=HAIKU_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.2,
            max_output_tokens=1024,
        ),
    )


async def parse_simple(
    text: str,
    unresolved_items: list[str],
) -> list[NutritionItemResponse]:
    """
    Usa Gemini Flash para resolver alimentos simples.

    Args:
        text: texto original do usuário (contexto).
        unresolved_items: nomes dos alimentos a resolver.

    Returns:
        Lista de NutritionItemResponse.
    """
    model = _get_model()

    user_message = (
        f"Contexto do usuário: {text}\n\n"
        f"Alimentos a analisar: {', '.join(unresolved_items)}"
    )

    response = await model.generate_content_async(user_message)
    raw = response.text.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        raw = match.group(0)

    try:
        items_data: list[dict] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"parse_simple: resposta inválida do Gemini — {exc}") from exc

    return [
        NutritionItemResponse(
            name=item["name"],
            quantity_description=item.get("quantity_description", "porção estimada"),
            calories=float(item.get("calories", 0)),
            protein_g=float(item.get("protein_g", 0)),
            carbs_g=float(item.get("carbs_g", 0)),
            fat_g=float(item.get("fat_g", 0)),
            confidence=item.get("confidence", "low"),
            resolved_by=item.get("resolved_by", "llm_cheap"),
        )
        for item in items_data
    ]
