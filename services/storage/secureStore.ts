import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { Role } from '../../types';

const KEYS = {
  userId: 'arise.userId',
  role: 'arise.role',
} as const;

/**
 * Web fallback storage (SecureStore has no web support).
 */
const webStorage = (): Storage | null => {
  if (Platform.OS !== 'web') return null;
  const g = globalThis as unknown as { localStorage?: Storage };
  return g.localStorage ?? null;
};

export interface StoredSession {
  userId: string;
  role: Role;
}

/** Persist a lightweight session bootstrap for offline/startup use. */
export async function saveSession(userId: string, role: Role): Promise<void> {
  const web = webStorage();
  if (web) {
    web.setItem(KEYS.userId, userId);
    web.setItem(KEYS.role, role);
    return;
  }
  await SecureStore.setItemAsync(KEYS.userId, userId);
  await SecureStore.setItemAsync(KEYS.role, role);
}

export async function getSession(): Promise<StoredSession | null> {
  const web = webStorage();
  if (web) {
    const userId = web.getItem(KEYS.userId);
    const role = web.getItem(KEYS.role);
    return userId ? { userId, role: (role as Role) ?? 'user' } : null;
  }
  const [userId, role] = await Promise.all([
    SecureStore.getItemAsync(KEYS.userId),
    SecureStore.getItemAsync(KEYS.role),
  ]);
  return userId ? { userId, role: (role as Role) ?? 'user' } : null;
}

export async function clearSession(): Promise<void> {
  const web = webStorage();
  if (web) {
    web.removeItem(KEYS.userId);
    web.removeItem(KEYS.role);
    return;
  }
  await Promise.all([
    SecureStore.deleteItemAsync(KEYS.userId),
    SecureStore.deleteItemAsync(KEYS.role),
  ]);
}
