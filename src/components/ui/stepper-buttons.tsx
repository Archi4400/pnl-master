import { ChevronDown, ChevronUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useHoldRepeat } from '@/hooks/use-hold-repeat'
import { cn } from '@/lib/utils'

type StepperButtonsProps = {
  onStep: (direction: 1 | -1) => void
}

/** The ▲/▼ column on the right edge of a number field; hold to repeat. */
export function StepperButtons({ onStep }: StepperButtonsProps) {
  const { t } = useTranslation()
  const { start, stop } = useHoldRepeat(onStep)

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
        start(direction)
      }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
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
    <div className="border-line flex flex-col border-l">
      {arrow(1)}
      {arrow(-1)}
    </div>
  )
}
