import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { NormalizedRect } from '../../types';

export type { NormalizedRect };

export interface PixelCrop {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Clamp a normalized rect into [0,1] bounds. */
export function clampNormalizedRect(rect: NormalizedRect): NormalizedRect {
  const x = clamp(rect.x, 0, 1);
  const y = clamp(rect.y, 0, 1);
  const width = clamp(rect.width, 0, 1 - x);
  const height = clamp(rect.height, 0, 1 - y);
  return { x, y, width, height };
}

/** Convert a normalized rect to integer pixel coordinates. */
export function normalizedRectToPixels(
  rect: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
): PixelCrop {
  const r = clampNormalizedRect(rect);
  return {
    originX: Math.round(r.x * imageWidth),
    originY: Math.round(r.y * imageHeight),
    width: Math.round(r.width * imageWidth),
    height: Math.round(r.height * imageHeight),
  };
}

/**
 * Crop an image strictly to the given normalized rect (the scanner reticle).
 * Returns the local uri + dimensions of the cropped result.
 */
export async function cropImageToRect(
  uri: string,
  rect: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
): Promise<{ uri: string; width: number; height: number }> {
  const crop = normalizedRectToPixels(rect, imageWidth, imageHeight);
  if (crop.width < 1 || crop.height < 1) {
    throw new Error('Crop rect is too small; check the reticle bounds.');
  }

  const result = await manipulateAsync(
    uri,
    [{ crop }],
    { compress: 1, format: SaveFormat.PNG },
  );

  return { uri: result.uri, width: result.width, height: result.height };
}
