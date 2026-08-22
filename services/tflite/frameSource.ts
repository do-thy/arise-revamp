/**
 * Camera frame source for the TFLite door-detection loop.
 *
 * Captures a low-res frame from the 2D camera, resizes it to the detector input size,
 * and converts it to the RGB888 byte buffer the model expects.
 */
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import type { CameraView } from 'expo-camera';
import { DOOR_INPUT_HEIGHT, DOOR_INPUT_WIDTH } from './types';

export type DoorFrameSource = () => Promise<Uint8Array | null>;

/**
 * @integration `decodeFrameToRgb` must decode the resized JPEG into a tightly-packed
 * RGB888 buffer (width * height * 3 bytes). The recommended production path is to use a
 * VisionCamera frame processor (react-native-vision-camera) which yields raw frames
 * directly; alternatively, integrate a lightweight JPEG/PNG decoder here.
 */
function decodeFrameToRgb(_base64: string): Uint8Array {
  throw new Error(
    '[door detection] decodeFrameToRgb is a model-specific integration point: decode the resized JPEG into RGB888 bytes (see services/tflite/frameSource.ts).',
  );
}

/** Build a `DoorFrameSource` bound to a live `CameraView` ref. */
export function createCameraFrameSource(
  cameraRef: React.RefObject<CameraView | null>,
): DoorFrameSource {
  return async () => {
    const photo = await cameraRef.current?.takePictureAsync({
      quality: 0.3,
      skipProcessing: true,
    });
    if (!photo) return null;

    const resized = await manipulateAsync(
      photo.uri,
      [{ resize: { width: DOOR_INPUT_WIDTH, height: DOOR_INPUT_HEIGHT } }],
      { compress: 0.5, format: SaveFormat.JPEG, base64: true },
    );

    if (!resized.base64) return null;
    return decodeFrameToRgb(resized.base64);
  };
}
