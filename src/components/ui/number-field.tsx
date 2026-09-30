import { type ComponentProps } from 'react'

import { sanitizeNumberInput } from '@/features/calculator/math'
import { cn } from '@/lib/utils'

import { Hint } from './hint'

type NumberFieldProps = Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'size'> & {
  label: string
  value: string
  onValueChange: (value: string) => void
  hint?: string
  /** Longer explanation behind a "?" next to the label. */
  tooltip?: string
  /** Colours the value. "auto" follows the sign of the number. */
  tone?: 'default' | 'auto'
  size?: 'md' | 'lg'
  /** Small text pinned inside the right edge of the box. */
  suffix?: string
  /** Accept a leading minus. Off by default: prices and amounts are never negative. */
  allowNegative?: boolean
}

export function NumberField({
  label,
  value,
  onValueChange,
  hint,
  tooltip,
  tone = 'default',
  size = 'md',
  suffix,
  allowNegative = false,
  className,
  id,
  ...props
}: NumberFieldProps) {
  const numeric = Number(value.replace(',', '.'))
  const signed = tone === 'auto' && Number.isFinite(numeric) && numeric !== 0
  const negative = signed && numeric < 0

  return (
    <div className="flex flex-col gap-2">
      {/* The hint sits beside the label rather than inside it, so tapping the
          icon does not also move focus into the input. */}
      <div className="text-content-faint flex items-center gap-1.5">
        <label htmlFor={id} className="font-mono text-[11px] tracking-[0.16em] uppercase">
          {label}
        </label>
        {tooltip ? <Hint label={label}>{tooltip}</Hint> : null}
      </div>

      {/* focus-within lifts the whole box, so the ring reads as one control
          rather than a rectangle with a separate outline on the input. */}
      <div
        className={cn(
          'border-line bg-surface-raised relative flex items-center rounded-xl border',
          'ease-brand transition-colors duration-200',
          'focus-within:border-lime focus-within:ring-lime/25 focus-within:ring-4',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => {
            // Rejected input is simply not applied: React keeps rendering the
            // previous value, so the stray character never appears.
            const next = sanitizeNumberInput(event.target.value, { allowNegative })
            if (next !== null) onValueChange(next)
          }}
          className={cn(
            'w-full min-w-0 bg-transparent tabular-nums outline-none',
            size === 'lg' ? 'px-4 py-3 text-3xl font-bold sm:text-4xl' : 'px-4 py-2.5 text-xl',
            signed ? (negative ? 'text-loss' : 'text-profit') : 'text-content',
            suffix && 'pr-12',
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="text-content-faint pointer-events-none absolute right-4 font-mono text-xs">
            {suffix}
          </span>
        ) : null}
      </div>

      {hint ? <p className="text-content-faint text-xs">{hint}</p> : null}
    </div>
  )
}
