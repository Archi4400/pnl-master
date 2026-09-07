import { useCallback, useState } from 'react'

import {
  clampLeverage,
  computeClosePrice,
  computePnl,
  formatNumber,
  LEVERAGE_DEFAULT,
  parseNumber,
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
function recalculate(next: CalculatorValues, edited: CalculatorField): CalculatorValues {
  const amount = parseNumber(next.amount) ?? 0
  const openPrice = parseNumber(next.openPrice) ?? 0
  const leverage = clampLeverage(parseNumber(next.leverage) ?? LEVERAGE_DEFAULT)

  if (edited === 'pnl') {
    const pnl = parseNumber(next.pnl)
    if (pnl === null) return next
    const closePrice = computeClosePrice({ amount, openPrice, leverage }, pnl)
    if (closePrice === null) return next
    return { ...next, closePrice: formatNumber(closePrice, PRICE_DECIMALS) }
  }

  const closePrice = parseNumber(next.closePrice)
  if (closePrice === null) return next
  const pnl = computePnl({ amount, openPrice, closePrice, leverage })
  if (pnl === null) return next
  return { ...next, pnl: formatNumber(pnl, PNL_DECIMALS) }
}

export function useCalculator() {
  const [values, setValues] = useState<CalculatorValues>(INITIAL)

  const setField = useCallback((field: CalculatorField, raw: string) => {
    // Leverage is clamped as it is typed rather than on blur, so the field can
    // never display a number the calculation is not actually using.
    const value =
      field === 'leverage' && parseNumber(raw) !== null
        ? String(clampLeverage(parseNumber(raw) as number))
        : raw
    setValues((current) => recalculate({ ...current, [field]: value }, field))
  }, [])

  /** Fill an emptied leverage field back in once focus leaves it. */
  const normalizeLeverage = useCallback(() => {
    setValues((current) => {
      if (parseNumber(current.leverage) !== null) return current
      return recalculate({ ...current, leverage: String(LEVERAGE_DEFAULT) }, 'leverage')
    })
  }, [])

  const reset = useCallback(() => setValues(INITIAL), [])

  const pnlValue = parseNumber(values.pnl)

  return { values, setField, normalizeLeverage, reset, pnlValue }
}
