/**
 * Spot position maths: no leverage, no direction — you own the units outright.
 *
 * Everything hangs off the cost basis (what the units cost in total). The
 * average price is only ever that cost divided by the units, which is why
 * averaging is a weighted mean by quantity rather than a plain mean of prices.
 */

export type Holding = {
  /** Units already held. */
  quantity: number
  /** Average price those units were bought at. */
  averagePrice: number
}

export type Purchase = {
  /** Quote currency spent on the new buy. */
  amount: number
  /** Price of the new buy. */
  price: number
}

export type SpotResult = {
  /** Units the new buy adds. */
  boughtQuantity: number
  /** Units held after the buy. */
  quantity: number
  /** Total paid for everything held after the buy. */
  cost: number
  /** Average price after the buy; also the break-even exit. */
  averagePrice: number
  /** How far the buy moved the average, as a percentage of the old one. */
  averageShiftPct: number | null
}

export type SaleResult = {
  /** Proceeds from selling every unit at the sale price. */
  value: number
  pnl: number
  /** Return against the cost basis. */
  roiPct: number | null
}

function isValid(...values: number[]): boolean {
  return values.every((value) => Number.isFinite(value) && value >= 0)
}

/** Units a given spend buys at a given price. Zero when nothing is bought. */
export function quantityFor({ amount, price }: Purchase): number | null {
  if (!isValid(amount, price)) return null
  if (amount === 0) return 0
  // Spending money at a price of zero has no meaningful unit count.
  if (price === 0) return null
  return amount / price
}

/**
 * The position after an optional top-up.
 *
 *   cost     = held * avg + spend
 *   quantity = held + spend / buyPrice
 *   average  = cost / quantity
 *
 * An empty purchase (spend of 0) leaves the holding as it is, so the same call
 * answers "where am I now" and "where will I be after buying".
 */
export function averageAfterPurchase(holding: Holding, purchase: Purchase): SpotResult | null {
  if (!isValid(holding.quantity, holding.averagePrice)) return null
  const boughtQuantity = quantityFor(purchase)
  if (boughtQuantity === null) return null

  const quantity = holding.quantity + boughtQuantity
  // Nothing held and nothing bought: there is no position to average.
  if (quantity === 0) return null

  const cost = holding.quantity * holding.averagePrice + purchase.amount
  const averagePrice = cost / quantity
  const averageShiftPct =
    holding.quantity > 0 && holding.averagePrice > 0
      ? ((averagePrice - holding.averagePrice) / holding.averagePrice) * 100
      : null

  return { boughtQuantity, quantity, cost, averagePrice, averageShiftPct }
}

/** Outcome of selling the whole position at one price. */
export function saleOutcome(
  { quantity, cost }: Pick<SpotResult, 'quantity' | 'cost'>,
  salePrice: number,
): SaleResult | null {
  if (!isValid(quantity, cost, salePrice)) return null
  const value = quantity * salePrice
  const pnl = value - cost
  const roiPct = cost > 0 ? (pnl / cost) * 100 : null
  return { value, pnl, roiPct }
}
