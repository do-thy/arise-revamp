/**
 * Door object-detection runner (react-native-fast-tflite v3).
 *
 * Loads `assets/models/door_detector.tflite` and decodes a MobileNet-SSD style output
 * (boxes/classes/scores/count) into a normalized `DoorDetection`.
 */
import { loadTensorflowModel, type TfliteModel } from 'react-native-fast-tflite';
import type { DoorDetection, Point2D } from '../../types';
import {
  DOOR_CLASS_INDEX,
  DOOR_CONFIDENCE_THRESHOLD,
  SSD_OUTPUT,
} from './types';
import doorModelAsset from '../../assets/models/door_detector.tflite';

let modelPromise: Promise<TfliteModel> | null = null;

/** Load (and cache) the door detector model. */
export function loadDoorDetector(): Promise<TfliteModel> {
  if (!modelPromise) {
    modelPromise = loadTensorflowModel(doorModelAsset, []);
  }
  return modelPromise;
}

export interface SsdDetection {
  bbox: { ymin: number; xmin: number; ymax: number; xmax: number };
  classId: number;
  score: number;
}

/**
 * Decode the four SSD output tensors into a list of raw detections.
 * @param outputs raw `ArrayBuffer[]` returned by `model.run()`.
 */
export function decodeSsdOutputs(outputs: ArrayBuffer[]): SsdDetection[] {
  const boxes = new Float32Array(outputs[SSD_OUTPUT.boxes]);
  const classes = new Float32Array(outputs[SSD_OUTPUT.classes]);
  const scores = new Float32Array(outputs[SSD_OUTPUT.scores]);
  const count =
    outputs[SSD_OUTPUT.count]?.byteLength > 0
      ? new Float32Array(outputs[SSD_OUTPUT.count])[0]
      : scores.length;

  const numDetections = Math.min(count, scores.length);
  const detections: SsdDetection[] = [];

  for (let i = 0; i < numDetections; i++) {
    detections.push({
      bbox: {
        ymin: boxes[i * 4 + 0],
        xmin: boxes[i * 4 + 1],
        ymax: boxes[i * 4 + 2],
        xmax: boxes[i * 4 + 3],
      },
      classId: classes[i],
      score: scores[i],
    });
  }
  return detections;
}

function normalizeCenter(bbox: SsdDetection['bbox']): Point2D {
  return {
    x: (bbox.xmin + bbox.xmax) / 2,
    y: (bbox.ymin + bbox.ymax) / 2,
  };
}

/**
 * Find the highest-confidence `door` detection at or above the threshold.
 * @param rgb input RGB888 buffer (width*height*3) matching the model input size.
 */
export async function detectDoor(rgb: Uint8Array): Promise<DoorDetection | null> {
  const model = await loadDoorDetector();
  const buffer: ArrayBuffer = rgb.buffer.slice(
    rgb.byteOffset,
    rgb.byteOffset + rgb.byteLength,
  ) as ArrayBuffer;

  const outputs = await model.run([buffer]);
  const detections = decodeSsdOutputs(outputs);

  let best: SsdDetection | null = null;
  for (const detection of detections) {
    if (detection.classId !== DOOR_CLASS_INDEX) continue;
    if (detection.score < DOOR_CONFIDENCE_THRESHOLD) continue;
    if (!best || detection.score > best.score) best = detection;
  }

  if (!best) return null;

  return {
    bbox: {
      x: best.bbox.xmin,
      y: best.bbox.ymin,
      width: Math.max(0, best.bbox.xmax - best.bbox.xmin),
      height: Math.max(0, best.bbox.ymax - best.bbox.ymin),
    },
    center: normalizeCenter(best.bbox),
    confidence: best.score,
    label: 'door',
  };
}
