import { useCallback, useState } from 'react'

import { parseNumber } from '@/features/calculator/math'

import { averageAfterPurchase, saleOutcome } from './math'

export type SpotField = 'quantity' | 'averagePrice' | 'buyAmount' | 'buyPrice' | 'salePrice'

export type SpotValues = Record<SpotField, string>

const INITIAL: SpotValues = {
  quantity: '10',
  averagePrice: '100',
  buyAmount: '500',
  buyPrice: '50',
  salePrice: '90',
}

/**
 * Spot has no field solved from another, so unlike the futures form every input
 * stays exactly as typed and all outputs are derived on render.
 */
export function useSpotCalculator() {
  const [values, setValues] = useState<SpotValues>(INITIAL)

  const setField = useCallback((field: SpotField, raw: string) => {
    setValues((current) => ({ ...current, [field]: raw }))
  }, [])

  const reset = useCallback(() => setValues(INITIAL), [])

  // An empty buy reads as "no buy", so the panel still shows the current
  // position instead of going blank while the user is typing.
  const holding = {
    quantity: parseNumber(values.quantity) ?? 0,
    averagePrice: parseNumber(values.averagePrice) ?? 0,
  }
  const purchase = {
    amount: parseNumber(values.buyAmount) ?? 0,
    price: parseNumber(values.buyPrice) ?? 0,
  }
  const salePrice = parseNumber(values.salePrice)

  const before = averageAfterPurchase(holding, { amount: 0, price: 0 })
  const after = averageAfterPurchase(holding, purchase)
  const saleAfter = after && salePrice !== null ? saleOutcome(after, salePrice) : null
  const saleBefore = before && salePrice !== null ? saleOutcome(before, salePrice) : null

  return { values, setField, reset, before, after, saleAfter, saleBefore }
}
