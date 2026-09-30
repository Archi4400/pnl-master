import { cn } from '@/lib/utils'

type SectionLabelProps = {
  /** Two-digit section number, e.g. "01". */
  index?: string
  children: React.ReactNode
  className?: string
}

/**
 * The reference's section eyebrow: a lime dot, a monospace number, then a
 * letterspaced uppercase label. The number is real structure — it marks the
 * order of the sections — so it is worth keeping rather than decoration.
 */
export function SectionLabel({ index, children, className }: SectionLabelProps) {
  return (
    <p
      className={cn(
        'flex items-center gap-2.5 font-mono text-[11px] tracking-[0.18em] text-content-faint uppercase',
        className,
      )}
    >
      <span className="size-1.5 shrink-0 rounded-full bg-lime animate-pulse-dot" aria-hidden />
      {index ? <span className="text-content">{index}</span> : null}
      <span>{children}</span>
    </p>
  )
}
