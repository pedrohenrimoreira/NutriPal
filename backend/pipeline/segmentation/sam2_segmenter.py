"""
pipeline/segmentation/sam2_segmenter.py — Wrapper do SAM 2 (Segment Anything Model 2).

Modelo: facebook/sam2-hiera-large (Meta)
Peso : sam2_hiera_large.pt
Repo : https://github.com/facebookresearch/segment-anything-2

Objetivo: receber uma imagem de prato e segmentar cada alimento
em uma máscara binária individual.

Input:  PIL Image (RGB)
Output: lista de SegmentResult (máscara + bbox + confiança)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np
    from PIL import Image as PILImage


@dataclass
class SegmentResult:
    """Resultado de segmentação para um alimento."""

    segment_index: int
    """Índice do segmento."""

    mask: "np.ndarray"
    """Máscara binária (H x W) do segmento. dtype=bool."""

    bbox: tuple[float, float, float, float]
    """Bounding box normalizada (x, y, w, h), valores entre 0 e 1."""

    area_pixels: int
    """Área em pixels do segmento."""

    confidence: float
    """Score de confiança do segmento (0-1)."""


class SAM2Segmenter:
    """
    Wrapper para o Segment Anything Model 2.

    Uso:
        segmenter = SAM2Segmenter(weights_path="data/weights/sam2_hiera_large.pt")
        segmenter.load_model()
        results = segmenter.segment(image)
    """

    def __init__(self, weights_path: str = "data/weights/sam2_hiera_large.pt") -> None:
        """
        Args:
            weights_path: caminho para o checkpoint do SAM 2.
        """
        self.weights_path = weights_path
        self._model = None  # TODO: tipo real do modelo SAM 2

    def load_model(self) -> None:
        """
        Carrega o modelo SAM 2 em memória (GPU se disponível).

        TODO: implement — usar sam2 API para carregar checkpoint.
        """
        raise NotImplementedError("TODO: implement load_model")

    def segment(self, image: "PILImage.Image") -> list[SegmentResult]:
        """
        Segmenta uma imagem de prato em regiões de alimento.

        Args:
            image: imagem PIL em RGB.

        Returns:
            Lista de SegmentResult, uma por alimento detectado.

        TODO: implement — gerar prompts automáticos, executar SAM 2,
              filtrar máscaras por área mínima.
        """
        raise NotImplementedError("TODO: implement segment")
