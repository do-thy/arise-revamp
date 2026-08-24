/** User role selected on the login screen. */
export type Role = 'user' | 'admin';

export type RoomStatus = 'available' | 'occupied' | 'reserved';

export interface RoomSchedule {
  currentStatus: RoomStatus;
  currentEvent?: string;
  nextEvent?: string;
  nextEventTime?: string;
}

export interface RoomOccupancy {
  capacity: number;
  currentCount: number;
  facilities: string[];
}

/**
 * A room document in the local database / Firestore `rooms` collection.
 * `id` doubles as the human-facing room label (e.g. "105").
 */
export interface Room {
  id: string;
  name: string;
  floor: string;
  building: string;
  /** Human-readable room description (from `room_metadata.roomDescription`). */
  description?: string;
  panoramic360Url: string;
  schedule: RoomSchedule;
  occupancy: RoomOccupancy;
}

/** A fuzzy match result produced by `services/matching`. */
export interface RoomMatch {
  room: Room;
  /** 0..1 similarity (1 = exact). */
  score: number;
  isExact: boolean;
}

export type Vec3 = [number, number, number];

/** A rectangle expressed as a fraction (0..1) of its containing space. */
export interface NormalizedRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** The Placard Scanner state machine phases (see blueprint §7.2). */
export type ScanPhase =
  | 'capture'
  | 'processing'
  | 'suggestions'
  | 'arPlacement'
  | 'portal';

export type AuthStatus = 'initializing' | 'signedOut' | 'signedIn';

/** Minimal, decoupled user shape exposed to the presentation tier. */
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

/**
 * Discriminated-union scanner state.
 * Phase C (`arPlacement` -> `portal`) uses point-and-tap raycast anchoring.
 */
export type ScannerState =
  | { phase: 'capture' }
  | { phase: 'processing' }
  | { phase: 'suggestions'; normalizedText: string; matches: RoomMatch[] }
  | { phase: 'arPlacement'; room: Room }
  | { phase: 'portal'; room: Room };
