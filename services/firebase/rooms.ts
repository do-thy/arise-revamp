import {
  collection,
  doc,
  getDoc,
  getDocs,
  type DocumentData,
} from 'firebase/firestore';
import { getFirestoreDb } from './config';
import type { Room } from '../../types';

const ROOMS_COLLECTION = 'rooms';

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

/** Fetch every room from Firestore (the local matching corpus). */
export async function getRooms(): Promise<Room[]> {
  const snapshot = await getDocs(collection(getFirestoreDb(), ROOMS_COLLECTION));
  return snapshot.docs.map((d) => toRoom(d.id, d.data()));
}

export async function getRoomById(id: string): Promise<Room | null> {
  const snap = await getDoc(doc(getFirestoreDb(), ROOMS_COLLECTION, id));
  return snap.exists() ? toRoom(snap.id, snap.data()) : null;
}
