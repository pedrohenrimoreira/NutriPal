"""
pipeline/nutrition/dataset_lookup.py — Busca nutricional nos datasets TACO e USDA.

Camada 0 da arquitetura: zero custo, 100% local.

Fontes:
  - TACO (UNICAMP): 597 alimentos brasileiros (data/taco.json)
  - USDA FoodData Central: alimentos internacionais (data/usda.db, SQLite)

Busca fuzzy via rapidfuzz para lidar com variações de nome.

Biblioteca: rapidfuzz (https://github.com/maxbachmann/RapidFuzz)
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class NutritionData:
    """Dados nutricionais de um alimento por 100g."""

    name: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    source: str  # 'taco' ou 'usda'
    match_score: float  # 0-100, score do fuzzy match


def lookup_by_name(name: str, threshold: float = 70.0) -> NutritionData | None:
    """
    Busca um alimento por nome no dataset local (TACO + USDA).

    Args:
        name: nome do alimento (ex.: "arroz integral cozido").
        threshold: score mínimo de fuzzy match (0-100).

    Returns:
        NutritionData se encontrado com score ≥ threshold, None caso contrário.

    TODO: implement — carregar TACO JSON + USDA SQLite,
          buscar com rapidfuzz.process.extractOne()
    """
    raise NotImplementedError("TODO: implement lookup_by_name")


def lookup_batch(names: list[str], threshold: float = 70.0) -> dict[str, NutritionData | None]:
    """
    Busca vários alimentos de uma vez.

    Args:
        names: lista de nomes.
        threshold: score mínimo.

    Returns:
        Dict mapeando cada nome para NutritionData ou None.

    TODO: implement
    """
    raise NotImplementedError("TODO: implement lookup_batch")
