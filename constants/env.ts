/**
 * Centralised environment configuration.
 *
 * All values are read from `process.env.EXPO_PUBLIC_*`, which the Expo CLI inlines
 * at bundle time. Copy `.env.example` to `.env` and populate before building.
 * We intentionally do NOT throw here so the app can boot and surface a friendly
 * error from the service layer instead.
 */
export const ENV = {
  firebase: {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  },
  google: {
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  },
} as const;

/** True when the minimal Firebase Web config has been supplied. */
export function isFirebaseConfigured(): boolean {
  const { apiKey, projectId, appId } = ENV.firebase;
  return Boolean(apiKey && projectId && appId);
}
