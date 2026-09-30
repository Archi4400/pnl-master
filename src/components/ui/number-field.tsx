import { type ComponentProps } from 'react'

import { useLatest } from '@/hooks/use-latest'
import { parseNumber, sanitizeNumberInput, stepNumber } from '@/lib/number'
import { signedTone } from '@/lib/tone'
import { cn } from '@/lib/utils'

import { Hint } from './hint'
import { StepperButtons } from './stepper-buttons'

type NumberFieldProps = Omit<ComponentProps<'input'>, 'onChange' | 'value' | 'size' | 'step'> & {
  label: string
  value: string
  onValueChange: (value: string) => void
  /** Line under the field; may hold controls, e.g. a market-price button. */
  hint?: React.ReactNode
  /** Longer explanation behind a "?" next to the label. */
  tooltip?: string
  /** Colours the value. "auto" follows the sign of the number. */
  tone?: 'default' | 'auto'
  size?: 'md' | 'lg'
  /** Small text pinned inside the right edge of the box. */
  suffix?: string
  /** Accept a leading minus. Off by default: prices and amounts are never negative. */
  allowNegative?: boolean
  /** Fixed arrow step. Without it the arrows move the last digit typed. */
  step?: number
}

// Shift + arrow key jumps ten steps at once.
const SHIFT_MULTIPLIER = 10

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
  step,
  className,
  id,
  onKeyDown,
  ...props
}: NumberFieldProps) {
  const toneClass = tone === 'auto' ? signedTone(parseNumber(value)) : undefined

  // Stepping can run from a held-button timer, long after this render, so it
  // reads the value and callback through refs rather than stale closures. Each
  // tick re-renders before the next (60 ms apart), so the ref is always fresh.
  const latestValue = useLatest(value)
  const latestOnChange = useLatest(onValueChange)
  const nudge = (direction: 1 | -1, multiplier = 1) => {
    latestOnChange.current(
      stepNumber(latestValue.current, direction, { step, multiplier, allowNegative }),
    )
  }

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
          'border-line bg-surface-raised relative flex items-stretch overflow-hidden rounded-xl border',
          'ease-brand transition-colors duration-200',
          'focus-within:border-lime focus-within:ring-lime/25 focus-within:ring-4',
          // An invalid value (aria-invalid on the input) outlines the box red.
          'has-[[aria-invalid=true]]:border-loss has-[[aria-invalid=true]]:ring-loss/20',
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
          onKeyDown={(event) => {
            onKeyDown?.(event)
            if (event.defaultPrevented) return
            if (event.key !== 'ArrowUp' && event.key !== 'ArrowDown') return
            // Otherwise the caret jumps to the start or end of the text.
            event.preventDefault()
            nudge(event.key === 'ArrowUp' ? 1 : -1, event.shiftKey ? SHIFT_MULTIPLIER : 1)
          }}
          className={cn(
            'w-full min-w-0 bg-transparent tabular-nums outline-none',
            size === 'lg' ? 'px-4 py-3 text-3xl font-bold sm:text-4xl' : 'px-4 py-2.5 text-xl',
            toneClass ?? 'text-content',
            suffix && 'pr-2',
            className,
          )}
          {...props}
        />
        {suffix ? (
          <span className="text-content-faint pointer-events-none flex items-center pr-3 font-mono text-xs">
            {suffix}
          </span>
        ) : null}
        <StepperButtons onStep={(direction) => nudge(direction)} />
      </div>

      {hint ? <div className="text-content-faint text-xs">{hint}</div> : null}
    </div>
  )
}
