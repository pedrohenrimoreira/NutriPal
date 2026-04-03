"""
Shared enums for NutriLens backend contracts.
"""

from enum import Enum


class Complexity(str, Enum):
    SIMPLE = "simple"
    MODERATE = "moderate"
    COMPLEX = "complex"


class ResolvedBy(str, Enum):
    DATASET = "dataset"
    LLM_CHEAP = "llm_cheap"
    LLM_MEDIUM = "llm_medium"
    VISION_PIPELINE = "vision_pipeline"


class Confidence(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"
