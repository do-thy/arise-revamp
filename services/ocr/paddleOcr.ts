/**
 * PaddleOCR inference service (onnxruntime-react-native).
 *
 * This module owns the ONNX sessions and the high-level pipeline
 * (detect -> [angle classify] -> sort -> recognize). The raw tensor conversion and the
 * model-specific decode steps are isolated behind clearly-marked integration functions
 * because they depend on the *exact* exported PaddleOCR ONNX graph and character
 * dictionary. See `.kilo/rules/blueprint.md` §8.2 and the CHANGELOG manual actions.
 */
import * as ort from 'onnxruntime-react-native';
import { Asset } from 'expo-asset';
import { cropImageToRect, type NormalizedRect } from './crop';
import { sortByReadingOrder } from './verticalSorter';
import {
  DEFAULT_PADDLE_CONFIG,
  type OcrResult,
  type OcrTextBox,
  type PaddleOcrConfig,
} from './types';

export interface PaddleOcrModels {
  /** Detection (DBNet) model: bundled asset id or `file://`/`https://` URI. */
  det: string | number;
  /** Recognition (CRNN) model. */
  rec: string | number;
  /** Angle classification model (required when `useAngleCls` is true). */
  cls?: string | number;
}

interface PaddleSessions {
  det: ort.InferenceSession;
  rec: ort.InferenceSession;
  cls: ort.InferenceSession | null;
}

let sessions: PaddleSessions | null = null;
let runtimeConfig: PaddleOcrConfig = DEFAULT_PADDLE_CONFIG;

/** Resolve a bundled asset id or URI to a loadable model URI. */
async function resolveModelSource(source: string | number): Promise<string> {
  if (typeof source === 'number') {
    const asset = Asset.fromModule(source);
    await asset.downloadAsync();
    const uri = asset.localUri ?? asset.uri;
    if (!uri) throw new Error('Unable to resolve a bundled OCR model URI.');
    return uri;
  }
  return source;
}

export function isPaddleOcrInitialized(): boolean {
  return sessions !== null;
}

export function getPaddleOcrConfig(): PaddleOcrConfig {
  return runtimeConfig;
}

/** Load the three PaddleOCR ONNX sessions. */
export async function initializePaddleOcr(
  models: PaddleOcrModels,
  config: Partial<PaddleOcrConfig> = {},
): Promise<void> {
  runtimeConfig = { ...DEFAULT_PADDLE_CONFIG, ...config };

  if (runtimeConfig.useAngleCls && !models.cls) {
    throw new Error('useAngleCls is enabled but no angle classifier model was provided.');
  }

  const [detUri, recUri, clsUri] = await Promise.all([
    resolveModelSource(models.det),
    resolveModelSource(models.rec),
    models.cls ? resolveModelSource(models.cls) : Promise.resolve<string | null>(null),
  ]);

  const [det, rec, cls] = await Promise.all([
    ort.InferenceSession.create(detUri),
    ort.InferenceSession.create(recUri),
    clsUri ? ort.InferenceSession.create(clsUri) : Promise.resolve(null),
  ]);

  sessions = { det, rec, cls };
}

/**
 * Convert an image (uri) to the detection model's CHW float tensor.
 * @integration Implement per your exported DBNet model: resize to the model's input
 *             size, normalize pixels, and lay out as [1, 3, H, W] float32.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function imageToDetectionTensor(uri: string): Promise<ort.Tensor> {
  throw new Error(
    '[PaddleOCR] imageToDetectionTensor is a model-specific integration point: resize the image to the DBNet input size and produce a normalized [1,3,H,W] float32 tensor.',
  );
}

/**
 * Decode the DBNet output probability map into text boxes.
 * @integration Implement per your exported model: threshold the probability map, apply
 *             `det_db_unclip_ratio` (from config) to unclip contours, return boxes.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function decodeDetectionOutput(_output: unknown): Promise<OcrTextBox[]> {
  throw new Error(
    '[PaddleOCR] decodeDetectionOutput is a model-specific integration point: decode the DBNet probability map into normalized text boxes (see config.detDbUnclipRatio).',
  );
}

/** Run angle classification for a cropped box (integration: decode argmax). */
async function classifyAngle(uri: string, box: OcrTextBox): Promise<number> {
  if (!sessions?.cls || !runtimeConfig.useAngleCls) return 0;
  const tensor = await imageToDetectionTensor(uri);
  const outputs = await sessions.cls.run({ input: tensor });
  // @integration decode the angle class from `outputs` (e.g. argmax of logits).
  void outputs;
  void box;
  return 0;
}

/** Run recognition on a single cropped text box. */
async function recognizeBox(uri: string, box: OcrTextBox): Promise<OcrResult> {
  if (!sessions) throw new Error('PaddleOCR is not initialized.');
  // @integration Crop `uri` to `box.bbox`, build the CRNN input tensor, run
  //             sessions.rec, and CTC-decode the logits into text.
  const outputs = await sessions.rec.run({});
  void uri;
  void box;
  void outputs;
  return { text: '', confidence: 0 };
}

/**
 * High-level entry point: recognize all text in an image.
 *
 * Orchestrates the full pipeline and applies the vertical sorter. The per-model
 * tensor/decode integration points (documented above) must be completed for the exact
 * exported PaddleOCR model before text is returned.
 */
export async function recognize(imageUri: string): Promise<OcrResult[]> {
  if (!sessions) {
    throw new Error('PaddleOCR is not initialized. Call initializePaddleOcr() first.');
  }

  const detTensor = await imageToDetectionTensor(imageUri);
  const detOutputs = await sessions.det.run({ input: detTensor });
  const boxes = await decodeDetectionOutput(detOutputs);

  const ordered = sortByReadingOrder(boxes);
  const results: OcrResult[] = [];
  for (const box of ordered) {
    if (runtimeConfig.useAngleCls) {
      await classifyAngle(imageUri, box);
    }
    results.push(await recognizeBox(imageUri, box));
  }
  return results;
}

/** Convenience: crop a captured placard to the reticle before OCR. */
export async function preparePlacard(
  uri: string,
  reticle: NormalizedRect,
  imageWidth: number,
  imageHeight: number,
): Promise<string> {
  const cropped = await cropImageToRect(uri, reticle, imageWidth, imageHeight);
  return cropped.uri;
}

