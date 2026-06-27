/**
 * Firebase client for Kivo auth.
 *
 * Initializes the Firebase JS SDK with the web config and wires React Native
 * persistence (AsyncStorage) so the Firebase session survives app restarts.
 * Auth flows live in the auth store; this module only exposes the configured
 * `firebaseAuth` instance + re-exports the SDK calls the store needs.
 */
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { initializeAuth, getAuth, type Auth, type Persistence } from 'firebase/auth';
import * as firebaseAuthModule from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * `getReactNativePersistence` ships only in firebase/auth's React Native entry
 * (resolved by Metro at runtime); the default web types don't expose it. Access
 * it via the module namespace with a typed cast so tsc stays happy.
 */
const getReactNativePersistence = (
  firebaseAuthModule as unknown as {
    getReactNativePersistence: (storage: unknown) => Persistence;
  }
).getReactNativePersistence;

/** Firebase web config (client auth via the firebase JS SDK). */
const firebaseConfig = {
  apiKey: 'AIzaSyAb1ZOiq1U7UNU96BgfA3Ib7mHygiz0fHw',
  authDomain: 'bad-talks-demo.firebaseapp.com',
  projectId: 'bad-talks-demo',
  messagingSenderId: '249950991247',
  appId: '1:249950991247:android:df52d0876d5d472fe4d1fa',
} as const;

const app: FirebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

/**
 * Auth instance with AsyncStorage persistence. `initializeAuth` can only run
 * once per app; if it has already been initialized (Fast Refresh / re-import)
 * fall back to `getAuth`.
 */
function createAuth(): Auth {
  try {
    return initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    return getAuth(app);
  }
}

export const firebaseAuth: Auth = createAuth();

export { app as firebaseApp };
export {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  // Google federated sign-in: exchange a Google idToken for a Firebase credential.
  GoogleAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
