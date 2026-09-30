import { cn } from '@/lib/utils'

type SpecRowProps = {
  label: string
  value: React.ReactNode
  /** Optional second line under the value. */
  note?: string
  className?: string
}

/** Monospace label left, value right, hairline above — the reference's spec list. */
export function SpecRow({ label, value, note, className }: SpecRowProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-t border-line py-3.5',
        className,
      )}
    >
      <dt className="font-mono text-[11px] tracking-[0.16em] text-content-faint uppercase">
        {label}
      </dt>
      <dd className="flex flex-col items-end text-right">
        <span className="tabular-nums">{value}</span>
        {note ? <span className="text-xs text-content-faint">{note}</span> : null}
      </dd>
    </div>
  )
}
