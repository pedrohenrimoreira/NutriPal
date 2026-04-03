"""
pipeline/text/sonnet_parser.py — Parser de texto complexo via LLM médio.

Camada 2: usa Claude Sonnet 4.6 ou Gemini Pro 2.5.
Custo estimado: < $0.02 por chamada.

Ativado quando: prato elaborado, receita, nome de preparação regional.
Exemplos: "moqueca de camarão", "lasanha bolonhesa", "coxinha de frango".

Biblioteca: anthropic (Claude) ou google-generativeai (Gemini)
"""

from __future__ import annotations

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


async def parse_complex(
    text: str,
    unresolved_items: list[str],
) -> list[NutritionItemResponse]:
    """
    Usa LLM médio para resolver pratos complexos e regionais.

    Args:
        text: texto original do usuário (contexto).
        unresolved_items: nomes dos pratos/alimentos a resolver.

    Returns:
        Lista de NutritionItemResponse com ingredientes decompostos.

    TODO: implement — chamar Anthropic Sonnet ou Gemini Pro com SONNET_SYSTEM_PROMPT.
    """
    raise NotImplementedError("TODO: implement parse_complex")
