/**
 * OCR pipeline types.
 */

/** A single detected text block with normalized (0..1) bounding box. */
export interface OcrTextBox {
  text: string;
  confidence: number;
  bbox: { x: number; y: number; width: number; height: number };
}

export interface OcrResult {
  text: string;
  confidence: number;
}

/** PaddleOCR runtime configuration (see blueprint §8.2). */
export interface PaddleOcrConfig {
  /** Enable angle classification to resolve 90°/270° text orientation. */
  useAngleCls: boolean;
  /** DBNet unclip ratio (2.0 for elongated vertical text blocks). */
  detDbUnclipRatio: number;
  detDbThresh?: number;
  detDbBoxThresh?: number;
  /** Comma-separated character dictionary for the recognition model. */
  recCharDict?: string;
}

export const DEFAULT_PADDLE_CONFIG: PaddleOcrConfig = {
  useAngleCls: true,
  detDbUnclipRatio: 2.0,
  detDbThresh: 0.3,
  detDbBoxThresh: 0.6,
};
