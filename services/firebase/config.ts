import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  initializeAuth,
  type Auth,
  type Persistence,
} from 'firebase/auth';
import * as firebaseAuth from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ENV, isFirebaseConfigured } from '../../constants/env';

/**
 * Firebase v12 ships `getReactNativePersistence` in the `react-native` build of
 * `@firebase/auth` (resolved at bundle time by Metro via the `react-native` export
 * condition), but the public `firebase/auth` type surface omits it. Re-cast the
 * namespace so the TypeScript layer can consume it without a shim.
 */
const getReactNativePersistence = (
  firebaseAuth as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;

/** Returns (and lazily initializes) the Firebase app. */
export function getFirebaseApp(): FirebaseApp {
  if (app) return app;

  if (getApps().length > 0) {
    app = getApp();
    return app;
  }

  if (!isFirebaseConfigured()) {
    throw new Error(
      'Firebase is not configured. Copy `.env.example` to `.env` and set the EXPO_PUBLIC_FIREBASE_* values, then restart the dev server.',
    );
  }

  app = initializeApp({
    apiKey: ENV.firebase.apiKey,
    authDomain: ENV.firebase.authDomain,
    projectId: ENV.firebase.projectId,
    storageBucket: ENV.firebase.storageBucket,
    messagingSenderId: ENV.firebase.messagingSenderId,
    appId: ENV.firebase.appId,
  });
  return app;
}

/** Returns the Auth instance with AsyncStorage-backed persistence. */
export function getFirebaseAuth(): Auth {
  if (auth) return auth;
  const firebaseApp = getFirebaseApp();
  auth = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
  return auth;
}

/** Returns the Firestore instance. */
export function getFirestoreDb(): Firestore {
  if (db) return db;
  db = getFirestore(getFirebaseApp());
  return db;
}

