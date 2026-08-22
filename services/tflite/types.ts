/**
 * TFLite door-detection constants and helpers.
 *
 * The detector loads `assets/models/door_detector.tflite` — a MobileNet-SSD style model
 * with 4 output tensors: boxes `[1, N, 4]`, classes `[1, N]`, scores `[1, N]`,
 * count `[1]`. The exact class index for "door" must be verified against the model's
 * label map (see CHANGELOG manual actions).
 */

/** Minimum confidence to consider a detected `door` valid (per spec). */
export const DOOR_CONFIDENCE_THRESHOLD = 0.8;

/** Index of the `door` class in the model's label map (VERIFY against your model). */
export const DOOR_CLASS_INDEX = 0;

/** Expected input tensor shape (channels-last NHWC). */
export const DOOR_INPUT_WIDTH = 320;
export const DOOR_INPUT_HEIGHT = 320;
export const DOOR_INPUT_CHANNELS = 3;

/** SSD MobileNet output tensor indices. */
export const SSD_OUTPUT = {
  boxes: 0,
  classes: 1,
  scores: 2,
  count: 3,
} as const;
