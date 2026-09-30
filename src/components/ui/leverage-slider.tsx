import { Slider } from 'radix-ui'

type LeverageSliderProps = {
  value: number
  onValueChange: (value: number) => void
  min: number
  max: number
  label: string
}

/**
 * Radix slider instead of a native range input: the native one cannot be styled
 * consistently across browsers, and here the filled track is a real signal — the
 * further right it runs, the more leverage is on.
 */
export function LeverageSlider({ value, onValueChange, min, max, label }: LeverageSliderProps) {
  return (
    <Slider.Root
      aria-label={label}
      value={[value]}
      onValueChange={([next]) => next !== undefined && onValueChange(next)}
      min={min}
      max={max}
      step={1}
      className="relative flex h-5 w-full cursor-pointer touch-none items-center select-none"
    >
      <Slider.Track className="relative h-1.5 w-full grow rounded-full bg-line">
        <Slider.Range className="absolute h-full rounded-full bg-lime" />
      </Slider.Track>
      <Slider.Thumb
        className="block size-4 rounded-full border-2 border-lime bg-surface-raised shadow-sm transition-transform duration-150 ease-brand hover:scale-115 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime"
      />
    </Slider.Root>
  )
}
