import { useCallback, useState } from 'react'

import { parseNumber } from '@/lib/number'

import { averageAfterPurchase, saleOutcome } from './math'
import {
  setSpotField,
  SPOT_INITIAL,
  spotFromInputs,
  spotToInputs,
  type SpotField,
  type SpotInputs,
} from './spot-state'

/**
 * React binding for the spot form. The field rules live in spot-state.ts; the
 * results are derived on render from the units side of each pair, since that is
 * always filled in whichever side was typed.
 */
export function useSpotCalculator(initial?: SpotInputs) {
  const [state, setState] = useState(() => (initial ? spotFromInputs(initial) : SPOT_INITIAL))

  const setField = useCallback((field: SpotField, raw: string) => {
    setState((current) => setSpotField(current, field, raw))
  }, [])

  const reset = useCallback(() => setState(SPOT_INITIAL), [])

  /** Replace the whole form, e.g. from a saved calculation. */
  const load = useCallback((inputs: SpotInputs) => setState(spotFromInputs(inputs)), [])

  const { values } = state

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

  return {
    values,
    inputs: spotToInputs(state),
    setField,
    reset,
    load,
    purchase,
    before,
    after,
    saleAfter,
    saleBefore,
  }
}

export type SpotCalculatorState = ReturnType<typeof useSpotCalculator>
