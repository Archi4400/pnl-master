import { formatNumber, parseNumber } from './number'

/**
 * One amount shown twice: in the quote currency (USDT) and in units of the
 * asset (BTC), linked by a price.
 *
 * Whichever side the user typed last is the source and is never rewritten; the
 * other side is derived from it. That is also what decides the outcome when the
 * price changes afterwards: typing "0.5 BTC" and then editing the price keeps
 * the 0.5 and moves the USDT, while typing "1000 USDT" keeps the 1000.
 */
export type PairSide = 'quote' | 'units'

export type PairKeys<K extends string> = { quote: K; units: K; price: K }

const PAIR_DECIMALS = 8

/**
 * Fill the non-source side of a pair from the source side and the price.
 *
 * Clearing the source clears its twin, so the two never disagree. Without a
 * usable price there is nothing to convert through, and the twin keeps its last
 * value rather than blanking out while the price is being typed.
 */
export function syncPair<K extends string>(
  values: Record<K, string>,
  keys: PairKeys<K>,
  source: PairSide,
): Record<K, string> {
  const target = source === 'quote' ? keys.units : keys.quote
  const raw = values[source === 'quote' ? keys.quote : keys.units]

  if (raw.trim() === '') return { ...values, [target]: '' }

  const amount = parseNumber(raw)
  const price = parseNumber(values[keys.price])
  if (amount === null || price === null || price <= 0) return values

  const converted = source === 'quote' ? amount / price : amount * price
  return { ...values, [target]: formatNumber(converted, PAIR_DECIMALS) }
}
