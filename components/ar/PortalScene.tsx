/**
 * Stabilized "Point-and-Tap" AR window-portal placement (blueprint §7.2 / §9).
 *
 * Placement is gated on `TRACKING_NORMAL`, raycasts the viewport center (0.5, 0.5)
 * against vertical planes (blank walls), falls back to a 2.0 m forward projection, and
 * locks the anchor upright by forcing pitch/roll to 0 and computing only the yaw toward
 * the camera.
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import {
  ViroARScene,
  ViroARSceneNavigator,
  Viro360Image,
  Viro3DObject,
  ViroMaterials,
  ViroPortal,
  ViroPortalScene,
  ViroTrackingStateConstants,
  type ViroARHitTestResult,
  type ViroCameraTransform,
  type ViroTrackingReason,
  type ViroTrackingState,
} from '@reactvision/react-viro';
import type { Room, Vec3 } from '../../types';
import windowFrameAsset from '../../assets/models/window_frame.obj';

// Programmatic solid-white material for the window frame — no `.mtl` / image textures
// required, keeping the bundle small and avoiding texture-loading crashes.
ViroMaterials.createMaterials({
  whiteWindowFrame: {
    diffuseColor: '#FFFFFF',
    lightingModel: 'Lambert',
  },
});

const PLACEMENT_DISTANCE_METERS = 2.0;
const PLACEMENT_HEIGHT_DROP_METERS = 0.3;
const MIN_PLANE_DISTANCE_METERS = 1.5;
const MAX_PLANE_DISTANCE_METERS = 3.5;

export interface PortalPlacement {
  position: Vec3;
  /** [0, yawDegrees, 0] — pitch/roll locked to 0 for an upright anchor. */
  rotation: Vec3;
}

export interface PortalSceneHandle {
  placePortal: () => void;
}

interface PortalSceneProps {
  room: Room;
  onPlaced: () => void;
  onPlacementError?: (message: string) => void;
}

function distance(a: Vec3, b: Vec3): number {
  return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
}

/** Yaw only: `atan2(Δx, Δz)` in degrees. */
function yawDegrees(camera: Vec3, target: Vec3): number {
  const dx = camera[0] - target[0];
  const dz = camera[2] - target[2];
  return (Math.atan2(dx, dz) * 180) / Math.PI;
}

function isVerticalPlane(hit: ViroARHitTestResult): boolean {
  return hit.type === 'ExistingPlane' || hit.type === 'ExistingPlaneUsingExtent';
}

interface CameraPose {
  position: Vec3;
  forward: Vec3;
}

interface PortalARSceneProps extends PortalSceneProps {
  apiRef: MutableRefObject<PortalSceneHandle | null>;
}

function PortalARScene({ room, onPlaced, onPlacementError, apiRef }: PortalARSceneProps) {
  const sceneRef = useRef<ViroARScene>(null);
  const cameraPose = useRef<CameraPose | null>(null);
  const trackingNormal = useRef(false);
  const [placement, setPlacement] = useState<PortalPlacement | null>(null);

  const onCameraTransformUpdate = useCallback((transform: ViroCameraTransform) => {
    cameraPose.current = {
      position: [transform.position[0], transform.position[1], transform.position[2]],
      forward: [transform.forward[0], transform.forward[1], transform.forward[2]],
    };
  }, []);

  const onTrackingUpdated = useCallback(
    (state: ViroTrackingState, _reason: ViroTrackingReason) => {
      trackingNormal.current = state === ViroTrackingStateConstants.TRACKING_NORMAL;
    },
    [],
  );

  const readCameraPose = useCallback(async (): Promise<CameraPose | null> => {
    if (cameraPose.current) return cameraPose.current;
    const scene = sceneRef.current;
    if (!scene) return null;
    try {
      const orientation = await scene.getCameraOrientationAsync();
      if (orientation?.position && orientation?.forward) {
        return {
          position: [
            orientation.position[0],
            orientation.position[1],
            orientation.position[2],
          ] as Vec3,
          forward: [
            orientation.forward[0],
            orientation.forward[1],
            orientation.forward[2],
          ] as Vec3,
        };
      }
    } catch {
      // fall through to null
    }
    return null;
  }, []);

  const computeForwardFallback = useCallback((pose: CameraPose): PortalPlacement => {
    const [cx, cy, cz] = pose.position;
    const [fx, , fz] = pose.forward;
    const position: Vec3 = [
      cx + fx * PLACEMENT_DISTANCE_METERS,
      cy - PLACEMENT_HEIGHT_DROP_METERS,
      cz + fz * PLACEMENT_DISTANCE_METERS,
    ];
    return { position, rotation: [0, yawDegrees(pose.position, position), 0] };
  }, []);

  const placePortal = useCallback(async () => {
    if (!trackingNormal.current) {
      onPlacementError?.(
        'AR is still initialising. Keep the camera still and aim at a blank wall.',
      );
      return;
    }
    const scene = sceneRef.current;
    if (!scene) return;

    const pose = await readCameraPose();

    try {
      const results = (await scene.performARHitTestWithPoint(
        0.5,
        0.5,
      )) as ViroARHitTestResult[];

      const planeHit = results.find((hit) => {
        if (!isVerticalPlane(hit)) return false;
        if (!pose) return false;
        const d = distance(pose.position, hit.transform.position);
        return d >= MIN_PLANE_DISTANCE_METERS && d <= MAX_PLANE_DISTANCE_METERS;
      });

      let next: PortalPlacement;
      if (planeHit) {
        const position = planeHit.transform.position;
        next = {
          position,
          rotation: [0, pose ? yawDegrees(pose.position, position) : 0, 0],
        };
      } else {
        if (!pose) {
          onPlacementError?.(
            'Unable to read the camera pose. Aim at a blank wall and try again.',
          );
          return;
        }
        next = computeForwardFallback(pose);
      }

      setPlacement(next);
      onPlaced();
    } catch (err) {
      onPlacementError?.(err instanceof Error ? err.message : String(err));
    }
  }, [computeForwardFallback, onPlaced, onPlacementError, readCameraPose]);

  useEffect(() => {
    apiRef.current = { placePortal };
    return () => {
      apiRef.current = null;
    };
  }, [apiRef, placePortal]);

  const handleClick = useCallback(() => {
    void placePortal();
  }, [placePortal]);

  return (
    <ViroARScene
      ref={sceneRef}
      onTrackingUpdated={onTrackingUpdated}
      onCameraTransformUpdate={onCameraTransformUpdate}
      onClick={handleClick}
    >
      {placement ? (
        <ViroPortalScene passable position={placement.position} rotation={placement.rotation}>
          <ViroPortal>
            <Viro3DObject
              type="OBJ"
              source={windowFrameAsset}
              materials={['whiteWindowFrame']}
            />
            <Viro360Image source={{ uri: room.panoramic360Url }} />
          </ViroPortal>
        </ViroPortalScene>
      ) : null}
    </ViroARScene>
  );
}

export const PortalScene = forwardRef<PortalSceneHandle, PortalSceneProps>(
  function PortalScene({ room, onPlaced, onPlacementError }, ref) {
    const apiRef = useRef<PortalSceneHandle | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        placePortal: () => apiRef.current?.placePortal(),
      }),
      [],
    );

    return (
      <ViroARSceneNavigator
        initialScene={{
          scene: () => (
            <PortalARScene
              room={room}
              onPlaced={onPlaced}
              onPlacementError={onPlacementError}
              apiRef={apiRef}
            />
          ),
        }}
        style={{ flex: 1 }}
      />
    );
  },
);

