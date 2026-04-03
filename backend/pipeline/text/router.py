"""
pipeline/text/router.py — Router de complexidade textual.

Analisa o texto do usuário e decide qual modelo de LLM usar:

- SIMPLE  → haiku_parser (Camada 1: Haiku / Gemini Flash)
- MODERATE → haiku_parser (ainda barato o suficiente)
- COMPLEX → sonnet_parser (Camada 2: Sonnet / Gemini Pro)

Critérios de classificação:
- SIMPLE: listagem direta de alimentos comuns
- MODERATE: pratos com nomes conhecidos (strogonoff, feijoada)
- COMPLEX: pratos regionais elaborados, receitas, preparações compostas
"""

from __future__ import annotations

from models.enums import Complexity
from models.schemas import NutritionItemResponse


def classify_complexity(text: str, unresolved_items: list[str]) -> Complexity:
    """
    Classifica a complexidade do texto / itens não resolvidos.

    Args:
        text: texto original do usuário.
        unresolved_items: nomes de alimentos que o dataset local não resolveu.

    Returns:
        Complexity enum.

    Heurísticas (TODO: implement):
        - SIMPLE: todos os itens são substantivos simples (arroz, feijão, frango)
        - MODERATE: contém nomes de pratos conhecidos (strogonoff, carbonara)
        - COMPLEX: contém preparações regionais, receitas, composições
    """
    raise NotImplementedError("TODO: implement classify_complexity")


async def route_text(
    text: str,
    unresolved_items: list[str],
) -> list[NutritionItemResponse]:
    """
    Encaminha itens não resolvidos para o LLM apropriado.

    Args:
        text: texto original completo.
        unresolved_items: itens que o dataset não resolveu.

    Returns:
        Lista de NutritionItemResponse dos itens resolvidos por LLM.

    TODO: implement — classificar → chamar haiku ou sonnet.
    """
    raise NotImplementedError("TODO: implement route_text")
