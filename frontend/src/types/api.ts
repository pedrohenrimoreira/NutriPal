/**
 * API transport contracts (FastAPI <-> frontend service layer).
 */

import type { ConfidenceLevel } from './food';

export type ApiResolvedBy = 'dataset' | 'llm_cheap' | 'llm_medium' | 'vision_pipeline';

export interface TextParseRequest {
  text: string;
  language?: string;
}

export interface ImageParseRequest {
  image_base64: string;
  mime_type: string;
  has_reference_object: boolean;
  reference_object_description?: string;
}

export interface NutritionItemResponse {
  name: string;
  quantity_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  confidence: ConfidenceLevel;
  resolved_by: ApiResolvedBy;
  volume_cm3: number | null;
}

export interface NutritionTotalsResponse {
  calories: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface ParseResponse {
  items: NutritionItemResponse[];
  totals: NutritionTotalsResponse;
  uncertainty_notes: string | null;
  pipeline_stages_used: string[];
  estimated_error_pct: number | null;
}

export interface HealthResponse {
  status: 'ok' | 'degraded';
  version: string;
  models_loaded: string[];
}
