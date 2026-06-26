/**
 * Axios API client for the Kivo backend.
 *
 * baseURL targets the DEPLOYED backend on Vercel. It stays overridable via the
 * `EXPO_PUBLIC_API_BASE_URL` env var (read at bundle time) so a local server can
 * be pointed at without code changes. The request interceptor attaches a bearer
 * token (placeholder — wired to the auth store / secure storage by the auth
 * screens once auth ships). The response interceptor normalises errors.
 */
import axios, {
  type AxiosInstance,
  type AxiosError,
  type InternalAxiosRequestConfig,
} from 'axios';

/** Live deployed backend (override with EXPO_PUBLIC_API_BASE_URL for local dev). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://kivo-backend-xi.vercel.app/api/v1';

/**
 * In-memory auth token holder. Auth screens call `setAuthToken` after login so
 * the interceptor can attach it; replace with secure storage hydration later.
 */
let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request: attach bearer token ------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (authToken) {
    config.headers.set?.('Authorization', `Bearer ${authToken}`);
  }
  return config;
});

// --- Response: normalise errors --------------------------------------------
export interface ApiError {
  status: number;
  message: string;
  /** Original axios error for debugging. */
  raw?: unknown;
}

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string }>) => {
    const apiError: ApiError = {
      status: error.response?.status ?? 0,
      message:
        error.response?.data?.message ??
        error.message ??
        'Something went wrong. Please try again.',
      raw: error,
    };
    return Promise.reject(apiError);
  },
);

// --- Health check ----------------------------------------------------------

export interface HealthResult {
  ok: boolean;
  status: number;
  data?: unknown;
}

/**
 * Ping `${API_BASE_URL}/health` to confirm the deployed backend is reachable.
 * Resolves (never rejects) with `{ ok, status }` so callers can branch simply.
 */
export async function checkHealth(): Promise<HealthResult> {
  try {
    const res = await api.get('/health', { timeout: 8000 });
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data };
  } catch (err) {
    const status =
      typeof err === 'object' && err !== null && 'status' in err
        ? Number((err as ApiError).status)
        : 0;
    return { ok: false, status };
  }
}

export default api;
