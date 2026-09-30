import { formatNumber } from '@/features/calculator/math'

/**
 * A price for reading: grouped digits, and precision that fits the coin — two
 * decimals for BTC, four significant digits for a coin worth a fraction of a
 * cent, where two decimals would print 0.00.
 */
export function formatPrice(price: number, locale?: string): string {
  const options: Intl.NumberFormatOptions =
    price >= 1000
      ? { maximumFractionDigits: 2 }
      : price >= 1
        ? { maximumFractionDigits: 4 }
        : { maximumSignificantDigits: 4 }
  return new Intl.NumberFormat(locale, options).format(price)
}

/** A price as a field value: no grouping, full precision, trailing zeros trimmed. */
export function priceToField(price: number): string {
  return formatNumber(price, 8)
}

/** "+1.23%" / "−0.40%", with a real minus sign to match the rest of the UI. */
export function formatChange(changePct: number): string {
  const rounded = Math.abs(changePct) < 0.005 ? 0 : changePct
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toFixed(2)}%`
}

/** Colour for a 24h move: green up, red down, neutral when flat or unknown. */
export function changeTone(changePct: number | undefined): string {
  if (changePct === undefined || Math.abs(changePct) < 0.005) return 'text-content-muted'
  return changePct > 0 ? 'text-profit' : 'text-loss'
}
