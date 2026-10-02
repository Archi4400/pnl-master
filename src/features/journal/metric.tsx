import { Hint } from '@/components/ui/hint'
import { cn } from '@/lib/utils'

/** A titled card around a chart or table. */
export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'rounded-card border-line bg-surface-raised flex flex-col gap-4 border p-5 sm:p-6',
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold tracking-tight">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  )
}

export type MetricRow = {
  label: string
  value: React.ReactNode
  /** Small line under the value. */
  note?: React.ReactNode
  /** A "?" next to the label that explains it. */
  hint?: React.ReactNode
}

/**
 * One tile holding related figures (invested and equity, received and realized
 * PnL), each with its own label, split by a hairline. Self-contained: it renders
 * its own <dl>, so it sits in any grid, not only inside a list.
 */
export function MetricGroup({
  rows,
  compact = false,
  className,
}: {
  rows: MetricRow[]
  /** One line per figure, label left and value right: for dense summaries. */
  compact?: boolean
  className?: string
}) {
  return (
    <dl
      className={cn(
        'border-line bg-surface-raised divide-line flex flex-col divide-y rounded-2xl border px-4',
        compact && 'py-1',
        className,
      )}
    >
      {rows.map((row) =>
        compact ? (
          <div key={row.label} className="flex items-baseline justify-between gap-3 py-2.5">
            <dt className="text-content-faint flex items-center gap-1.5 font-mono text-[10px] tracking-[0.14em] uppercase">
              {row.label}
              {row.hint ? <Hint label={row.label}>{row.hint}</Hint> : null}
            </dt>
            <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
              <dd className="font-semibold tabular-nums">{row.value}</dd>
              {/* Figures keep to one line; the label is the part that may wrap. */}
              {row.note ? (
                <dd className="text-content-faint text-xs whitespace-nowrap">{row.note}</dd>
              ) : null}
            </div>
          </div>
        ) : (
          <div key={row.label} className="flex flex-col gap-1 py-4">
            <dt className="text-content-faint flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
              {row.label}
              {row.hint ? <Hint label={row.label}>{row.hint}</Hint> : null}
            </dt>
            <dd className="text-lg font-semibold tabular-nums">{row.value}</dd>
            {row.note ? <dd className="text-content-faint text-xs">{row.note}</dd> : null}
          </div>
        ),
      )}
    </dl>
  )
}
