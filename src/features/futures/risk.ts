import type { Direction } from './math'

export type RiskLevel = 'calm' | 'elevated' | 'high' | 'extreme'

/** Notional value actually exposed to the market. */
export function positionSize(amount: number, leverage: number): number {
  return amount * leverage
}

/**
 * How far the price has to move against the position to wipe the margin,
 * as a percentage.
 *
 * At L× leverage the margin is 1/L of the notional, so a 100/L % move against
 * you consumes it. This is deliberately the simple form: real liquidation
 * arrives *sooner* because maintenance margin, fees and funding all eat into
 * the buffer. Treat it as a ceiling, not a promise.
 */
export function liquidationMovePct(leverage: number): number | null {
  if (!Number.isFinite(leverage) || leverage <= 0) return null
  return 100 / leverage
}

/**
 * The price that move corresponds to.
 *
 * A long is liquidated on the way down, a short on the way up — so direction
 * flips which side of the entry the level sits on.
 */
export function liquidationPrice(
  openPrice: number,
  leverage: number,
  direction: Direction,
): number | null {
  const movePct = liquidationMovePct(leverage)
  if (movePct === null || !Number.isFinite(openPrice) || openPrice <= 0) return null
  const factor = direction === 'long' ? 1 - movePct / 100 : 1 + movePct / 100
  return openPrice * factor
}

/** Return on the margin actually put up, not on the notional. */
export function roiPct(pnl: number, amount: number): number | null {
  if (!Number.isFinite(pnl) || !Number.isFinite(amount) || amount === 0) return null
  return (pnl / amount) * 100
}

/** Coarse banding used to colour the risk readout. */
export function riskLevel(leverage: number): RiskLevel {
  if (leverage <= 3) return 'calm'
  if (leverage <= 10) return 'elevated'
  if (leverage <= 50) return 'high'
  return 'extreme'
}
