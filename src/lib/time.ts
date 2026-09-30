const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['day', 86_400],
  ['hour', 3_600],
  ['minute', 60],
]

/**
 * "5 minutes ago" / "5 хвилин тому": the largest whole unit that fits, which is
 * what a news list needs — the exact timestamp matters less than the freshness.
 */
export function formatRelativeTime(date: Date, now: Date, locale?: string): string {
  const seconds = Math.round((date.getTime() - now.getTime()) / 1000)
  const format = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' })
  for (const [unit, size] of UNITS) {
    if (Math.abs(seconds) >= size) return format.format(Math.trunc(seconds / size), unit)
  }
  return format.format(0, 'minute')
}
