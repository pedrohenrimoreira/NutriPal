/**
 * Contracts for vision pipeline metadata.
 */

export interface Segment {
  segmentIndex: number;
  bbox: [number, number, number, number];
  areaPixels: number;
  confidence: number;
}

export interface DepthMap {
  width: number;
  height: number;
  minDepth: number;
  maxDepth: number;
}

export interface DetectedItem {
  label: string;
  displayName: string;
  confidence: number;
  segmentIndex: number;
  bbox: [number, number, number, number];
}

export interface VolumeEstimate {
  segmentIndex: number;
  volumeCm3: number;
  densityGPerCm3: number;
  estimatedGrams: number;
}

export interface VisionResult {
  segments: Segment[];
  detections: DetectedItem[];
  depthMap: DepthMap | null;
  volumes: VolumeEstimate[];
  pipelineStagesUsed: string[];
  uncertaintyNotes: string | null;
}
