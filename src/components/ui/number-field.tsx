import { type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

type NumberFieldProps = Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'size'> & {
  label: string
  value: string
  onValueChange: (value: string) => void
  hint?: string
  /** Colours the value. "auto" follows the sign of the number. */
  tone?: 'default' | 'auto'
  size?: 'md' | 'lg'
  /** Small text pinned inside the right edge of the box. */
  suffix?: string
}

export function NumberField({
  label,
  value,
  onValueChange,
  hint,
  tone = 'default',
  size = 'md',
  suffix,
  className,
  id,
  ...props
}: NumberFieldProps) {
  const numeric = Number(value.replace(',', '.'))
  const signed = tone === 'auto' && Number.isFinite(numeric) && numeric !== 0
  const negative = signed && numeric < 0

  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={id}
        className="font-mono text-[11px] tracking-[0.16em] text-content-faint uppercase"
      >
        {label}
      </label>

      {/* focus-within lifts the whole box, so the ring reads as one control
          rather than a rectangle with a separate outline on the input. */}
      <div
        className={cn(
          'relative flex items-center rounded-xl border border-line bg-surface-raised',
          'transition-colors duration-200 ease-brand',
          'focus-within:border-lime focus-within:ring-4 focus-within:ring-lime/25',
        )}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          spellCheck={false}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
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
          <span className="pointer-events-none absolute right-4 font-mono text-xs text-content-faint">
            {suffix}
          </span>
        ) : null}
      </div>

      {hint ? <p className="text-xs text-content-faint">{hint}</p> : null}
    </div>
  )
}
