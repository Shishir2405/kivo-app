/**
 * Axios API client for the Kivo backend (single instance for the whole app).
 *
 * - baseURL → the live deployed backend (override with EXPO_PUBLIC_API_BASE_URL).
 * - request interceptor attaches the Bearer access token from in-memory state
 *   (mirrored from the auth store on login / session restore).
 * - response interceptor NORMALISES every failure into a typed `ApiError` and,
 *   on a 401, attempts a single /auth/refresh then logs out.
 *
 * ROBUSTNESS: rejections are always typed `ApiError`s. Call sites (the data
 * hooks + auth store) wrap usage in try/catch so a failed request can never
 * surface as an unhandled rejection that closes the release app.
 */
import axios, {
  type AxiosInstance,
  type AxiosError,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';

/** Live deployed backend (override with EXPO_PUBLIC_API_BASE_URL for local dev). */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  'https://kivo-backend-xi.vercel.app/api/v1';

/* ------------------------------------------------------------------ */
/* Token holder + refresh/logout hooks                                 */
/* ------------------------------------------------------------------ */

let accessToken: string | null = null;
let refreshToken: string | null = null;

/** Called by the auth store to react to a successful silent refresh. */
let onTokensRefreshed: ((tokens: { accessToken: string; refreshToken: string }) => void) | null =
  null;
/** Called by the auth store when refresh fails and we must log out. */
let onForceLogout: (() => void) | null = null;

export function setAuthToken(token: string | null): void {
  accessToken = token;
}

export function setRefreshToken(token: string | null): void {
  refreshToken = token;
}

export function setAuthTokens(tokens: { accessToken: string | null; refreshToken: string | null }): void {
  accessToken = tokens.accessToken;
  refreshToken = tokens.refreshToken;
}

export function getAuthToken(): string | null {
  return accessToken;
}

export function registerAuthHandlers(handlers: {
  onTokensRefreshed?: (tokens: { accessToken: string; refreshToken: string }) => void;
  onForceLogout?: () => void;
}): void {
  onTokensRefreshed = handlers.onTokensRefreshed ?? null;
  onForceLogout = handlers.onForceLogout ?? null;
}

/* ------------------------------------------------------------------ */
/* The instance                                                        */
/* ------------------------------------------------------------------ */

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// --- Request: attach bearer token ------------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (accessToken) {
    config.headers.set?.('Authorization', `Bearer ${accessToken}`);
  }
  if (__DEV__) {
    const m = (config.method ?? 'get').toUpperCase();
    // eslint-disable-next-line no-console
    console.log(`[API →] ${m} ${config.url ?? ''}`, config.data ? JSON.stringify(config.data) : '');
  }
  return config;
});

/* ------------------------------------------------------------------ */
/* Error normalisation                                                 */
/* ------------------------------------------------------------------ */

export interface ApiError {
  /** HTTP status, or 0 for network/timeout/unknown failures. */
  status: number;
  /** Human-readable message safe to surface in the UI. */
  message: string;
  /** Backend error code if present. */
  code?: string;
  /** Field-level validation errors from the backend (422 details), if present. */
  details?: { field?: string; message: string; code?: string }[];
  /** True for network/timeout (no response received). */
  isNetwork: boolean;
  /** Original error for debugging (never rendered). */
  raw?: unknown;
}

/** Type guard so call sites can branch on a normalised ApiError. */
export function isApiError(e: unknown): e is ApiError {
  return (
    typeof e === 'object' &&
    e !== null &&
    'status' in e &&
    'message' in e &&
    'isNetwork' in e
  );
}

type ApiErrorDetail = { field?: string; message: string; code?: string };

function normalizeError(error: AxiosError<unknown>): ApiError {
  const response = error.response;
  const isNetwork = !response;
  // The backend nests errors as { success:false, error:{ message, code, details } };
  // some endpoints return a flat { message }. Handle both, and ALWAYS end with a
  // string message (never "[object Object]").
  const data = response?.data as
    | {
        message?: unknown;
        code?: string;
        details?: ApiErrorDetail[];
        error?: string | { message?: string; code?: string; details?: ApiErrorDetail[] };
      }
    | undefined;
  const errObj = data && typeof data.error === 'object' && data.error ? data.error : undefined;
  const details: ApiErrorDetail[] | undefined =
    (Array.isArray(errObj?.details) ? errObj?.details : undefined) ??
    (Array.isArray(data?.details) ? data?.details : undefined);

  // The human-readable detail line, e.g. "title: Required · dueDate: Invalid".
  const detailLine =
    details && details.length
      ? details.map((d) => (d.field ? `${d.field}: ${d.message}` : d.message)).join(' · ')
      : undefined;

  const baseMessage =
    (typeof errObj?.message === 'string' ? errObj.message : undefined) ??
    (typeof data?.message === 'string' ? data.message : undefined) ??
    (typeof data?.error === 'string' ? data.error : undefined) ??
    detailLine ??
    (isNetwork ? 'Network error. Check your connection and try again.' : error.message) ??
    'Something went wrong. Please try again.';

  // When the backend returns BOTH a generic message AND field-level details,
  // append the details so the form surfaces exactly which keys were rejected
  // (e.g. a 422 "Validation failed" + "title: Required").
  const message =
    detailLine && !baseMessage.includes(detailLine)
      ? `${baseMessage} (${detailLine})`
      : baseMessage;

  const apiError: ApiError = {
    status: response?.status ?? 0,
    message,
    code: errObj?.code ?? data?.code,
    details,
    isNetwork,
    raw: error,
  };
  if (__DEV__) {
    const m = (error.config?.method ?? 'get').toUpperCase();
    // eslint-disable-next-line no-console
    console.log(`[API ✗] ${apiError.status} ${m} ${error.config?.url ?? ''} — ${apiError.message}`);
    if (details) {
      // eslint-disable-next-line no-console
      console.log('   ↳ validation:', JSON.stringify(details));
    }
    if (isNetwork) {
      // eslint-disable-next-line no-console
      console.log('   ↳ no response (network/timeout)');
    }
  }
  return apiError;
}

/* ------------------------------------------------------------------ */
/* Silent refresh on 401                                               */
/* ------------------------------------------------------------------ */

type RetriableConfig = AxiosRequestConfig & { _retry?: boolean };

let refreshing: Promise<string | null> | null = null;

async function performRefresh(): Promise<string | null> {
  if (!refreshToken) return null;
  try {
    // Bare axios call so this request itself isn't intercepted/looped.
    const res = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { timeout: 12000, headers: { 'Content-Type': 'application/json' } },
    );
    const data = res.data?.data ?? res.data;
    const newAccess: string | undefined = data?.tokens?.accessToken ?? data?.accessToken;
    const newRefresh: string | undefined =
      data?.tokens?.refreshToken ?? data?.refreshToken ?? refreshToken ?? undefined;
    if (!newAccess) return null;
    accessToken = newAccess;
    refreshToken = newRefresh ?? refreshToken;
    onTokensRefreshed?.({ accessToken: newAccess, refreshToken: refreshToken as string });
    return newAccess;
  } catch {
    return null;
  }
}

api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const m = (response.config.method ?? 'get').toUpperCase();
      // eslint-disable-next-line no-console
      console.log(`[API ✓] ${response.status} ${m} ${response.config.url ?? ''}`);
    }
    return response;
  },
  async (error: AxiosError<{ message?: string; error?: string; code?: string }>) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    const url = original?.url ?? '';
    const isAuthCall =
      url.includes('/auth/login') ||
      url.includes('/auth/refresh') ||
      url.includes('/auth/register');

    if (status === 401 && original && !original._retry && !isAuthCall && refreshToken) {
      original._retry = true;
      try {
        refreshing = refreshing ?? performRefresh();
        const newToken = await refreshing;
        refreshing = null;
        if (newToken) {
          original.headers = original.headers ?? {};
          (original.headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          return api.request(original);
        }
      } catch {
        refreshing = null;
      }
      // Refresh failed → force logout.
      onForceLogout?.();
    }

    return Promise.reject(normalizeError(error));
  },
);

/* ------------------------------------------------------------------ */
/* Typed request helpers — NEVER throw an untyped error                */
/* ------------------------------------------------------------------ */

/**
 * Thin wrapper that guarantees a typed `ApiError` on failure and returns the
 * response `data`. The interceptor already normalises axios errors; this also
 * catches any non-axios throw so call sites only ever see an ApiError.
 */
export async function request<T>(config: AxiosRequestConfig): Promise<T> {
  try {
    const res = await api.request<T>(config);
    return res.data;
  } catch (err) {
    if (isApiError(err)) throw err;
    const fallback: ApiError = {
      status: 0,
      message: 'Something went wrong. Please try again.',
      isNetwork: true,
      raw: err,
    };
    throw fallback;
  }
}

/**
 * Many Kivo endpoints wrap payloads as `{ success, data }`. This unwraps the
 * `data` field when present, otherwise returns the raw body.
 */
export async function requestData<T>(config: AxiosRequestConfig): Promise<T> {
  const body = await request<{ success?: boolean; data?: T } | T>(config);
  if (body && typeof body === 'object' && 'data' in (body as object)) {
    return (body as { data: T }).data;
  }
  return body as T;
}

/* ------------------------------------------------------------------ */
/* Health check                                                        */
/* ------------------------------------------------------------------ */

export interface HealthResult {
  ok: boolean;
  status: number;
  data?: unknown;
}

/** Resolves (never rejects) with `{ ok, status }` so callers can branch simply. */
export async function checkHealth(): Promise<HealthResult> {
  try {
    const res = await api.get('/health', { timeout: 8000 });
    return { ok: res.status >= 200 && res.status < 300, status: res.status, data: res.data };
  } catch (err) {
    return { ok: false, status: isApiError(err) ? err.status : 0 };
  }
}

export default api;
