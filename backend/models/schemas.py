"""
Pydantic request/response contracts for NutriLens API.
"""

from typing import Optional

from pydantic import BaseModel, Field

from .enums import Complexity, Confidence, ResolvedBy


class TextParseRequest(BaseModel):
    """POST /parse/text payload."""

    text: str = Field(..., description="Free-text meal description from the user.")
    language: str = Field(default="pt-BR", description="Input language tag.")


class ImageParseRequest(BaseModel):
    """POST /parse/image payload."""

    image_base64: str = Field(..., description="Base64 encoded image bytes.")
    mime_type: str = Field(..., description="Image mime type, for example image/jpeg.")
    has_reference_object: bool = Field(
        default=False,
        description="Whether a scale reference object exists in the photo.",
    )
    reference_object_description: Optional[str] = Field(
        default=None,
        description="Reference object description, for example 'moeda de R$1'.",
    )


class NutritionTotalsResponse(BaseModel):
    """Aggregated macro totals."""

    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float


class NutritionItemResponse(BaseModel):
    """One parsed food item."""

    name: str
    quantity_description: str
    calories: float
    protein_g: float
    carbs_g: float
    fat_g: float
    confidence: Confidence
    resolved_by: ResolvedBy
    volume_cm3: Optional[float] = None


class ParseResponse(BaseModel):
    """Standard response returned by /parse/text and /parse/image."""

    items: list[NutritionItemResponse]
    totals: NutritionTotalsResponse
    uncertainty_notes: Optional[str] = None
    pipeline_stages_used: list[str] = Field(default_factory=list)
    estimated_error_pct: Optional[float] = None
