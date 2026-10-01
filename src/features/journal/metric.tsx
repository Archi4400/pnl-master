import { cn } from '@/lib/utils'

type MetricProps = {
  label: string
  value: React.ReactNode
  /** Second line under the value. */
  note?: React.ReactNode
  className?: string
}

/** A labelled figure: the building block of the overview and asset panels. */
export function Metric({ label, value, note, className }: MetricProps) {
  return (
    <div
      className={cn(
        'border-line bg-surface-raised flex flex-col gap-1 rounded-2xl border p-4',
        className,
      )}
    >
      <dt className="text-content-faint font-mono text-[11px] tracking-[0.16em] uppercase">
        {label}
      </dt>
      <dd className="text-lg font-semibold tabular-nums">{value}</dd>
      {note ? <dd className="text-content-faint text-xs">{note}</dd> : null}
    </div>
  )
}

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
