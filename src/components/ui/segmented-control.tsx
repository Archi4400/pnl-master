import { ToggleGroup } from 'radix-ui'

import { cn } from '@/lib/utils'

type Option = {
  value: string
  label: React.ReactNode
  ariaLabel: string
}

type SegmentedControlProps = {
  value: string
  onValueChange: (value: string) => void
  options: Option[]
  /** Accessible name for the whole group. */
  label: string
  className?: string
}

/**
 * Pill with a lime knob that slides to the active segment.
 *
 * The knob is one absolutely positioned element rather than a background on each
 * item — that is what lets it animate between positions instead of blinking. Its
 * width is a fraction of the padded track, and translateX is a percentage of its
 * own width, so the maths stays correct for any number of options.
 */
export function SegmentedControl({
  value,
  onValueChange,
  options,
  label,
  className,
}: SegmentedControlProps) {
  const activeIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  )

  return (
    <ToggleGroup.Root
      type="single"
      value={value}
      // Radix reports "" when the active item is pressed again; keep the current
      // selection instead of letting the control empty itself.
      onValueChange={(next) => next && onValueChange(next)}
      aria-label={label}
      className={cn(
        'border-line bg-surface-raised relative flex rounded-full border p-1',
        className,
      )}
    >
      <span
        aria-hidden
        className="bg-lime ease-brand absolute inset-y-1 left-1 rounded-full transition-transform duration-300"
        style={{
          width: `calc((100% - 0.5rem) / ${options.length})`,
          transform: `translateX(${activeIndex * 100}%)`,
        }}
      />

      {options.map((option) => (
        <ToggleGroup.Item
          key={option.value}
          value={option.value}
          aria-label={option.ariaLabel}
          className={cn(
            'relative z-10 flex h-8 flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-full px-3',
            'font-mono text-[11px] tracking-wider uppercase',
            'text-content-muted hover:text-content transition-colors duration-200',
            'data-[state=on]:text-lime-ink data-[state=on]:hover:text-lime-ink',
            'focus-visible:outline-lime focus-visible:outline-2 focus-visible:outline-offset-2',
          )}
        >
          {option.label}
        </ToggleGroup.Item>
      ))}
    </ToggleGroup.Root>
  )
}
