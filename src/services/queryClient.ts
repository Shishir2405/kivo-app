/**
 * The single TanStack Query client for Kivo.
 *
 * Sensible defaults: retry once (network blips are common on mobile), a short
 * stale window, and refetch disabled on window focus (no web "focus" on RN).
 * Errors are already normalised to `ApiError` by the api client, so query/
 * mutation `error` fields are typed `ApiError` at call sites.
 */
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

export default queryClient;
