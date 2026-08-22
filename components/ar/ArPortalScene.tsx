import { ViroARSceneNavigator } from '@reactvision/react-viro';
import { ViroPortalRoom } from './ViroPortalRoom';
import type { Point2D, Room } from '../../types';

interface ArPortalSceneProps {
  room: Room;
  doorCenter: Point2D;
}

/**
 * Mounts the Viro AR engine. The PlacardScannerScreen guarantees the 2D camera is fully
 * unmounted before this component mounts (and vice-versa) to avoid native camera locks.
 */
export function ArPortalScene({ room, doorCenter }: ArPortalSceneProps) {
  return (
    <ViroARSceneNavigator
      initialScene={{
        scene: () => <ViroPortalRoom room={room} doorCenter={doorCenter} />,
      }}
      style={{ flex: 1 }}
    />
  );
}
