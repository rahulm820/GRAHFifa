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
// Helper: normalize Firebase user to our user shape
// ─────────────────────────────────────────────────────────────────────────────
const normalizeUser = (firebaseUser) => {
  if (!firebaseUser) return null;
  const providerData = firebaseUser.providerData?.[0];
  const provider = providerData?.providerId === 'google.com' ? 'google' : 'email';
  return {
    uid:         firebaseUser.uid,
    displayName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'FIFAFan',
    email:       firebaseUser.email,
    photoURL:    firebaseUser.photoURL || null,
    provider,
  };
};

// ─────────────────────────────────────────────────────────────────────────────
// Helper: derive a username suggestion from a Google display name
// ─────────────────────────────────────────────────────────────────────────────
function suggestUsername(displayName) {
  if (!displayName) return 'fifafan';
  return displayName.split(' ')[0].toLowerCase().replace(/[^a-z0-9_]/g, '') || 'fifafan';
}

// ─────────────────────────────────────────────────────────────────────────────
export const useAuthStore = create((set, get) => ({
  // ── Auth state ──────────────────────────────────────────────────────────────
  user:      null,
  isLoggedIn: false,
  isLoading:  true,   // true while Firebase restores session on app boot
  error:      null,

  // ── Username Modal state (shown after any social login) ─────────────────────
  usernameModalVisible:  false,
  usernameModalProvider: null,    // 'google'
  usernameSuggestion:    '',

  // ── Internal pending state ──────────────────────────────────────────────────
  _pendingIdToken: null,    // native: idToken from expo-auth-session
  _pendingUser:    null,    // web: Firebase user from signInWithPopup

  // ── Init: listen to Firebase auth state ────────────────────────────────────
  init: () => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        set({ user: normalizeUser(firebaseUser), isLoggedIn: true, isLoading: false });
      } else {
        set({ user: null, isLoggedIn: false, isLoading: false });
      }
    });
    return unsubscribe;
  },

  // ── Google Sign-In — WEB ────────────────────────────────────────────────────
  // signInWithPopup: no redirect URI needed, no Google Cloud Console setup needed.
  // After popup completes, we show the UsernameModal so the user can pick a name.
  loginWithGooglePopup: async () => {
    set({ error: null });
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const firebaseUser = result.user;
      set({
        _pendingUser: firebaseUser,
        _pendingIdToken: null,
        usernameModalVisible: true,
        usernameModalProvider: 'google',
        usernameSuggestion: suggestUsername(firebaseUser.displayName),
      });
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Google Sign-In — NATIVE ─────────────────────────────────────────────────
  // Called from LoginScreen/SignupScreen after expo-auth-session returns idToken.
  // Stores the token and shows the UsernameModal — actual sign-in happens in loginWithProvider.
  prepareGoogleSignIn: (idToken) => {
    set({
      _pendingIdToken: idToken,
      _pendingUser: null,
      usernameModalVisible: true,
      usernameModalProvider: 'google',
      usernameSuggestion: 'fifafan',   // can't decode displayName before sign-in on native
    });
  },

  // ── Complete social login (called from UsernameModal → "Let's Go!") ─────────
  loginWithProvider: async (provider, username) => {
    set({ error: null });
    try {
      const { _pendingIdToken, _pendingUser } = get();
      let firebaseUser = _pendingUser;

      if (provider === 'google' && _pendingIdToken) {
        // Native path — sign in with the stored idToken now
        const credential = GoogleAuthProvider.credential(_pendingIdToken);
        const result = await signInWithCredential(auth, credential);
        firebaseUser = result.user;
      }

      // Update display name + avatar with the chosen username
      if (firebaseUser || auth.currentUser) {
        const u = firebaseUser || auth.currentUser;
        await updateProfile(u, {
          displayName: username,
          photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=2DB555&color=fff&bold=true&size=256`,
        });
      }

      // Close modal and clear pending tokens
      set({
        usernameModalVisible:  false,
        usernameModalProvider: null,
        usernameSuggestion:    '',
        _pendingIdToken:       null,
        _pendingUser:          null,
      });
      // onAuthStateChanged fires automatically → updates user + isLoggedIn
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // Dismiss modal without completing sign-in (user cancelled)
  dismissUsernameModal: () => {
    // If web popup already signed the user in, we must sign out so they're not in a half-state
    const { _pendingUser } = get();
    if (_pendingUser) {
      signOut(auth).catch(() => {});
    }
    set({
      usernameModalVisible:  false,
      usernameModalProvider: null,
      usernameSuggestion:    '',
      _pendingIdToken:       null,
      _pendingUser:          null,
    });
  },

  // ── Email Sign-In ────────────────────────────────────────────────────────────
  loginWithEmail: async (email, password) => {
    set({ error: null });
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Email Sign-Up ────────────────────────────────────────────────────────────
  signUpWithEmail: async (email, password, displayName) => {
    set({ error: null });
    try {
      const { user: firebaseUser } = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(firebaseUser, {
        displayName,
        photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=2DB555&color=fff&bold=true&size=256`,
      });
    } catch (e) {
      set({ error: e.message });
      throw e;
    }
  },

  // ── Logout ───────────────────────────────────────────────────────────────────
  logout: async () => {
    await signOut(auth);
  },

  clearError: () => set({ error: null }),
}));
