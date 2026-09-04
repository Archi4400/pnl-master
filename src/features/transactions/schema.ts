import { z } from 'zod'

/**
 * Parse API payloads instead of trusting them. `z.infer` then gives us the
 * TypeScript type for free, so the runtime check and the static type can never
 * drift apart.
 */
export const transactionSchema = z.object({
  id: z.string(),
  date: z.string(),
  label: z.string(),
  // Positive means income, negative means expense.
  amount: z.number(),
})

export const transactionListSchema = z.array(transactionSchema)

export type Transaction = z.infer<typeof transactionSchema>
