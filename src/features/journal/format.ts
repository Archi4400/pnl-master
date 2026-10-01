import type { Big } from 'big.js'

import { formatAmount, formatPrice, formatSigned } from '@/lib/number'

/**
 * Quote assets worth about a unit of fiat, where two decimals are the natural
 * precision. Anything else (BTC, ETH, BNB as quote) needs up to eight, or a
 * 0.00012 BTC trade would print as 0.
 */
const FIAT_LIKE = new Set([
  'USDT',
  'USDC',
  'FDUSD',
  'TUSD',
  'BUSD',
  'USDP',
  'DAI',
  'AEUR',
  'EURI',
  'EUR',
  'GBP',
  'TRY',
  'BRL',
  'AUD',
  'RUB',
  'UAH',
  'NGN',
  'ZAR',
  'PLN',
  'RON',
  'ARS',
  'MXN',
  'COP',
  'CZK',
  'JPY',
  'IDRT',
  'BIDR',
])

export function quoteDecimals(quote: string): number {
  return FIAT_LIKE.has(quote) ? 2 : 8
}

type Numeric = Big | number | string

function toNumber(value: Numeric): number {
  return typeof value === 'number' ? value : Number(value.toString())
}

/** An amount of the quote asset, at the precision that asset needs. */
export function formatMoney(value: Numeric, quote: string, locale?: string): string {
  return formatAmount(toNumber(value), locale, quoteDecimals(quote))
}

/**
 * A unit price. Unlike money it keeps significant digits, so a coin trading
 * under a dollar shows 0.1026 rather than 0.1.
 */
export function formatUnitPrice(value: Numeric, locale?: string): string {
  return formatPrice(toNumber(value), locale)
}

/** A signed quote amount (PnL). */
export function formatMoneySigned(value: Numeric, quote: string, locale?: string): string {
  return formatSigned(toNumber(value), locale, quoteDecimals(quote))
}

/**
 * A base-asset quantity, with precision that shrinks as the amount grows:
 * 0.0361819 BTC needs all its decimals, 10,039.29 ADA does not need eight.
 */
export function formatQty(value: Numeric, locale?: string): string {
  const number = toNumber(value)
  const size = Math.abs(number)
  return formatAmount(number, locale, size >= 1000 ? 2 : size >= 1 ? 4 : 8)
}

/** A trade's local date and time; the CSV is UTC, the reader is not. */
export function formatDateTime(time: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short' }).format(time)
}

export function formatDate(time: number, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(time)
}
