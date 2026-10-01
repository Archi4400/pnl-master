import { cn } from '@/lib/utils'

import { Hint } from './hint'

type SpecRowProps = {
  label: string
  value: React.ReactNode
  /** Optional second line under the value. */
  note?: React.ReactNode
  /** Longer explanation behind a "?" next to the label. */
  tooltip?: string
  /** "invert" for rows on the inverted results slab. */
  tone?: 'default' | 'invert'
  className?: string
}

/** Monospace label left, value right, hairline above — the reference's spec list. */
export function SpecRow({
  label,
  value,
  note,
  tooltip,
  tone = 'default',
  className,
}: SpecRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t py-3.5',
        tone === 'invert' ? 'border-content-invert/15' : 'border-line',
        className,
      )}
    >
      <dt className="text-content-faint flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
        {label}
        {tooltip ? <Hint label={label}>{tooltip}</Hint> : null}
      </dt>
      <dd className="flex flex-col items-end text-right">
        <span className="tabular-nums">{value}</span>
        {note ? <span className="text-content-faint text-xs">{note}</span> : null}
      </dd>
    </div>
  )
}
