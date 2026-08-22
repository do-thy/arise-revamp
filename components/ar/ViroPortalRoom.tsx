/**
 * AR scene that anchors a portal at a raycast door position and reveals the room's
 * 360° panorama through it (blueprint §9).
 */
import { useRef, useState } from 'react';
import {
  ViroARScene,
  Viro360Image,
  Viro3DObject,
  ViroPortal,
  ViroPortalScene,
  ViroTrackingStateConstants,
  type ViroARHitTestResult,
  type ViroTrackingReason,
  type ViroTrackingState,
} from '@reactvision/react-viro';
import type { Point2D, Room, Vec3 } from '../../types';
import doorFrameAsset from '../../assets/models/door_frame.obj';

interface ViroPortalRoomProps {
  room: Room;
  /** Normalized (0..1) viewport coordinate of the detected door center. */
  doorCenter: Point2D;
}

export function ViroPortalRoom({ room, doorCenter }: ViroPortalRoomProps) {
  const sceneRef = useRef<ViroARScene>(null);
  const [worldPosition, setWorldPosition] = useState<Vec3 | null>(null);

  const onTrackingUpdated = (state: ViroTrackingState, _reason: ViroTrackingReason) => {
    if (state !== ViroTrackingStateConstants.TRACKING_NORMAL || worldPosition) return;

    sceneRef.current
      ?.performARHitTestWithPoint(doorCenter.x, doorCenter.y)
      .then((results: ViroARHitTestResult[]) => {
        const first = results?.[0];
        if (first?.transform.position) {
          setWorldPosition(first.transform.position);
        }
      })
      .catch(() => {
        // Hit test can fail before planes are detected; keep waiting for tracking updates.
      });
  };

  return (
    <ViroARScene ref={sceneRef} onTrackingUpdated={onTrackingUpdated}>
      {worldPosition ? (
        <ViroPortalScene passable position={worldPosition}>
          <ViroPortal>
            <Viro3DObject type="OBJ" source={doorFrameAsset} />
            <Viro360Image source={{ uri: room.panoramic360Url }} />
          </ViroPortal>
        </ViroPortalScene>
      ) : null}
    </ViroARScene>
  );
}
