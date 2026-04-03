"""
pipeline/nutrition/density_table.py — Tabela de densidades para conversão cm³ → gramas.

Converte o volume estimado (em cm³) de cada alimento em gramas,
usando densidades documentadas na literatura científica.

Fontes:
  - FAO/INFOODS: Guidelines on Food Density
  - Literatura científica (artigos revisados)
  - data/densities.json (JSON próprio)

Input:  nome do alimento + volume em cm³
Output: peso estimado em gramas
"""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class DensityEntry:
    """Entrada da tabela de densidades."""

    food_name: str
    density_g_per_cm3: float
    """Densidade em g/cm³."""
    source: str
    """Referência bibliográfica."""


# Densidade padrão quando o alimento não está na tabela.
DEFAULT_DENSITY_G_PER_CM3 = 0.9  # ~água, conservador


def get_density(food_name: str) -> float:
    """
    Retorna a densidade (g/cm³) de um alimento.

    Args:
        food_name: nome do alimento (em inglês ou pt-BR).

    Returns:
        Densidade em g/cm³. Retorna DEFAULT_DENSITY se não encontrado.

    TODO: implement — carregar densities.json, buscar por nome com fuzzy match.
    """
    raise NotImplementedError("TODO: implement get_density")


def convert_volume_to_grams(food_name: str, volume_cm3: float) -> float:
    """
    Converte volume em cm³ para gramas.

    Args:
        food_name: nome do alimento.
        volume_cm3: volume estimado.

    Returns:
        Peso estimado em gramas.

    TODO: implement — get_density(food_name) * volume_cm3
    """
    raise NotImplementedError("TODO: implement convert_volume_to_grams")
