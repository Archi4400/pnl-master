import { transactionListSchema, type Transaction } from './schema'

const MOCK_ROWS: unknown[] = [
  { id: 't1', date: '2026-08-02', label: 'Client retainer', amount: 4200 },
  { id: 't2', date: '2026-08-05', label: 'Cloud hosting', amount: -318.4 },
  { id: 't3', date: '2026-08-11', label: 'Design contract', amount: 1750 },
  { id: 't4', date: '2026-08-17', label: 'Software licences', amount: -246.9 },
  { id: 't5', date: '2026-08-23', label: 'Workshop fee', amount: 900 },
  { id: 't6', date: '2026-08-29', label: 'Office rent', amount: -1200 },
]

/**
 * Stands in for a real HTTP call. Swap the body for fetch() later — the query
 * layer above does not need to change, only this function does.
 */
export async function fetchTransactions(): Promise<Transaction[]> {
  await new Promise((resolve) => setTimeout(resolve, 400))
  return transactionListSchema.parse(MOCK_ROWS)
}
