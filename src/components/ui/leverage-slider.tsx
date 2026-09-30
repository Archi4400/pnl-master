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
 *
 * The value may exceed max (leverage is typed freely); the thumb then pins to
 * the right end instead of running off the track.
 */
export function LeverageSlider({ value, onValueChange, min, max, label }: LeverageSliderProps) {
  return (
    <Slider.Root
      aria-label={label}
      value={[Math.min(Math.max(value, min), max)]}
      onValueChange={([next]) => next !== undefined && onValueChange(next)}
      min={min}
      max={max}
      step={1}
      className="relative flex h-5 w-full cursor-pointer touch-none items-center select-none"
    >
      <Slider.Track className="bg-line relative h-1.5 w-full grow rounded-full">
        <Slider.Range className="bg-lime absolute h-full rounded-full" />
      </Slider.Track>
      <Slider.Thumb className="border-lime bg-surface-raised ease-brand focus-visible:outline-lime block size-4 rounded-full border-2 shadow-sm transition-transform duration-150 hover:scale-115 focus-visible:outline-2 focus-visible:outline-offset-2" />
    </Slider.Root>
  )
}
