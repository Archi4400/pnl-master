import { queryOptions } from '@tanstack/react-query'

import { fetchTransactions } from './api'

/**
 * Declaring queries as shared options objects keeps the key and the fetcher in
 * one place. Any component can call useQuery(transactionsQuery()) and they all
 * hit the same cache entry — and the key is typed, so typos surface at build.
 */
export function transactionsQuery() {
  return queryOptions({
    queryKey: ['transactions'] as const,
    queryFn: fetchTransactions,
  })
}
