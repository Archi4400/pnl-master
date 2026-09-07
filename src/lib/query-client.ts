import { QueryClient } from '@tanstack/react-query'

/**
 * A single client for the whole app.
 *
 * Nothing queries yet — the calculator is pure client-side maths. This stays
 * wired up for the first thing that does talk to a server (saving or loading
 * calculations), since the provider has to sit above the router either way.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})
