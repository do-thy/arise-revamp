import Fuse from 'fuse.js';
import type { Room, RoomMatch } from '../../types';

/**
 * Normalize OCR output: uppercase, strip non-alphanumerics, collapse whitespace.
 * "Room  105 -A" -> "ROOM 105 A".
 */
export function normalizeText(input: string): string {
  return input
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

/** Classic Levenshtein edit distance (pure, unit-testable). */
export function levenshteinDistance(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let previous = new Array<number>(n + 1);
  let current = new Array<number>(n + 1);
  for (let j = 0; j <= n; j++) previous[j] = j;

  for (let i = 1; i <= m; i++) {
    current[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + cost,
      );
    }
    [previous, current] = [current, previous];
  }
  return previous[n];
}

/** Normalized similarity in 0..1 (1 = identical). */
export function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

function round(value: number, decimals = 3): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Resolve a normalized OCR string to candidate rooms.
 *
 * 1. Exact match on normalized `id` or `name` -> immediately `isExact`.
 * 2. Fuse.js fuzzy search across `id` (weighted) and `name`.
 * 3. Levenshtein fallback when Fuse returns nothing.
 */
export function matchRooms(ocrText: string, rooms: Room[], topN = 5): RoomMatch[] {
  const normalized = normalizeText(ocrText);
  if (!normalized || rooms.length === 0) return [];

  const exact = rooms.filter((room) => {
    const id = normalizeText(room.id);
    const name = normalizeText(room.name);
    return id === normalized || name === normalized || normalized.includes(id);
  });

  if (exact.length > 0) {
    return exact.map((room) => ({ room, score: 1, isExact: true }));
  }

  const fuse = new Fuse(rooms, {
    keys: [
      { name: 'id', weight: 2 },
      { name: 'name', weight: 1 },
    ],
    includeScore: true,
    threshold: 0.6,
    ignoreLocation: true,
  });

  const fused = fuse.search(normalized).slice(0, topN);
  let matches: RoomMatch[] = fused.map((result) => ({
    room: result.item,
    score: round(1 - (result.score ?? 1)),
    isExact: false,
  }));

  if (matches.length === 0) {
    matches = rooms
      .map((room) => {
        const score = Math.max(
          levenshteinSimilarity(normalized, normalizeText(room.id)),
          levenshteinSimilarity(normalized, normalizeText(room.name)),
        );
        return { room, score: round(score), isExact: false };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, topN);
  }

  return matches.sort((a, b) => b.score - a.score);
}
