import { cva, type VariantProps } from 'class-variance-authority'
import { Slot } from 'radix-ui'
import { type ComponentProps } from 'react'

import { cn } from '@/lib/utils'

/**
 * cva is the React answer to variant props. Coming from Vue, think of it as a
 * computed class map, except the variant names are inferred into the prop types.
 */
const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 rounded-full font-mono text-[13px] tracking-tight whitespace-nowrap transition-all duration-200 ease-brand focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-lime disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        solid: 'bg-surface-invert text-content-invert hover:-translate-y-0.5 hover:shadow-lg',
        outline:
          'border border-line bg-surface-raised text-content hover:border-lime hover:bg-lime hover:text-lime-ink hover:-translate-y-0.5',
        lime: 'bg-lime text-lime-ink hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-8px_var(--color-lime)]',
        // A lime fill rather than just a colour shift, so a hover is obvious at a
        // glance. data-[state=open] keeps it lit while its popover is open.
        ghost:
          'text-content-muted hover:bg-lime hover:text-lime-ink data-[state=open]:bg-lime data-[state=open]:text-lime-ink',
        // Destructive actions tint red instead: lime would read as "go ahead".
        danger: 'text-content-muted hover:bg-loss/15 hover:text-loss',
      },
      size: {
        sm: 'h-8 px-3.5',
        md: 'h-10 px-5',
        icon: 'size-10',
      },
    },
    defaultVariants: { variant: 'solid', size: 'md' },
  },
)

type ButtonProps = ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    /**
     * Render the single child element instead of a <button>, passing all styles
     * and props down to it. Useful for `<Button asChild><Link/></Button>` so the
     * link stays a real anchor while looking like a button.
     */
    asChild?: boolean
  }

export function Button({ className, variant, size, asChild = false, ...props }: ButtonProps) {
  const Component = asChild ? Slot.Root : 'button'
  return <Component className={cn(buttonVariants({ variant, size }), className)} {...props} />
}
