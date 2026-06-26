/**
 * Auth store (zustand). Holds session state for the routing gate.
 *
 * `isAuthenticated` defaults to false so `app/index.tsx` routes to (auth).
 * Auth screens call `login` / `register` / `logout`. The token is mirrored
 * into the axios client via `setAuthToken`.
 */
import { create } from 'zustand';
import { setAuthToken } from '@/services/api';
import type { UserProfile } from '@/types/models';

export interface AuthState {
  isAuthenticated: boolean;
  /** True until secure-storage hydration completes (kept simple here). */
  hydrating: boolean;
  token: string | null;
  user: UserProfile | null;

  /** Mark the user signed-in with an optional token + profile. */
  login: (payload?: { token?: string; user?: UserProfile }) => void;
  register: (payload?: { token?: string; user?: UserProfile }) => void;
  logout: () => void;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  hydrating: false,
  token: null,
  user: null,

  login: ({ token = null, user = null } = {}) => {
    setAuthToken(token);
    set({ isAuthenticated: true, token, user });
  },

  register: ({ token = null, user = null } = {}) => {
    setAuthToken(token);
    set({ isAuthenticated: true, token, user });
  },

  logout: () => {
    setAuthToken(null);
    set({ isAuthenticated: false, token: null, user: null });
  },

  setUser: (user) => set({ user }),
}));
