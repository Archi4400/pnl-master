import { ChevronDown, ChevronUp } from 'lucide-react'
import { type ComponentProps, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { sanitizeNumberInput, stepNumber } from '@/features/calculator/math'
import { cn } from '@/lib/utils'

import { Hint } from './hint'

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

// Holding an arrow waits a beat before repeating, like a native spin button, so
// a single click never fires twice.
const REPEAT_DELAY_MS = 400
const REPEAT_INTERVAL_MS = 60
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
  const { t } = useTranslation()
  const numeric = Number(value.replace(',', '.'))
  const signed = tone === 'auto' && Number.isFinite(numeric) && numeric !== 0
  const negative = signed && numeric < 0

  // A held arrow fires from a timer, long after the render that started it, so
  // it reads the value and callback through refs instead of stale closures.
  const valueRef = useRef(value)
  const onValueChangeRef = useRef(onValueChange)
  useEffect(() => {
    valueRef.current = value
    onValueChangeRef.current = onValueChange
  })

  const nudge = (direction: 1 | -1, multiplier = 1) => {
    const next = stepNumber(valueRef.current, direction, { step, multiplier, allowNegative })
    // Written ahead of the re-render so the next repeat tick builds on it.
    valueRef.current = next
    onValueChangeRef.current(next)
  }

  // One stable object for the whole life of the field, so the unmount cleanup
  // can capture it and still see whichever timer is live at that moment.
  const repeat = useRef<{ timer: ReturnType<typeof setTimeout> | null }>({ timer: null })
  const stopRepeat = () => {
    if (repeat.current.timer !== null) clearTimeout(repeat.current.timer)
    repeat.current.timer = null
  }
  const startRepeat = (direction: 1 | -1) => {
    nudge(direction)
    const tick = () => {
      nudge(direction)
      repeat.current.timer = setTimeout(tick, REPEAT_INTERVAL_MS)
    }
    repeat.current.timer = setTimeout(tick, REPEAT_DELAY_MS)
  }
  // A field unmounted mid-hold must not keep ticking.
  useEffect(() => {
    const state = repeat.current
    return () => {
      if (state.timer !== null) clearTimeout(state.timer)
    }
    // `repeat` is a ref and never changes; listed only to satisfy the linter.
  }, [repeat])

  const arrow = (direction: 1 | -1) => (
    <button
      type="button"
      // Keyboard users already have the arrow keys inside the input, so the
      // buttons stay out of the tab order instead of doubling every stop.
      tabIndex={-1}
      aria-label={t(direction === 1 ? 'common.increase' : 'common.decrease')}
      onPointerDown={(event) => {
        if (event.button !== 0) return
        // Keeps focus (and the caret) in the input while stepping.
        event.preventDefault()
        startRepeat(direction)
      }}
      onPointerUp={stopRepeat}
      onPointerLeave={stopRepeat}
      onPointerCancel={stopRepeat}
      className={cn(
        'text-content-faint flex flex-1 cursor-pointer items-center justify-center px-2.5 select-none',
        'hover:bg-lime hover:text-lime-ink active:text-lime-ink transition-colors duration-150',
        direction === 1 && 'border-line border-b',
      )}
    >
      {direction === 1 ? (
        <ChevronUp className="size-3.5" aria-hidden />
      ) : (
        <ChevronDown className="size-3.5" aria-hidden />
      )}
    </button>
  )

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
            signed ? (negative ? 'text-loss' : 'text-profit') : 'text-content',
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
        <div className="border-line flex flex-col border-l">
          {arrow(1)}
          {arrow(-1)}
        </div>
      </div>

      {hint ? <div className="text-content-faint text-xs">{hint}</div> : null}
    </div>
  )
}
