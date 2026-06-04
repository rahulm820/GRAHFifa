// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG
// Expo automatically injects EXPO_PUBLIC_* variables at build time.
// No dotenv import needed — process.env.EXPO_PUBLIC_* works natively.
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  measurementId:     process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — Google Sign-In only
// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Firebase (safe for Expo Fast Refresh — avoids duplicate init)
// ─────────────────────────────────────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export default app;
