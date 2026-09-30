import { useCallback, useState } from 'react'

import {
  clampLeverage,
  computeClosePrice,
  computePnl,
  DIRECTION_DEFAULT,
  formatNumber,
  LEVERAGE_DEFAULT,
  parseNumber,
  type Direction,
} from './math'

export type CalculatorField = 'amount' | 'openPrice' | 'closePrice' | 'pnl' | 'leverage'

export type CalculatorValues = Record<CalculatorField, string>

const PRICE_DECIMALS = 8
const PNL_DECIMALS = 2

const INITIAL: CalculatorValues = {
  amount: '1000',
  openPrice: '100',
  closePrice: '110',
  pnl: '100',
  leverage: String(LEVERAGE_DEFAULT),
}

/**
 * Recalculate the one field the user is not currently typing in.
 *
 * Editing the PnL solves for the close price; editing anything else solves for
 * the PnL. The edited field is never rewritten, otherwise the caret would jump
 * mid-keystroke.
 */
function recalculate(
  next: CalculatorValues,
  edited: CalculatorField,
  direction: Direction,
): CalculatorValues {
  const amount = parseNumber(next.amount) ?? 0
  const openPrice = parseNumber(next.openPrice) ?? 0
  const leverage = clampLeverage(parseNumber(next.leverage) ?? LEVERAGE_DEFAULT)

  if (edited === 'pnl') {
    const pnl = parseNumber(next.pnl)
    if (pnl === null) return next
    const closePrice = computeClosePrice({ amount, openPrice, leverage, direction }, pnl)
    if (closePrice === null) return next
    return { ...next, closePrice: formatNumber(closePrice, PRICE_DECIMALS) }
  }

  const closePrice = parseNumber(next.closePrice)
  if (closePrice === null) return next
  const pnl = computePnl({ amount, openPrice, closePrice, leverage, direction })
  if (pnl === null) return next
  return { ...next, pnl: formatNumber(pnl, PNL_DECIMALS) }
}

export function useCalculator() {
  const [values, setValues] = useState<CalculatorValues>(INITIAL)
  const [direction, setDirectionState] = useState<Direction>(DIRECTION_DEFAULT)

  const setField = useCallback(
    (field: CalculatorField, raw: string) => {
      // Leverage is clamped as it is typed rather than on blur, so the field can
      // never display a number the calculation is not actually using.
      const value =
        field === 'leverage' && parseNumber(raw) !== null
          ? String(clampLeverage(parseNumber(raw) as number))
          : raw
      setValues((current) => recalculate({ ...current, [field]: value }, field, direction))
    },
    [direction],
  )

  /**
   * Flipping direction keeps the prices and re-derives the PnL, so the same
   * entry and exit simply change sign — which is the comparison a trader is
   * actually making when they toggle it.
   */
  const setDirection = useCallback((next: Direction) => {
    setDirectionState(next)
    setValues((current) => recalculate(current, 'closePrice', next))
  }, [])

  /** Fill an emptied leverage field back in once focus leaves it. */
  const normalizeLeverage = useCallback(() => {
    setValues((current) => {
      if (parseNumber(current.leverage) !== null) return current
      return recalculate({ ...current, leverage: String(LEVERAGE_DEFAULT) }, 'leverage', direction)
    })
  }, [direction])

  const reset = useCallback(() => {
    setValues(INITIAL)
    setDirectionState(DIRECTION_DEFAULT)
  }, [])

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

  return { values, direction, setDirection, setField, normalizeLeverage, reset, parsed }
}
