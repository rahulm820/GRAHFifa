// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG — Replace placeholders with your real values from:
// Firebase Console → Project Settings → Your Apps → Web App → firebaseConfig
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import dotenv from 'dotenv';
dotenv.config();
const apiKey = process.env.FIREBASE_API_KEY;
const authDomain = process.env.FIREBASE_AUTH_DOMAIN;
const projectId = process.env.FIREBASE_PROJECT_ID;
const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.FIREBASE_APP_ID;
const measurementId = process.env.FIREBASE_MEASUREMENT_ID;
// 🔥 STEP 1: Paste your Firebase project config here
const firebaseConfig = {
  apiKey: apiKey,
  authDomain: authDomain,
  projectId: projectId,
  storageBucket: storageBucket,
  messagingSenderId: messagingSenderId,
  appId: appId,
  measurementId: measurementId
};

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — Google Sign-In only
// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_WEB_CLIENT_ID = process.env.GOOGLE_WEB_CLIENT_ID;

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Firebase (safe for Expo Fast Refresh — avoids duplicate init)
// ─────────────────────────────────────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export default app;
