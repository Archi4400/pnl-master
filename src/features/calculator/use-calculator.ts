import { useCallback, useState } from 'react'

import {
  FUTURES_INITIAL,
  futuresFromInputs,
  futuresToInputs,
  normalizeFuturesLeverage,
  setFuturesDirection,
  setFuturesField,
  type FuturesField,
  type FuturesInputs,
} from './futures-state'
import { clampLeverage, LEVERAGE_DEFAULT, parseNumber, type Direction } from './math'

export type { FuturesField as CalculatorField } from './futures-state'

/**
 * React binding for the futures form. All the rules live in futures-state.ts;
 * this only holds the state and hands out stable callbacks.
 */
export function useCalculator(initial?: FuturesInputs) {
  const [state, setState] = useState(() => (initial ? futuresFromInputs(initial) : FUTURES_INITIAL))

  const setField = useCallback((field: FuturesField, raw: string) => {
    setState((current) => setFuturesField(current, field, raw))
  }, [])

  const setDirection = useCallback((direction: Direction) => {
    setState((current) => setFuturesDirection(current, direction))
  }, [])

  const normalizeLeverage = useCallback(() => setState(normalizeFuturesLeverage), [])

  const reset = useCallback(() => setState(FUTURES_INITIAL), [])

  /** Replace the whole form, e.g. from a saved calculation. */
  const load = useCallback((inputs: FuturesInputs) => setState(futuresFromInputs(inputs)), [])

  const { values, direction } = state

  /**
   * The same strings parsed into numbers, so the risk readouts do not each have
   * to re-parse them. Missing input reads as 0 rather than blowing up the panel.
   */
  const parsed = {
    amount: parseNumber(values.amount) ?? 0,
    openPrice: parseNumber(values.openPrice) ?? 0,
    closePrice: parseNumber(values.closePrice) ?? 0,
    pnl: parseNumber(values.pnl) ?? 0,
    leverage: clampLeverage(parseNumber(values.leverage) ?? LEVERAGE_DEFAULT),
  }

  return {
    values,
    direction,
    parsed,
    inputs: futuresToInputs(state),
    setField,
    setDirection,
    normalizeLeverage,
    reset,
    load,
  }
}

export type FuturesCalculator = ReturnType<typeof useCalculator>
