import { cn } from '@/lib/utils'

/**
 * Endless scrolling strip. The track holds the items twice; the keyframe moves
 * it exactly -50%, so the second copy lands where the first began and the loop
 * is seamless. Pauses on hover so a reader can actually finish a phrase.
 */
export function Marquee({ items, className }: { items: string[]; className?: string }) {
  return (
    <div
      className={cn('group border-line relative flex overflow-hidden border-y py-5', className)}
      aria-hidden
    >
      <div className="animate-marquee flex shrink-0 gap-10 pr-10 group-hover:[animation-play-state:paused]">
        {(['a', 'b'] as const).map((copy) =>
          items.map((item) => (
            <span key={`${copy}-${item}`} className="flex shrink-0 items-center gap-10 text-lg">
              {item}
              <span className="bg-lime size-1.5 rounded-full" />
            </span>
          )),
        )}
      </div>
    </div>
  )
}
