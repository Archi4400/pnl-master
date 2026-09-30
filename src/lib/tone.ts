/**
 * Text colour for a signed result.
 *
 * `surface` picks the palette: the inverted results slab flips the ground, so
 * it needs its own green and red to keep contrast. `lowerIsBetter` is for
 * numbers where falling is good news, like a holder's average buy price.
 * Anything within `flat` of zero reads as neutral rather than a colour.
 */
export function signedTone(
  value: number | null | undefined,
  {
    surface = 'page',
    lowerIsBetter = false,
    flat = 0,
  }: { surface?: 'page' | 'invert'; lowerIsBetter?: boolean; flat?: number } = {},
): string | undefined {
  if (value === null || value === undefined || Math.abs(value) <= flat) return undefined
  const good = lowerIsBetter ? value < 0 : value > 0
  if (surface === 'invert') return good ? 'text-profit-invert' : 'text-loss-invert'
  return good ? 'text-profit' : 'text-loss'
}
