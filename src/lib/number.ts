/**
 * Numbers as typed into, and shown by, the calculators' fields: parsing,
 * the keystroke gate, arrow stepping and display. Shared by every feature, so it
 * lives here rather than in any one calculator.
 */

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

/** What a readout shows when there is nothing to compute yet. */
export const NO_VALUE = '—'

/** A true minus sign: it lines up with "+" in tabular figures, a hyphen does not. */
const MINUS = '−'

/**
 * An amount for reading, grouped for the locale ("1,500.5" / "1 500,5"). Field
 * values stay ungrouped via formatNumber, since grouping would break typing.
 */
export function formatAmount(value: number, locale?: string, maxDecimals = 2): string {
  if (!Number.isFinite(value)) return NO_VALUE
  return new Intl.NumberFormat(locale, { maximumFractionDigits: maxDecimals })
    .format(value)
    .replace('-', MINUS)
}

/**
 * A price for reading: grouped digits, and precision that fits the coin — two
 * decimals for BTC, four significant digits for a coin worth a fraction of a
 * cent, where two decimals would print 0.00.
 */
export function formatPrice(price: number, locale?: string): string {
  if (!Number.isFinite(price)) return NO_VALUE
  const options: Intl.NumberFormatOptions =
    price >= 1000
      ? { maximumFractionDigits: 2 }
      : price >= 1
        ? { maximumFractionDigits: 4 }
        : { maximumSignificantDigits: 4 }
  return new Intl.NumberFormat(locale, options).format(price)
}

/** A gain or loss with its sign always shown: "+300", "−12.5". */
export function formatSigned(value: number, locale?: string, maxDecimals = 2): string {
  const text = formatAmount(Math.abs(value), locale, maxDecimals)
  const rounded = Number(value.toFixed(maxDecimals))
  if (rounded === 0) return text
  return `${rounded > 0 ? '+' : MINUS}${text}`
}
