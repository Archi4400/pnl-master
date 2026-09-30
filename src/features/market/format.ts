import { formatNumber } from '@/lib/number'
import { signedTone } from '@/lib/tone'

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

/** Colour for a 24h move: green up, red down, muted when flat or unknown. */
export function changeTone(changePct: number | undefined): string {
  return signedTone(changePct, { flat: 0.005 }) ?? 'text-content-muted'
}
