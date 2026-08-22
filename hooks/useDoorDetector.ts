import { useEffect, useState } from 'react';
import { detectDoor } from '../services/tflite/doorDetector';
import type { DoorFrameSource } from '../services/tflite/frameSource';
import type { DoorDetection } from '../types';

interface UseDoorDetectorResult {
  detection: DoorDetection | null;
  error: string | null;
}

/**
 * Continuous lightweight door-detection loop. Runs until a `door` detection with
 * confidence >= 0.80 is found, then stops (per blueprint §7.2).
 */
export function useDoorDetector(
  enabled: boolean,
  getFrame: DoorFrameSource,
  intervalMs = 450,
): UseDoorDetectorResult {
  const [detection, setDetection] = useState<DoorDetection | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const tick = async () => {
      if (cancelled) return;
      try {
        const frame = await getFrame();
        if (frame) {
          const result = await detectDoor(frame);
          if (result) {
            setDetection(result);
            return; // stop the loop on first high-confidence detection
          }
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
        }
        return;
      }
      timer = setTimeout(tick, intervalMs);
    };

    void tick();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [enabled, getFrame, intervalMs]);

  return { detection, error };
}
