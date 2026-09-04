import { QueryClient } from '@tanstack/react-query'

/**
 * A single client for the whole app.
 *
 * Coming from Vue: this is roughly Pinia for *server* state. The cache is keyed
 * by queryKey, so two components asking for the same key share one request and
 * one cache entry — no manual store wiring.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // How long fetched data counts as fresh. Within this window remounting a
      // component reads the cache instead of hitting the network again.
      staleTime: 60_000,
      // How long unused data lingers before garbage collection.
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
