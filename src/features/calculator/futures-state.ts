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
import { syncPair, type PairKeys, type PairSide } from './pair'

/**
 * The futures form as plain data plus pure transitions, kept out of the hook so
 * the rules can be tested without rendering and so one state object replaces
 * the refs the hook used to juggle.
 */

export type FuturesField =
  'amount' | 'amountUnits' | 'openPrice' | 'closePrice' | 'pnl' | 'leverage'

export type FuturesValues = Record<FuturesField, string>

export type FuturesState = {
  values: FuturesValues
  direction: Direction
  /** Which side of the margin pair was typed last; the other side follows it. */
  amountSource: PairSide
}

/**
 * The minimum that reproduces a position: everything else is derived. This is
 * what share links and saved calculations carry, so they stay short and can
 * never disagree with themselves.
 */
export type FuturesInputs = {
  direction: Direction
  amountSource: PairSide
  /** The margin, in USDT or in units depending on amountSource. */
  amount: string
  openPrice: string
  closePrice: string
  leverage: string
}

const PRICE_DECIMALS = 8
const PNL_DECIMALS = 2

/** The margin in USDT and the same margin in units of the asset, at the open price. */
const AMOUNT_PAIR: PairKeys<FuturesField> = {
  quote: 'amount',
  units: 'amountUnits',
  price: 'openPrice',
}

export const FUTURES_INITIAL: FuturesState = {
  values: {
    amount: '1000',
    amountUnits: '10',
    openPrice: '100',
    closePrice: '110',
    pnl: '100',
    leverage: String(LEVERAGE_DEFAULT),
  },
  direction: DIRECTION_DEFAULT,
  amountSource: 'quote',
}

/**
 * Recalculate the one field the user is not currently typing in.
 *
 * The margin pair is synced first, so the PnL maths below always sees the USDT
 * amount that matches the units. Then editing the PnL solves for the close
 * price; editing anything else solves for the PnL. The edited field is never
 * rewritten, otherwise the caret would jump mid-keystroke.
 */
function recalculate(
  input: FuturesValues,
  edited: FuturesField,
  direction: Direction,
  amountSource: PairSide,
): FuturesValues {
  const next = syncPair(input, AMOUNT_PAIR, amountSource)
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

export function setFuturesField(
  state: FuturesState,
  field: FuturesField,
  raw: string,
): FuturesState {
  // Leverage is clamped as it is typed rather than on blur, so the field can
  // never display a number the calculation is not actually using.
  const parsed = parseNumber(raw)
  const value = field === 'leverage' && parsed !== null ? String(clampLeverage(parsed)) : raw

  const amountSource: PairSide =
    field === 'amount' ? 'quote' : field === 'amountUnits' ? 'units' : state.amountSource

  return {
    ...state,
    amountSource,
    values: recalculate({ ...state.values, [field]: value }, field, state.direction, amountSource),
  }
}

/**
 * Flipping direction keeps the prices and re-derives the PnL, so the same entry
 * and exit simply change sign — which is the comparison a trader is actually
 * making when they toggle it.
 */
export function setFuturesDirection(state: FuturesState, direction: Direction): FuturesState {
  return {
    ...state,
    direction,
    values: recalculate(state.values, 'closePrice', direction, state.amountSource),
  }
}

/** Fill an emptied leverage field back in once focus leaves it. */
export function normalizeFuturesLeverage(state: FuturesState): FuturesState {
  if (parseNumber(state.values.leverage) !== null) return state
  return setFuturesField(state, 'leverage', String(LEVERAGE_DEFAULT))
}

export function futuresFromInputs(inputs: FuturesInputs): FuturesState {
  const amountField = inputs.amountSource === 'quote' ? 'amount' : 'amountUnits'
  const values: FuturesValues = {
    ...FUTURES_INITIAL.values,
    [amountField]: inputs.amount,
    openPrice: inputs.openPrice,
    closePrice: inputs.closePrice,
    leverage: inputs.leverage,
  }
  return {
    direction: inputs.direction,
    amountSource: inputs.amountSource,
    // Solving from the close price fills in the other margin side and the PnL.
    values: recalculate(values, 'closePrice', inputs.direction, inputs.amountSource),
  }
}

export function futuresToInputs({ values, direction, amountSource }: FuturesState): FuturesInputs {
  return {
    direction,
    amountSource,
    amount: amountSource === 'quote' ? values.amount : values.amountUnits,
    openPrice: values.openPrice,
    closePrice: values.closePrice,
    leverage: values.leverage,
  }
}
