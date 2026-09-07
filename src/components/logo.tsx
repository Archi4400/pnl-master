import { cn } from '@/lib/utils'

type LogoIconProps = {
  /** Wrap the glyph in a dark tile — the only form that reads on both themes. */
  tile?: boolean
  /** Rendered size in pixels. The glyph scales with it. */
  size?: number
  /**
   * Hide from assistive tech. Set this when the wordmark sits next to the icon,
   * otherwise screen readers announce the brand name twice.
   */
  decorative?: boolean
}

export function LogoIcon({ tile = false, size = 40, decorative = false }: LogoIconProps) {
  const a11y = decorative
    ? ({ 'aria-hidden': true } as const)
    : ({ role: 'img', 'aria-label': 'PnL Master' } as const)

  // Untiled, the stem takes the surrounding text colour so the mark survives a
  // theme flip. Tiled, the ground is always dark, so the stem stays cream.
  const glyph = (stemClass: string) => (
    <g>
      <rect x="0" y="0" width="8" height="36" className={stemClass} />
      <path
        d="M4 4 H16 a10 10 0 0 1 0 20 H4"
        fill="none"
        strokeWidth="8"
        className="stroke-lime"
      />
    </g>
  )

  if (!tile) {
    return (
      <svg width={size * 0.833} height={size} viewBox="0 0 30 36" {...a11y}>
        {glyph('fill-current')}
      </svg>
    )
  }

  return (
    <svg width={size} height={size} viewBox="0 0 64 64" {...a11y}>
      <rect width="64" height="64" rx="15" className="fill-ink-block" />
      <g transform="translate(17 14)">{glyph('fill-cream')}</g>
    </svg>
  )
}

type LogoProps = {
  /** Drop the wordmark and render the icon alone. */
  iconOnly?: boolean
  /** Wrap the icon in a dark tile. */
  tile?: boolean
  /** Icon size in pixels; the wordmark scales alongside it. */
  size?: number
  className?: string
}

/**
 * Full lockup: icon, "PnL" in lime, "Master" in the surrounding text colour, both
 * sitting on a lime rule.
 *
 * The rule is a bottom border on the wrapper rather than a drawn rectangle, so it
 * always matches the rendered text width exactly — the SVG files in public/brand/
 * have to estimate that width from font metrics; this does not.
 */
export function Logo({ iconOnly = false, tile = true, size = 40, className }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-3', className)} translate="no">
      <LogoIcon tile={tile} size={size} decorative={!iconOnly} />

      {!iconOnly && (
        <span className="font-bold leading-none tracking-tight" style={{ fontSize: size * 0.68 }}>
          <span className="inline-block border-b-[0.2em] border-lime pb-[0.12em]">
            <span className="text-lime">PnL</span> <span className="text-content">Master</span>
          </span>
        </span>
      )}
    </span>
  )
}
