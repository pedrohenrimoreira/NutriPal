"""
pipeline/detection/yolo_detector.py — Wrapper do YOLOv11 para detecção de alimentos.

Modelo base: yolo11n.pt (Ultralytics)
Fine-tuning : datasets Food-101, UEC Food-256, VIREO Food-172
Biblioteca  : ultralytics (pip install ultralytics)

Objetivo: receber uma imagem (e opcionalmente máscaras do SAM 2)
e classificar cada região como um tipo de alimento.

Input:  PIL Image + lista de SegmentResult (opcional)
Output: lista de DetectionResult (label + bbox + confiança)
"""

from __future__ import annotations

from dataclasses import dataclass
from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from PIL import Image as PILImage

    from pipeline.segmentation.sam2_segmenter import SegmentResult


@dataclass
class DetectionResult:
    """Um alimento detectado pelo YOLO."""

    label: str
    """Label do alimento (em inglês, ex.: 'rice', 'grilled_chicken')."""

    display_name: str
    """Nome legível em pt-BR quando disponível."""

    confidence: float
    """Confiança da detecção (0-1)."""

    segment_index: int
    """Índice do segmento SAM correspondente (-1 se não associado)."""

    bbox: tuple[float, float, float, float]
    """Bounding box normalizada (x, y, w, h)."""


class YOLODetector:
    """
    Wrapper para YOLOv11 fine-tuned em alimentos.

    Uso:
        detector = YOLODetector(weights_path="data/weights/yolo11_food.pt")
        detector.load_model()
        results = detector.detect(image, segments)
    """

    def __init__(self, weights_path: str = "data/weights/yolo11_food.pt") -> None:
        self.weights_path = weights_path
        self._model = None  # TODO: ultralytics.YOLO

    def load_model(self) -> None:
        """
        Carrega o YOLOv11 em memória.

        TODO: implement — ultralytics.YOLO(self.weights_path)
        """
        raise NotImplementedError("TODO: implement load_model")

    def detect(
        self,
        image: "PILImage.Image",
        segments: list["SegmentResult"] | None = None,
    ) -> list[DetectionResult]:
        """
        Detecta e classifica alimentos na imagem.

        Args:
            image: imagem PIL.
            segments: máscaras do SAM 2 para refinar detecções.

        Returns:
            Lista de DetectionResult.

        TODO: implement — rodar YOLO, mapear classes para nomes pt-BR,
              associar com segmentos SAM por IoU.
        """
        raise NotImplementedError("TODO: implement detect")
