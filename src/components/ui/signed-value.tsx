import { cn } from '@/lib/utils'
import { signedTone } from '@/lib/tone'

type SignedValueProps = {
  /** The number the colour is judged from. */
  value: number
  /** The formatted text to show. */
  children: React.ReactNode
  /** Which ground it sits on; the inverted slab needs its own palette. */
  surface?: 'page' | 'invert'
  /** For numbers where going down is good news, like an average buy price. */
  lowerIsBetter?: boolean
  className?: string
}

/** A result coloured by its sign: green for a gain, red for a loss. */
export function SignedValue({
  value,
  children,
  surface = 'page',
  lowerIsBetter = false,
  className,
}: SignedValueProps) {
  return (
    <span className={cn(signedTone(value, { surface, lowerIsBetter }), className)}>{children}</span>
  )
}
