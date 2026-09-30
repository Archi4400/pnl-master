import { cn } from '@/lib/utils'

import { ICON_SYMBOLS } from './icon-symbols'

/** Pinned so a new release can never swap icons or break paths under us. */
const ICON_VERSION = '0.18.1'
const ICON_BASE = `https://cdn.jsdelivr.net/npm/cryptocurrency-icons@${ICON_VERSION}/32@2x`

type CoinIconProps = {
  symbol: string
  /** Rendered size in px; the source is 64px, sharp up to 32px on 2× screens. */
  size?: number
  className?: string
}

/**
 * Monochrome coin mark from spothq/cryptocurrency-icons: black on the light
 * theme, white on the dark one. Both images are in the markup and CSS shows the
 * right one, so switching theme never waits on a request or a re-render.
 *
 * Coins the set does not cover get a lettered disc instead of a broken image.
 */
export function CoinIcon({ symbol, size = 20, className }: CoinIconProps) {
  const style = { width: size, height: size }

  if (!ICON_SYMBOLS.has(symbol)) {
    return (
      <span
        aria-hidden
        style={{ ...style, fontSize: Math.round(size * 0.45) }}
        className={cn(
          'border-content text-content inline-flex shrink-0 items-center justify-center rounded-full border font-mono font-semibold',
          className,
        )}
      >
        {symbol.slice(0, 1)}
      </span>
    )
  }

  const file = `${symbol.toLowerCase()}@2x.png`
  return (
    <span aria-hidden className={cn('inline-flex shrink-0', className)} style={style}>
      <img
        src={`${ICON_BASE}/black/${file}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="dark:hidden"
      />
      <img
        src={`${ICON_BASE}/white/${file}`}
        alt=""
        width={size}
        height={size}
        loading="lazy"
        className="hidden dark:block"
      />
    </span>
  )
}
