import { cn } from '@/lib/utils'

/**
 * Endless scrolling strip. The track holds the items twice; the keyframe moves
 * it exactly -50%, so the second copy lands where the first began and the loop
 * is seamless. Pauses on hover so a reader can actually finish a phrase.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  return (
    <div
      className={cn('group relative flex overflow-hidden border-y border-line py-5', className)}
      aria-hidden
    >
      <div className="flex shrink-0 animate-marquee gap-10 pr-10 group-hover:[animation-play-state:paused]">
        {(['a', 'b'] as const).map((copy) =>
          items.map((item) => (
            <span key={`${copy}-${item}`} className="flex shrink-0 items-center gap-10 text-lg">
              {item}
              <span className="size-1.5 rounded-full bg-lime" />
            </span>
          )),
        )}
      </div>
    </div>
  )
}
