import { CircleHelp } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

type HintProps = {
  /** The explanation shown in the bubble. */
  children: React.ReactNode
  /** What the hint explains; the button is announced as "About: <label>". */
  label: string
  className?: string
}

/**
 * Small "?" next to a label that explains it.
 *
 * Built on Popover rather than Tooltip because Radix tooltips never open on
 * touch, and these notes matter most on a phone. A mouse opens it on hover like
 * a tooltip; touch and keyboard toggle it on tap/Enter.
 */
export function Hint({ children, label, className }: HintProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  // Which pointer pressed the trigger, so a mouse click does not toggle shut a
  // bubble that hover has just opened.
  const pointerType = useRef<string | null>(null)

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        type="button"
        aria-label={t('common.hintFor', { label })}
        onPointerEnter={(event) => event.pointerType === 'mouse' && setOpen(true)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && setOpen(false)}
        onPointerDown={(event) => {
          pointerType.current = event.pointerType
        }}
        onClick={(event) => {
          if (pointerType.current === 'mouse') event.preventDefault()
          pointerType.current = null
        }}
        className={cn(
          'inline-flex size-4 shrink-0 cursor-help items-center justify-center rounded-full',
          'opacity-70 transition-opacity hover:opacity-100 data-[state=open]:opacity-100',
          'focus-visible:outline-lime focus-visible:outline-2 focus-visible:outline-offset-2',
          className,
        )}
      >
        <CircleHelp className="size-3.5" aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          side="top"
          sideOffset={6}
          collisionPadding={12}
          // Keep focus on the page: this is a note, not a dialog to work in.
          onOpenAutoFocus={(event) => event.preventDefault()}
          // The page ground rather than its inverse: some triggers sit on the
          // inverted results slab, where an inverse bubble would melt into it.
          className={cn(
            'border-line bg-surface-raised z-50 max-w-64 rounded-xl border px-3 py-2',
            'text-content font-sans text-xs leading-relaxed tracking-normal normal-case',
            'shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          )}
        >
          {children}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
