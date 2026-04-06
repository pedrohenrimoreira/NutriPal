"""
pipeline/text/sonnet_parser.py — Parser de texto complexo via LLM médio.

Camada 2: usa Gemini Pro 2.5.
Custo estimado: < $0.02 por chamada.

Ativado quando: prato elaborado, receita, nome de preparação regional.
Exemplos: "moqueca de camarão", "lasanha bolonhesa", "coxinha de frango".

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

SONNET_SYSTEM_PROMPT = """
Você é um nutricionista brasileiro especialista em gastronomia regional.

Regras (herda do parser simples, mais):
1. Receba alimentos em texto livre (qualquer idioma)
2. Use porções típicas brasileiras quando quantidade não especificada
3. NUNCA peça esclarecimento — sempre estime
4. Retorne APENAS JSON puro, sem markdown
5. Marque confidence como "low" quando a quantidade for estimada

Regras ADICIONAIS para pratos complexos:
6. DECOMPONHA pratos compostos em ingredientes individuais
   Ex.: "moqueca de camarão" → camarão, leite de coco, azeite de dendê,
   pimentão, tomate, cebola, coentro
7. Considere o método de preparo (frito, grelhado, cozido) e seu impacto:
   - Frito: +30-50% de gordura vs cozido
   - Grelhado: -10% de gordura vs assado
8. Conheça preparações regionais brasileiras:
   - Vatapá, acarajé, baião de dois, cuscuz nordestino
   - Polenta frita, barreado, pão de queijo
9. Para cada ingrediente, indique a porção estimada

Formato de retorno (mesmo do parser simples):
[
  {
    "name": "nome do ingrediente",
    "quantity_description": "estimativa de porção",
    "calories": 0,
    "protein_g": 0.0,
    "carbs_g": 0.0,
    "fat_g": 0.0,
    "confidence": "medium",
    "resolved_by": "llm_medium"
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
        system_instruction=SONNET_SYSTEM_PROMPT,
        generation_config=genai.GenerationConfig(
            temperature=0.3,
            max_output_tokens=2048,
        ),
    )


async def parse_complex(
    text: str,
    unresolved_items: list[str],
) -> list[NutritionItemResponse]:
    """
    Usa Gemini Pro para resolver pratos complexos e regionais.

    Args:
        text: texto original do usuário (contexto).
        unresolved_items: nomes dos pratos/alimentos a resolver.

    Returns:
        Lista de NutritionItemResponse com ingredientes decompostos.
    """
    model = _get_model()

    user_message = (
        f"Contexto do usuário: {text}\n\n"
        f"Pratos/alimentos a analisar e decompor: {', '.join(unresolved_items)}"
    )

    response = await model.generate_content_async(user_message)
    raw = response.text.strip()
    match = re.search(r"\[.*\]", raw, re.DOTALL)
    if match:
        raw = match.group(0)

    try:
        items_data: list[dict] = json.loads(raw)
    except json.JSONDecodeError as exc:
        raise ValueError(f"parse_complex: resposta inválida do Gemini — {exc}") from exc

    return [
        NutritionItemResponse(
            name=item["name"],
            quantity_description=item.get("quantity_description", "porção estimada"),
            calories=float(item.get("calories", 0)),
            protein_g=float(item.get("protein_g", 0)),
            carbs_g=float(item.get("carbs_g", 0)),
            fat_g=float(item.get("fat_g", 0)),
            confidence=item.get("confidence", "low"),
            resolved_by=item.get("resolved_by", "llm_medium"),
        )
        for item in items_data
    ]
