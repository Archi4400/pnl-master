import { cn } from '@/lib/utils'

/**
 * Lime highlighter behind a word — the same device as the logo's rule.
 *
 * Built as a background gradient rather than a drawn box so it wraps with the
 * text and always matches its width. It stops at 52% of the line height, which
 * is what makes it read as a marker stroke rather than a filled block.
 */
export function Marker({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span
      className={cn('bg-[linear-gradient(transparent_52%,var(--color-marker)_52%)]', className)}
      style={{ boxDecorationBreak: 'clone', WebkitBoxDecorationBreak: 'clone' }}
    >
      {children}
    </span>
  )
}
