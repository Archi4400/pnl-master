import { Tooltip as TooltipPrimitive } from 'radix-ui'

import { cn } from '@/lib/utils'

/**
 * Shared timing for every tooltip; mounted once in the root layout. A short
 * delay keeps tooltips from flashing while the pointer just passes over rows,
 * and moving between triggers then opens the next one at once.
 *
 * disableHoverableContent: the bubbles are plain text with nothing to click,
 * so there is no reason to keep one open while the pointer travels towards
 * it. Without this, that "transit" blocks a neighbouring trigger (the row and
 * its calculator button) from opening its own tooltip.
 */
export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return (
    <TooltipPrimitive.Provider delayDuration={400} skipDelayDuration={300} disableHoverableContent>
      {children}
    </TooltipPrimitive.Provider>
  )
}

type TooltipProps = {
  /** What the bubble says. */
  content: React.ReactNode
  /** The trigger: a single focusable element (button or link). */
  children: React.ReactElement
  side?: 'top' | 'right' | 'bottom' | 'left'
  align?: 'start' | 'center' | 'end'
}

/**
 * A hover/focus label that explains what a control does.
 *
 * Radix tooltips never open on touch, by design: a tap activates the control.
 * So a tooltip may only explain, never carry information that is nowhere else;
 * for notes that matter on a phone use Hint, which is tappable.
 */
export function Tooltip({ content, children, side = 'top', align = 'center' }: TooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          align={align}
          sideOffset={6}
          collisionPadding={12}
          // Same bubble as Hint, so both kinds of note look alike.
          className={cn(
            'border-line bg-surface-raised z-50 max-w-64 rounded-xl border px-3 py-2',
            'text-content font-sans text-xs leading-relaxed tracking-normal normal-case',
            'shadow-[0_12px_32px_-12px_rgba(0,0,0,0.45)]',
          )}
        >
          {content}
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
