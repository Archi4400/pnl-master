export const LEVERAGE_MIN = 1
export const LEVERAGE_MAX = 500
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
 * Leverage is clamped to [1, 500].
 *
 * The brief said "not negative, max 500". The floor is 1 rather than 0 because a
 * leverage of 0 zeroes the position: PnL is stuck at 0 and the close price can no
 * longer be solved from it, which would silently break the field.
 */
export function clampLeverage(value: number): number {
  if (!Number.isFinite(value)) return LEVERAGE_DEFAULT
  return Math.min(LEVERAGE_MAX, Math.max(LEVERAGE_MIN, value))
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

/** Render a computed value for display, trimming trailing zeros. */
export function formatNumber(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return ''
  return String(Number(value.toFixed(decimals)))
}
