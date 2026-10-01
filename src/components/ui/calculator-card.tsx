import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import { Button } from './button'
import { SectionLabel } from './section-label'

type InputCardProps = {
  index: string
  title: string
  /** Buttons shown before Reset in the header (save, share). */
  actions?: React.ReactNode
  onReset: () => void
  children: React.ReactNode
}

/** The raised card that holds a calculator's inputs, with its header toolbar. */
export function InputCard({ index, title, actions, onReset, children }: InputCardProps) {
  const { t } = useTranslation()
  return (
    <div className="rounded-card border-line bg-surface-raised flex flex-col gap-7 border p-5 sm:p-7">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel index={index}>{title}</SectionLabel>
        <div className="-mr-2 flex items-center">
          {actions}
          <Button variant="ghost" size="sm" onClick={onReset}>
            {t('calculator.reset')}
          </Button>
        </div>
      </div>
      {children}
    </div>
  )
}

type ResultSlabProps = {
  index: string
  title: string
  /** Small print pinned to the bottom of the slab. */
  footnote: string
  children: React.ReactNode
  className?: string
}

/**
 * The inverted slab that reads a calculator's results back: the reference's
 * signature block, cut out of the page in the opposite ground.
 */
export function ResultSlab({ index, title, footnote, children, className }: ResultSlabProps) {
  return (
    <div
      className={cn(
        'rounded-card bg-surface-invert text-content-invert flex flex-col gap-5 p-5 sm:p-7',
        className,
      )}
    >
      <SectionLabel index={index} tone="invert" className="text-content-invert/55">
        {title}
      </SectionLabel>
      {children}
      <p className="border-content-invert/15 text-content-invert/55 mt-auto border-t pt-4 text-xs leading-relaxed">
        {footnote}
      </p>
    </div>
  )
}

/** Inputs left, results right; stacked on narrow screens. */
export function CalculatorLayout({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">{children}</div>
}
