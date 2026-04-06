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
Você é um nutricionista brasileiro especializado em análise calórica de alimentos.
Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência primária de valores nutricionais.

Regras:
1. Receba a lista de alimentos em qualquer idioma
2. Use porções típicas brasileiras quando a quantidade não for especificada:
   - arroz branco cozido: 150g (1 colher de servir cheia) = 207 kcal
   - feijão cozido: 100g (1 concha média) = 76 kcal
   - feijão preto cozido: 100g (1 concha média) = 77 kcal
   - bife grelhado: 120g (1 unidade média) = 193 kcal
   - frango grelhado (peito): 130g (1 filé médio) = 190 kcal
   - salada mista: 80g (1 porção) = 25 kcal
   - pão francês: 50g (1 unidade) = 134 kcal
   - pão de queijo: 40g (1 unidade média) = 127 kcal
   - tapioca: 70g (1 unidade) = 144 kcal
   - cuscuz nordestino: 150g (1 porção) = 218 kcal
   - mingau de aveia: 200ml (1 copo) = 140 kcal
   - vitamina de fruta: 300ml (1 copo grande) = 195 kcal
   - suco de laranja natural: 240ml (1 copo) = 110 kcal
   - iogurte natural: 170g (1 pote) = 99 kcal
   - ovo mexido: 100g (2 ovos) = 181 kcal
   - ovo cozido: 50g (1 unidade) = 73 kcal
   - banana: 90g (1 unidade média) = 83 kcal
   - maçã: 130g (1 unidade média) = 68 kcal
   - mandioca cozida: 120g (1 porção) = 155 kcal
   - batata doce cozida: 120g (1 porção) = 105 kcal
   - macarrão cozido: 160g (1 porção) = 219 kcal
   - carne moída refogada: 100g (1 porção) = 219 kcal
   - queijo minas frescal: 30g (1 fatia) = 64 kcal
   - requeijão cremoso: 30g (1 colher de sopa cheia) = 75 kcal
   - leite integral: 200ml (1 copo) = 122 kcal
   - café com leite: 200ml (1 xícara grande) = 60 kcal
   - açaí com granola: 300g (1 tigela) = 480 kcal
   - granola: 30g (2 colheres de sopa) = 130 kcal
   - mamão formosa: 200g (1 fatia) = 74 kcal
   - laranja: 130g (1 unidade média) = 61 kcal
3. NUNCA peça esclarecimento — sempre estime
4. Retorne APENAS JSON puro, sem markdown, sem explicação
5. NUNCA retorne calories: 0 — se incerto, estime com confidence: "low"
6. Marque confidence como "medium" para itens com porção padrão conhecida, "low" para estimativas

Exemplos few-shot:

Input: "pão de queijo"
Output: [{"name": "pão de queijo", "quantity_description": "1 unidade média (~40g)", "calories": 127, "protein_g": 3.5, "carbs_g": 17.0, "fat_g": 5.1, "confidence": "medium", "resolved_by": "llm_cheap"}]

Input: "vitamina de banana com leite"
Output: [{"name": "vitamina de banana com leite", "quantity_description": "1 copo (~300ml)", "calories": 220, "protein_g": 6.0, "carbs_g": 38.0, "fat_g": 4.0, "confidence": "medium", "resolved_by": "llm_cheap"}]

Input: "cuscuz com ovo"
Output: [{"name": "cuscuz nordestino", "quantity_description": "1 porção (~150g)", "calories": 218, "protein_g": 5.0, "carbs_g": 46.0, "fat_g": 1.5, "confidence": "medium", "resolved_by": "llm_cheap"}, {"name": "ovo cozido", "quantity_description": "1 unidade (~50g)", "calories": 73, "protein_g": 6.3, "carbs_g": 0.6, "fat_g": 4.8, "confidence": "medium", "resolved_by": "llm_cheap"}]

Input: "iogurte com granola"
Output: [{"name": "iogurte natural", "quantity_description": "1 pote (~170g)", "calories": 99, "protein_g": 5.7, "carbs_g": 11.4, "fat_g": 3.0, "confidence": "medium", "resolved_by": "llm_cheap"}, {"name": "granola", "quantity_description": "2 colheres de sopa (~30g)", "calories": 130, "protein_g": 2.8, "carbs_g": 20.0, "fat_g": 4.5, "confidence": "medium", "resolved_by": "llm_cheap"}]

Formato de retorno:
[
  {
    "name": "nome do alimento",
    "quantity_description": "1 colher de servir (~150g)",
    "calories": 207,
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
