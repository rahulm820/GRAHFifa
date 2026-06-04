import { create } from 'zustand';
import {
  onAuthStateChanged,
  signOut,
  signInWithCredential,
  signInWithPopup,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
} from 'firebase/auth';
import { auth } from '../config/firebase';

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a normalized user object from Firebase User
// ─────────────────────────────────────────────────────────────────────────────
const normalizeUser = (firebaseUser, extraProvider = null) => {
  if (!firebaseUser) return null;
  const providerData = firebaseUser.providerData?.[0];
  let provider = extraProvider || 'email';
  if (providerData?.providerId === 'google.com') provider = 'google';

  return {
    uid: firebaseUser.uid,
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'FIFAFan',
    email: firebaseUser.email,
    photoURL: firebaseUser.photoURL || null,
    provider,
  };
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: true,   // true while Firebase restores session on app boot
  error: null,

  // ── Called once from App.js ──────────────────────────────────────────────
  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({ user: normalizeUser(firebaseUser), isLoggedIn: true, isLoading: false });
      } else {
        set({ user: null, isLoggedIn: false, isLoading: false });
      }
    });
    return unsubscribe; // caller can call to detach listener
  },

  // ── Google Sign-In (WEB) — Firebase signInWithPopup ────────────────────
  // No redirect URI config needed. Firebase handles the popup internally.
  loginWithGooglePopup: async () => {
    set({ error: null });
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // onAuthStateChanged fires automatically and updates state
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Google Sign-In (NATIVE) — expo-auth-session id_token flow ─────────
  loginWithGoogleCredential: async (idToken) => {
    set({ error: null });
    try {
      const credential = GoogleAuthProvider.credential(idToken);
      await signInWithCredential(auth, credential);
      // onAuthStateChanged will fire and update state automatically
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },


  // ── Email Sign-In ─────────────────────────────────────────────────────────
  loginWithEmail: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Email Sign-Up ─────────────────────────────────────────────────────────
  signUpWithEmail: async (email, password, displayName) => {
    set({ error: null });
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(firebaseUser, {
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2DB555&color=fff&bold=true&size=256`,
      });
      // onAuthStateChanged fires automatically after profile update
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logout: async () => {
    await signOut(auth);
    // onAuthStateChanged fires → clears state
  },

  clearError: () => set({ error: null }),
}));
