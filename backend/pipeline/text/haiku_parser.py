"""
pipeline/text/haiku_parser.py — Parser de texto simples via LLM barato.

Camada 1: usa Claude Haiku 4.5 ou Gemini Flash 2.5.
Custo estimado: < $0.003 por chamada.

Ativado quando: texto tem alimentos comuns não resolvidos pelo dataset.

Biblioteca: anthropic (Claude) ou google-generativeai (Gemini)
"""

from __future__ import annotations

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


async def parse_simple(
    text: str,
    unresolved_items: list[str],
) -> list[NutritionItemResponse]:
    """
    Usa LLM barato para resolver alimentos simples.

    Args:
        text: texto original do usuário (contexto).
        unresolved_items: nomes dos alimentos a resolver.

    Returns:
        Lista de NutritionItemResponse.

    TODO: implement — chamar Anthropic Haiku ou Gemini Flash com HAIKU_SYSTEM_PROMPT.
    """
    raise NotImplementedError("TODO: implement parse_simple")
