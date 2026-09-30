import { useCallback, useRef, useState } from 'react'

import { parseNumber } from '@/features/calculator/math'
import { syncPair, type PairKeys, type PairSide } from '@/features/calculator/pair'

import { averageAfterPurchase, saleOutcome } from './math'

export type SpotField =
  'quantity' | 'invested' | 'averagePrice' | 'buyQuantity' | 'buyCost' | 'buyPrice' | 'salePrice'

export type SpotValues = Record<SpotField, string>

/** What is held, in units and in USDT, linked by the average price. */
const HOLDING_PAIR: PairKeys<SpotField> = {
  quote: 'invested',
  units: 'quantity',
  price: 'averagePrice',
}

/** The planned buy, in units and in USDT, linked by the buy price. */
const BUY_PAIR: PairKeys<SpotField> = {
  quote: 'buyCost',
  units: 'buyQuantity',
  price: 'buyPrice',
}

type Sources = { holding: PairSide; buy: PairSide }

const SOURCES_DEFAULT: Sources = { holding: 'units', buy: 'units' }

const INITIAL: SpotValues = {
  quantity: '10',
  invested: '1000',
  averagePrice: '100',
  buyQuantity: '10',
  buyCost: '500',
  buyPrice: '50',
  salePrice: '90',
}

/**
 * Each amount can be typed in units or in USDT; the twin follows (see syncPair).
 * The units side is what the maths runs on, since it is always filled in
 * whichever side was typed.
 */
export function useSpotCalculator() {
  const [values, setValues] = useState<SpotValues>(INITIAL)
  // Which side of each pair was typed last. A ref, not state: it only steers the
  // next sync and never needs a render of its own.
  const sources = useRef<Sources>({ ...SOURCES_DEFAULT })

  const setField = useCallback((field: SpotField, raw: string) => {
    if (field === 'quantity') sources.current.holding = 'units'
    if (field === 'invested') sources.current.holding = 'quote'
    if (field === 'buyQuantity') sources.current.buy = 'units'
    if (field === 'buyCost') sources.current.buy = 'quote'
    const { holding, buy } = sources.current

    setValues((current) => {
      const next = { ...current, [field]: raw }
      return syncPair(syncPair(next, HOLDING_PAIR, holding), BUY_PAIR, buy)
    })
  }, [])

  const reset = useCallback(() => {
    sources.current = { ...SOURCES_DEFAULT }
    setValues(INITIAL)
  }, [])

  // An empty buy reads as "no buy", so the panel still shows the current
  // position instead of going blank while the user is typing.
  const holding = {
    quantity: parseNumber(values.quantity) ?? 0,
    averagePrice: parseNumber(values.averagePrice) ?? 0,
  }
  const purchase = {
    quantity: parseNumber(values.buyQuantity) ?? 0,
    price: parseNumber(values.buyPrice) ?? 0,
  }
  const salePrice = parseNumber(values.salePrice)

  const before = averageAfterPurchase(holding, { quantity: 0, price: 0 })
  const after = averageAfterPurchase(holding, purchase)
  const saleAfter = after && salePrice !== null ? saleOutcome(after, salePrice) : null
  const saleBefore = before && salePrice !== null ? saleOutcome(before, salePrice) : null

  return { values, setField, reset, purchase, before, after, saleAfter, saleBefore }
}
