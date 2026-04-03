"""
pipeline/depth/depth_estimator.py — Wrapper do Depth Anything V2.

Modelo: depth_anything_v2_vitl.pth
Repo  : https://huggingface.co/depth-anything/Depth-Anything-V2-Large
Lib   : HuggingFace transformers ou pip install depth-anything-v2

Objetivo: gerar um mapa de profundidade monocular para estimar
a geometria 3D da cena (prato visto de cima).

Input:  PIL Image (RGB)
Output: DepthMapResult (array de profundidade + metadados)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    import numpy as np
    from PIL import Image as PILImage


@dataclass
class DepthMapResult:
    """Mapa de profundidade da cena."""

    depth_map: "np.ndarray"
    """Array (H x W) com profundidade relativa (float32, 0-1)."""

    width: int
    height: int
    min_depth: float
    max_depth: float


class DepthEstimator:
    """
    Wrapper para Depth Anything V2.

    Uso:
        estimator = DepthEstimator(weights_path="data/weights/depth_anything_v2_vitl.pth")
        estimator.load_model()
        depth = estimator.estimate(image)
    """

    def __init__(self, weights_path: str = "data/weights/depth_anything_v2_vitl.pth") -> None:
        self.weights_path = weights_path
        self._model = None

    def load_model(self) -> None:
        """
        Carrega o Depth Anything V2 em memória.

        TODO: implement
        """
        raise NotImplementedError("TODO: implement load_model")

    def estimate(self, image: "PILImage.Image") -> DepthMapResult:
        """
        Gera mapa de profundidade monocular para a imagem.

        Args:
            image: imagem PIL em RGB.

        Returns:
            DepthMapResult com array e metadados.

        TODO: implement — pré-processar imagem, inference, normalizar output.
        """
        raise NotImplementedError("TODO: implement estimate")
