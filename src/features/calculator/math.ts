export const LEVERAGE_MIN = 1
/**
 * Where the slider tops out. Typed leverage may go past it — the slider then
 * just sits full — because the range that matters for dragging is far below the
 * extremes a few exchanges offer.
 */
export const LEVERAGE_SLIDER_MAX = 200
export const LEVERAGE_DEFAULT = 1

export type Direction = 'long' | 'short'

export const DIRECTION_DEFAULT: Direction = 'long'

export type Position = {
  amount: number
  openPrice: number
  closePrice: number
  leverage: number
  direction: Direction
}

/**
 * Profit/loss of a position.
 *
 *   units = amount * leverage / openPrice
 *   pnl   = units * priceMove
 *
 * The only thing direction changes is the sign of the move: a long earns when
 * the price rises, a short when it falls. Returns null when the inputs cannot
 * describe a position — an open price of zero has no units to trade.
 */
export function computePnl({
  amount,
  openPrice,
  closePrice,
  leverage,
  direction,
}: Position): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(openPrice) || !Number.isFinite(closePrice)) {
    return null
  }
  if (openPrice <= 0) return null
  const move = direction === 'long' ? closePrice - openPrice : openPrice - closePrice
  return (amount * leverage * move) / openPrice
}

/**
 * The inverse: which close price produces a given profit/loss.
 *
 * Editing the PnL field solves for the close price, because the other three
 * inputs describe a position the user has already opened — only the exit is
 * still open to question.
 */
export function computeClosePrice(
  { amount, openPrice, leverage, direction }: Omit<Position, 'closePrice'>,
  pnl: number,
): number | null {
  if (!Number.isFinite(amount) || !Number.isFinite(openPrice) || !Number.isFinite(pnl)) {
    return null
  }
  if (openPrice <= 0) return null
  const notional = amount * leverage
  // With nothing at stake every close price yields the same zero PnL, so the
  // question has no single answer.
  if (notional === 0) return null
  const delta = (pnl / notional) * openPrice
  return direction === 'long' ? openPrice + delta : openPrice - delta
}

/**
 * Leverage has a floor of 1 and no ceiling.
 *
 * The floor is 1 rather than 0 because a leverage of 0 zeroes the position: PnL
 * is stuck at 0 and the close price can no longer be solved from it, which would
 * silently break the field. Only the slider has an upper end
 * (LEVERAGE_SLIDER_MAX); a typed value is taken as it is.
 */
export function clampLeverage(value: number): number {
  if (!Number.isFinite(value)) return LEVERAGE_DEFAULT
  return Math.max(LEVERAGE_MIN, value)
}

/** Parse a typed value, accepting a comma as the decimal separator. */
export function parseNumber(raw: string): number | null {
  const normalized = raw.trim().replace(',', '.')
  if (normalized === '' || normalized === '-' || normalized === '.') return null
  const parsed = Number(normalized)
  return Number.isFinite(parsed) ? parsed : null
}

const NUMBER_INPUT = /^\d*[.,]?\d*$/
const SIGNED_NUMBER_INPUT = /^-?\d*[.,]?\d*$/

/**
 * Gate for what a number field may contain while it is being typed.
 *
 * Returns the cleaned text, or null to reject the keystroke and keep the field
 * as it was. Partial input like "", "-" or "12." has to pass, otherwise nobody
 * could type their way to a real number. Whitespace is dropped so a pasted
 * "1 000" still lands; letters, a second separator or "1e5" do not.
 */
export function sanitizeNumberInput(
  raw: string,
  { allowNegative = false }: { allowNegative?: boolean } = {},
): string | null {
  const cleaned = raw.replace(/\s/g, '')
  const pattern = allowNegative ? SIGNED_NUMBER_INPUT : NUMBER_INPUT
  return pattern.test(cleaned) ? cleaned : null
}

const MAX_STEP_DECIMALS = 8

/** Digits after the decimal separator as typed, so "12.50" counts as 2. */
function typedDecimals(raw: string): number {
  const separator = raw.search(/[.,]/)
  if (separator === -1) return 0
  return Math.min(MAX_STEP_DECIMALS, raw.length - separator - 1)
}

/**
 * Nudge a typed number up or down, as the field's arrows and arrow keys do.
 *
 * Without an explicit step it moves the last digit the user typed: "100" steps
 * by 1, "12.5" by 0.1, "0.020" by 0.001. That scales to any asset — a BTC price
 * and a memecoin price both step at the precision they were entered with —
 * where a fixed step would be useless for one of them. The result keeps that
 * precision too, so "12.50" goes to "12.51" rather than "12.51000000001".
 */
export function stepNumber(
  raw: string,
  direction: 1 | -1,
  {
    step,
    multiplier = 1,
    allowNegative = false,
  }: { step?: number; multiplier?: number; allowNegative?: boolean } = {},
): string {
  // An explicit step never rounds away what was typed: 10.5 + 1 is 11.5, not 12.
  const decimals =
    step === undefined
      ? typedDecimals(raw)
      : Math.max(typedDecimals(raw), typedDecimals(String(step)))
  const size = (step ?? 10 ** -decimals) * multiplier
  const next = (parseNumber(raw) ?? 0) + direction * size
  const bounded = allowNegative ? next : Math.max(0, next)
  // toFixed can print "-0.00" for a tiny negative float; normalise it.
  return (bounded === 0 ? 0 : bounded).toFixed(decimals)
}

/** Render a computed value for display, trimming trailing zeros. */
export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Number(value.toFixed(decimals)))
}
