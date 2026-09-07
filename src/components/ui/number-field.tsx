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
}

export function NumberField({
  label,
  value,
  onValueChange,
  hint,
  tone = 'default',
  size = 'md',
  className,
  id,
  ...props
}: NumberFieldProps) {
  const numeric = Number(value.replace(',', '.'))
  const signed = tone === 'auto' && Number.isFinite(numeric) && numeric !== 0
  const negative = signed && numeric < 0

  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[11px] font-medium tracking-[0.14em] text-content-faint uppercase"
      >
        {label}
      </label>

      <input
        id={id}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        spellCheck={false}
        value={value}
        onChange={(event) => onValueChange(event.target.value)}
        className={cn(
          'w-full border-b-2 border-line bg-transparent pb-1.5 tabular-nums',
          'transition-colors outline-none focus:border-lime',
          size === 'lg' ? 'text-3xl font-bold sm:text-4xl' : 'text-xl font-medium',
          signed ? (negative ? 'text-loss' : 'text-profit') : 'text-content',
          className,
        )}
        {...props}
      />

      {hint ? <p className="text-xs text-content-faint">{hint}</p> : null}
    </div>
  )
}
