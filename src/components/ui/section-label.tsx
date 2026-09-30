import { cn } from '@/lib/utils'

type SectionLabelProps = {
  /** Two-digit section number, e.g. "01". */
  index?: string
  children: React.ReactNode
  /** "invert" for labels on the inverted slab, where the page's ink is invisible. */
  tone?: 'default' | 'invert'
  className?: string
}

/**
 * The reference's section eyebrow: a lime dot, a monospace number, then a
 * letterspaced uppercase label. The number is real structure — it marks the
 * order of the sections — so it is worth keeping rather than decoration.
 */
export function SectionLabel({ index, children, tone = 'default', className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        'text-content-faint flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] uppercase',
        className,
      )}
    >
      <span className="bg-lime animate-pulse-dot size-1.5 shrink-0 rounded-full" aria-hidden />
      {index ? (
        <span className={tone === 'invert' ? 'text-content-invert' : 'text-content'}>{index}</span>
      ) : null}
      <span>{children}</span>
    </p>
  )
}
