"""
pipeline/depth/volume_calculator.py — Cálculo de volume por segmento.

Combina as máscaras do SAM 2 com o mapa de profundidade do Depth Anything V2
para estimar o volume em cm³ de cada alimento no prato.

Método: integração de voxels por segmento.

Input:
  - Máscaras de segmentação (SegmentResult[])
  - Mapa de profundidade (DepthMapResult)
  - Escala de referência (pixels/cm, derivada do objeto de referência)

Output:
  - Volume em cm³ por segmento
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from pipeline.depth.depth_estimator import DepthMapResult
    from pipeline.segmentation.sam2_segmenter import SegmentResult


@dataclass
class VolumeEstimate:
    """Volume estimado para um segmento de alimento."""

    segment_index: int
    volume_cm3: float
    """Volume estimado em centímetros cúbicos."""


def calculate_volumes(
    segments: list["SegmentResult"],
    depth: "DepthMapResult",
    pixels_per_cm: float | None = None,
) -> list[VolumeEstimate]:
    """
    Calcula o volume de cada segmento usando a profundidade.

    Args:
        segments: máscaras do SAM 2.
        depth: mapa de profundidade do Depth Anything V2.
        pixels_per_cm: escala derivada do objeto de referência.
                       Se None, usa estimativa padrão.

    Returns:
        Lista de VolumeEstimate, um por segmento.

    Método:
        Para cada segmento, integra a profundidade relativa dentro
        da máscara binária (somando voxels) e converte para cm³
        usando a escala de referência.

    TODO: implement
    """
    raise NotImplementedError("TODO: implement calculate_volumes")


def estimate_reference_scale(
    reference_description: str | None,
) -> float | None:
    """
    Estima pixels_per_cm a partir do objeto de referência.

    Args:
        reference_description: ex. "moeda de R$1" (diâmetro ~27mm)

    Returns:
        pixels_per_cm estimado, ou None se sem referência.

    TODO: implement — tabela de objetos conhecidos + detecção do mesmo na imagem.
    """
    raise NotImplementedError("TODO: implement estimate_reference_scale")
