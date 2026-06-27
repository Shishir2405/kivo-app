/**
 * Auth store (zustand) — REAL Firebase auth + Kivo backend session.
 *
 * Flow:
 *   login(email, password)  → signInWithEmailAndPassword → getIdToken
 *                           → POST /auth/login { idToken }
 *                           → persist { accessToken, refreshToken, user }
 *                           → set tokens on the api client.
 *   register(name,email,pw) → createUserWithEmailAndPassword → getIdToken
 *                           → POST /auth/register { idToken } (strict: no name)
 *                           → PATCH /users/me { displayName } to set the name.
 *   logout()                → clear storage + firebase signOut + api tokens.
 *   restoreSession()        → hydrate from AsyncStorage on app start.
 *
 * ROBUSTNESS: every method is wrapped in try/catch and returns a typed
 * `{ ok, error? }` result. It NEVER throws uncaught — an unhandled rejection
 * here was the crash. Screens may `await` for the result or call fire-and-forget.
 *
 * BACK-COMPAT: `login` / `register` also accept the legacy `{ token?, user? }`
 * payload (used by the old auth screens / "skip") so existing call sites keep
 * compiling. Pass an email string for the real flow.
 */
import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  setAuthTokens,
  registerAuthHandlers,
  requestData,
  isApiError,
} from '@/services/api';
import {
  firebaseAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  firebaseSignOut,
  GoogleAuthProvider,
  signInWithCredential,
} from '@/services/firebase';
import type { UserProfile } from '@/types/models';

const STORAGE_KEY = 'kivo.auth.session.v1';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResult {
  ok: boolean;
  error?: string;
}

/** Legacy payload accepted by login/register for back-compat. */
export interface LegacyAuthPayload {
  token?: string;
  user?: UserProfile | null;
}

interface PersistedSession {
  tokens: AuthTokens;
  user: UserProfile | null;
}

export interface AuthState {
  isAuthenticated: boolean;
  /** True until AsyncStorage hydration completes on app start. */
  hydrating: boolean;
  /** True while a login/register request is in flight. */
  loading: boolean;
  token: string | null;
  refreshToken: string | null;
  user: UserProfile | null;

  /**
   * Sign in. Pass (email, password) for the real Firebase + backend flow, OR a
   * legacy `{ token, user }` payload to set the session directly (back-compat).
   */
  login: (emailOrPayload?: string | LegacyAuthPayload, password?: string) => Promise<AuthResult>;
  /**
   * Register. Pass (email, password, name?) for the real flow, OR a legacy
   * `{ token, user }` payload (back-compat).
   */
  register: (
    emailOrPayload?: string | LegacyAuthPayload,
    password?: string,
    name?: string,
  ) => Promise<AuthResult>;
  /**
   * Federated Google sign-in. Pass the Google OAuth `idToken` (obtained on the
   * client via expo-auth-session). It is exchanged for a Firebase credential,
   * then the Firebase ID token is POSTed to /auth/login — same backend contract
   * as email/password `login`. NEVER throws; returns a typed result.
   */
  loginWithGoogle: (googleIdToken: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
  /** Directly set a session (used by the legacy payload path + tests). */
  setSession: (session: { tokens: AuthTokens; user: UserProfile | null }) => Promise<void>;
  /** Hydrate from AsyncStorage on app start. Call once from the root layout. */
  restoreSession: () => Promise<void>;
}

function readErr(e: unknown, fallback: string): string {
  if (isApiError(e)) return e.message;
  if (e && typeof e === 'object' && 'message' in e) {
    const m = (e as { message?: unknown }).message;
    if (typeof m === 'string') {
      // Firebase auth errors look like "Firebase: Error (auth/wrong-password)."
      if (m.includes('auth/invalid-credential') || m.includes('auth/wrong-password'))
        return 'Incorrect email or password.';
      if (m.includes('auth/user-not-found')) return 'No account found for that email.';
      if (m.includes('auth/email-already-in-use')) return 'That email is already registered.';
      if (m.includes('auth/invalid-email')) return 'Enter a valid email address.';
      if (m.includes('auth/weak-password')) return 'Password is too weak (min 6 characters).';
      if (m.includes('auth/network-request-failed'))
        return 'Network error. Check your connection.';
      if (m.includes('auth/too-many-requests')) return 'Too many attempts. Try again later.';
      return m;
    }
  }
  return fallback;
}

/** Backend /auth/login | /auth/register response payload (already unwrapped). */
interface AuthEnvelope {
  user: UserProfile;
  tokens: AuthTokens;
}

function isLegacyPayload(v: unknown): v is LegacyAuthPayload {
  return typeof v === 'object' && v !== null && ('token' in v || 'user' in v);
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  hydrating: true,
  loading: false,
  token: null,
  refreshToken: null,
  user: null,

  setUser: (user) => set({ user }),

  setSession: async ({ tokens, user }) => {
    setAuthTokens(tokens);
    set({
      isAuthenticated: true,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user,
    });
    try {
      const payload: PersistedSession = { tokens, user };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      /* persistence is best-effort; session still lives in memory */
    }
  },

  login: async (emailOrPayload, password) => {
    // Back-compat: legacy { token, user } payload sets the session directly.
    if (isLegacyPayload(emailOrPayload) || emailOrPayload === undefined) {
      const p = (emailOrPayload ?? {}) as LegacyAuthPayload;
      await get().setSession({
        tokens: { accessToken: p.token ?? '', refreshToken: '' },
        user: p.user ?? null,
      });
      return { ok: true };
    }

    const email = emailOrPayload.trim();
    set({ loading: true });
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password ?? '');
      const idToken = await cred.user.getIdToken();
      const data = await requestData<AuthEnvelope>({
        url: '/auth/login',
        method: 'POST',
        data: { idToken },
      });
      await get().setSession({ tokens: data.tokens, user: data.user });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: readErr(e, 'Could not sign in. Please try again.') };
    } finally {
      set({ loading: false });
    }
  },

  register: async (emailOrPayload, password, name) => {
    if (isLegacyPayload(emailOrPayload) || emailOrPayload === undefined) {
      const p = (emailOrPayload ?? {}) as LegacyAuthPayload;
      await get().setSession({
        tokens: { accessToken: p.token ?? '', refreshToken: '' },
        user: p.user ?? null,
      });
      return { ok: true };
    }

    const email = emailOrPayload.trim();
    set({ loading: true });
    try {
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password ?? '');
      const idToken = await cred.user.getIdToken();
      // The backend /auth/register schema is .strict() and accepts ONLY { idToken }
      // — sending `name` returns 422 "Unrecognized key". Register first, then set
      // the display name via the profile endpoint (which accepts `displayName`).
      const data = await requestData<AuthEnvelope>({
        url: '/auth/register',
        method: 'POST',
        data: { idToken },
      });
      await get().setSession({ tokens: data.tokens, user: data.user });

      const trimmedName = name?.trim();
      if (trimmedName) {
        try {
          const updated = await requestData<UserProfile>({
            url: '/users/me',
            method: 'PATCH',
            data: { displayName: trimmedName },
          });
          if (updated) get().setUser(updated);
        } catch {
          /* non-fatal — the name can be set later in Edit Profile */
        }
      }
      return { ok: true };
    } catch (e) {
      return { ok: false, error: readErr(e, 'Could not create your account. Please try again.') };
    } finally {
      set({ loading: false });
    }
  },

  loginWithGoogle: async (googleIdToken) => {
    if (!googleIdToken) {
      return { ok: false, error: 'Could not sign in with Google. Please try again.' };
    }
    set({ loading: true });
    try {
      // Exchange the Google idToken for a Firebase credential, then mint a
      // Firebase ID token and POST it to /auth/login (same as the email flow).
      const credential = GoogleAuthProvider.credential(googleIdToken);
      const cred = await signInWithCredential(firebaseAuth, credential);
      const idToken = await cred.user.getIdToken();
      const data = await requestData<AuthEnvelope>({
        url: '/auth/login',
        method: 'POST',
        data: { idToken },
      });
      await get().setSession({ tokens: data.tokens, user: data.user });
      return { ok: true };
    } catch (e) {
      return { ok: false, error: readErr(e, 'Could not sign in with Google. Please try again.') };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    setAuthTokens({ accessToken: null, refreshToken: null });
    set({ isAuthenticated: false, token: null, refreshToken: null, user: null });
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    try {
      await firebaseSignOut(firebaseAuth);
    } catch {
      /* ignore — local session is already cleared */
    }
  },

  restoreSession: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        set({ hydrating: false });
        return;
      }
      const parsed = JSON.parse(raw) as PersistedSession;
      if (parsed?.tokens?.accessToken) {
        setAuthTokens(parsed.tokens);
        set({
          isAuthenticated: true,
          token: parsed.tokens.accessToken,
          refreshToken: parsed.tokens.refreshToken,
          user: parsed.user ?? null,
        });
      }
    } catch {
      /* corrupt storage → start logged out */
    } finally {
      set({ hydrating: false });
    }
  },
}));

// Wire the api client so a successful silent refresh persists the new tokens and
// a failed refresh logs the user out — without importing the store into api.ts.
registerAuthHandlers({
  onTokensRefreshed: (tokens) => {
    const { user, setSession } = useAuthStore.getState();
    void setSession({ tokens, user });
  },
  onForceLogout: () => {
    void useAuthStore.getState().logout();
  },
});
