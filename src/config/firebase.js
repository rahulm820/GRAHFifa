// ─────────────────────────────────────────────────────────────────────────────
// FIREBASE CONFIG — Replace placeholders with your real values from:
// Firebase Console → Project Settings → Your Apps → Web App → firebaseConfig
// ─────────────────────────────────────────────────────────────────────────────
import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';

// 🔥 STEP 1: Paste your Firebase project config here
const firebaseConfig = {
  apiKey: "AIzaSyBfLivFFAbegWxWBIszbFmUQf_Pxtp7rkI",
  authDomain: "grah-ee306.firebaseapp.com",
  projectId: "grah-ee306",
  storageBucket: "grah-ee306.firebasestorage.app",
  messagingSenderId: "417059112693",
  appId: "1:417059112693:web:f7b7ecf4f0871d688ce7bc",
  measurementId: "G-LFJV4594QB"
};

// ─────────────────────────────────────────────────────────────────────────────
// OAUTH — Google Sign-In only
// Firebase Console → Authentication → Sign-in method → Google → Web SDK configuration
// ─────────────────────────────────────────────────────────────────────────────
export const GOOGLE_WEB_CLIENT_ID = '417059112693-cr5rstucrueq2meilbs2gqje26a1j6qr.apps.googleusercontent.com';

// ─────────────────────────────────────────────────────────────────────────────
// Initialize Firebase (safe for Expo Fast Refresh — avoids duplicate init)
// ─────────────────────────────────────────────────────────────────────────────
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const auth = getAuth(app);

export default app;
