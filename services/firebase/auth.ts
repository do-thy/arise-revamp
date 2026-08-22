import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  type User,
} from 'firebase/auth';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { getFirebaseAuth } from './config';
import { saveSession, clearSession } from '../storage/secureStore';
import { ENV } from '../../constants/env';
import type { Role } from '../../types';

function mapToRole(user: User): Role {
  // Admin detection can later be driven by a custom claim or Firestore profile.
  return 'user';
}

export async function signInWithEmail(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(getFirebaseAuth(), email, password);
  await saveSession(credential.user.uid, mapToRole(credential.user));
  return credential.user;
}

export async function signUpWithEmail(email: string, password: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(getFirebaseAuth(), email, password);
  await saveSession(credential.user.uid, mapToRole(credential.user));
  return credential.user;
}

/**
 * Google Sign-In (native). Requires:
 *  - `google-services.json` (Android) / `GoogleService-Info.plist` (iOS)
 *  - `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `.env`
 */
export async function signInWithGoogle(): Promise<User> {
  if (ENV.google.webClientId) {
    GoogleSignin.configure({ webClientId: ENV.google.webClientId });
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const result = await GoogleSignin.signIn();
  const idToken = result.data?.idToken;
  if (!idToken) {
    throw new Error('Google Sign-In did not return an idToken.');
  }
  const credential = GoogleAuthProvider.credential(idToken);
  const signedIn = await signInWithCredential(getFirebaseAuth(), credential);
  await saveSession(signedIn.user.uid, mapToRole(signedIn.user));
  return signedIn.user;
}

export async function signOutUser(): Promise<void> {
  await signOut(getFirebaseAuth());
  await clearSession();
}

/** Bridges Firebase auth state changes to the presentation tier. */
export function subscribeToAuthState(callback: (user: User | null) => void): () => void {
  return onAuthStateChanged(getFirebaseAuth(), callback);
}
