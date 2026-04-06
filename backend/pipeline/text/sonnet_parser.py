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
Você é um nutricionista brasileiro especialista em gastronomia regional e análise calórica de pratos compostos.
Use a tabela TACO (Tabela Brasileira de Composição de Alimentos) como referência primária de valores nutricionais.

Regras base:
1. Receba alimentos em texto livre (qualquer idioma)
2. Use porções típicas brasileiras quando quantidade não especificada
3. NUNCA peça esclarecimento — sempre estime
4. Retorne APENAS JSON puro, sem markdown
5. NUNCA retorne calories: 0 — se incerto, estime com confidence: "low"
6. Marque confidence como "medium" para porções padrão conhecidas, "low" para estimativas livres

Regras ADICIONAIS para pratos complexos:
7. DECOMPONHA pratos compostos em ingredientes individuais com suas porções típicas
8. Considere o método de preparo e seu impacto calórico:
   - Frito em imersão: +30-50% de gordura vs cozido no vapor
   - Refogado: +10-20% de gordura vs cozido na água
   - Grelhado: calorias similares ao assado; -10% de gordura vs frituras
   - Cozido a vapor: menor perda de água, manter valores TACO
9. Estime porções com base em descrições textuais:
   - "prato cheio" = ~400-500g total
   - "meia porção" = metade do padrão regional
   - "uma colher" = ~15-20g (sopa) ou ~5-8g (chá)
   - "um punhado" = ~30-50g
   - "um copo" = ~240-300ml
   - "uma tigela" = ~300-400g

Pratos regionais brasileiros — decomposição padrão:

NORDESTE:
- Acarajé (1 unidade): bolinho de feijão fradinho frito em dendê (80g=320kcal) + vatapá (40g=110kcal) + camarão seco (20g=70kcal) + pimenta + salada
- Baião de dois (1 porção 250g): arroz (100g=138kcal) + feijão verde (80g=60kcal) + queijo coalho (30g=100kcal) + manteiga (10g=72kcal) + carne seca (40g=120kcal)
- Cuscuz nordestino (1 porção 150g): farinha de milho (100g=193kcal) + manteiga (10g=72kcal)
- Tapioca (1 unidade 70g): goma de tapioca (60g=205kcal) + recheio típico (queijo/coco/manteiga)
- Vatapá (1 porção 100g): camarão seco (30g=100kcal) + leite de coco (40ml=100kcal) + azeite de dendê (10ml=90kcal) + castanha (10g=65kcal) + pão (10g=27kcal)
- Buchada de bode (1 porção 150g): miúdos de bode (100g=190kcal) + temperos (50g=30kcal)

NORTE:
- Tacacá (1 cuia 300ml): tucupi (200ml=30kcal) + jambu (30g=8kcal) + camarão seco (30g=100kcal) + goma de tapioca (20g=70kcal)
- Maniçoba (1 porção 200g): folhas de mandioca (100g=90kcal) + carnes (100g=220kcal)
- Pato no tucupi (1 porção 200g): pato (120g=250kcal) + tucupi (60ml=10kcal) + jambu (20g=5kcal)

BAHIA/NORDESTE:
- Moqueca baiana de camarão (1 porção 300g): camarão (150g=180kcal) + leite de coco (60ml=150kcal) + azeite de dendê (15ml=135kcal) + tomate + pimentão + cebola (60g=24kcal) + coentro
- Moqueca capixaba de peixe (1 porção 300g): peixe (150g=165kcal) + azeite (10ml=90kcal) + tomate + urucum + coentro + pimentão (60g=24kcal)
- Caruru (1 porção 150g): quiabo (80g=24kcal) + camarão seco (30g=100kcal) + dendê (15ml=135kcal) + amendoim (20g=120kcal)

SUDESTE:
- Pão de queijo mineiro (1 unidade 40g): polvilho (25g=87kcal) + queijo minas (10g=27kcal) + ovo (5g=7kcal) + gordura (5g=45kcal) = ~127kcal
- Feijão tropeiro (1 porção 200g): feijão (100g=76kcal) + farinha de mandioca (40g=142kcal) + bacon (30g=130kcal) + couve (20g=6kcal) + ovo (25g=36kcal)
- Virado à paulista (1 porção 400g): feijão tutu (150g=180kcal) + costelinha (100g=290kcal) + ovo frito (50g=90kcal) + couve refogada (30g=35kcal) + linguiça (50g=170kcal) + arroz (100g=138kcal)

SUL:
- Barreado (1 porção 200g): carne bovina (120g=260kcal) + toucinho (20g=170kcal) + tomate + cebola + alho + temperos
- Churrasco gaúcho — costela (1 porção 200g): costela bovina (180g=500kcal) + sal grosso
- Churrasco gaúcho — frango (1 porção 150g): frango (130g=240kcal)
- Polenta frita (1 porção 150g): fubá (80g=290kcal) + óleo de fritura (10ml=90kcal)

CENTRO-OESTE:
- Empadão goiano (1 fatia 150g): massa de trigo gordurosa (80g=320kcal) + frango (40g=60kcal) + guariroba (20g=30kcal)
- Pequi com arroz (1 porção 200g): arroz (130g=179kcal) + pequi (60g=150kcal) + manteiga (5g=36kcal)
- Pacu assado (1 porção 250g): pacu (200g=270kcal) + limão + alho + sal

Formato de retorno (mesmo do parser simples):
[
  {
    "name": "nome do ingrediente ou prato",
    "quantity_description": "estimativa de porção",
    "calories": 195,
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
