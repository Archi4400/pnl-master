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
  const closePrice = direction === 'long' ? openPrice + delta : openPrice - delta
  // A price cannot go below zero, so a PnL past pnlAtZeroPrice has no exit.
  return closePrice >= 0 ? closePrice : null
}

/**
 * The PnL if the price went all the way to zero: the most a long can lose and
 * the most a short can make. Past it no close price exists, which the PnL field
 * reports instead of solving for a negative price.
 */
export function pnlAtZeroPrice({
  amount,
  leverage,
  direction,
}: Pick<Position, 'amount' | 'leverage' | 'direction'>): number {
  const notional = amount * leverage
  return direction === 'long' ? -notional : notional
}

/** Whether no close price, not even zero, could produce this PnL. */
export function isPnlReachable(
  position: Pick<Position, 'amount' | 'leverage' | 'direction'>,
  pnl: number,
): boolean {
  const limit = pnlAtZeroPrice(position)
  return position.direction === 'long' ? pnl >= limit : pnl <= limit
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
