import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from './config';
import type { Room } from '../../types';

const ROOMS_COLLECTION = 'rooms';
const ROOM_METADATA_COLLECTION = 'room_metadata';

function toRoom(id: string, data: DocumentData): Room {
  return {
    id,
    name: data.name ?? id,
    floor: data.floor ?? '',
    building: data.building ?? '',
    panoramic360Url: data.panoramic360Url ?? '',
    schedule: {
      currentStatus: data.schedule?.currentStatus ?? 'available',
      currentEvent: data.schedule?.currentEvent,
      nextEvent: data.schedule?.nextEvent,
      nextEventTime: data.schedule?.nextEventTime,
    },
    occupancy: {
      capacity: data.occupancy?.capacity ?? 0,
      currentCount: data.occupancy?.currentCount ?? 0,
      facilities: data.occupancy?.facilities ?? [],
    },
  };
}

/**
 * Map a `room_metadata` document (schema: `ocrSearchTerms`, `roomName`,
 * `buildingName`, `roomDescription`, `panoImageUrl`) into the shared `Room` shape.
 */
function metadataToRoom(id: string, data: DocumentData): Room {
  return {
    id,
    name: data.roomName ?? id,
    floor: data.floor ?? '',
    building: data.buildingName ?? data.building ?? '',
    description: data.roomDescription,
    panoramic360Url: data.panoImageUrl ?? '',
    schedule: {
      currentStatus: data.schedule?.currentStatus ?? 'available',
      currentEvent: data.schedule?.currentEvent,
      nextEvent: data.schedule?.nextEvent,
      nextEventTime: data.schedule?.nextEventTime,
    },
    occupancy: {
      capacity: data.occupancy?.capacity ?? 0,
      currentCount: data.occupancy?.currentCount ?? 0,
      facilities: data.occupancy?.facilities ?? [],
    },
  };
}

/** Fetch every room from Firestore (the local matching corpus). */
export async function getRooms(): Promise<Room[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), ROOMS_COLLECTION));
  return snapshot.docs.map((d) => toRoom(d.id, d.data()));
}

export async function getRoomById(id: string): Promise<Room | null> {
  const snap = await getDoc(doc(getFirestoreDb(), ROOMS_COLLECTION, id));
  return snap.exists() ? toRoom(snap.id, snap.data()) : null;
}

/**
 * Resolve a room by an exact, sanitized OCR term (Phase C lookup).
 *
 * `room_metadata.ocrSearchTerms` is a pre-populated string array of sanitized
 * room-label variants. We query it with `array-contains` using the sanitized OCR
 * output and return the single matching room (or `null` when nothing matches).
 */
export async function getRoomByOcrSearchTerm(term: string): Promise<Room | null> {
  const snapshot = await getDocs(
    query(
      collection(getFirestoreDb(), ROOM_METADATA_COLLECTION),
      where('ocrSearchTerms', 'array-contains', term),
      limit(1),
    ),
  );
  const first = snapshot.docs[0];
  return first ? metadataToRoom(first.id, first.data()) : null;
}
