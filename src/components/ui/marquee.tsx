import { cn } from '@/lib/utils'

export type MarqueeItem = { key: string; node: React.ReactNode }

type MarqueeProps = {
  items: MarqueeItem[]
  /** Seconds for one full loop; scale it with the content so the speed stays even. */
  durationSeconds?: number
  /** Name for the strip; the moving copies themselves are hidden from screen readers. */
  label?: string
  className?: string
}

/**
 * Endless scrolling strip. The track holds the items twice; the keyframe moves
 * it exactly -50%, so the second copy lands where the first began and the loop
 * is seamless. Pauses on hover so a reader can actually take an item in, and
 * stands still (scrollable instead) for people who ask for reduced motion.
 */
export function Marquee({ items, durationSeconds = 34, label, className }: MarqueeProps) {
  return (
    <section
      aria-label={label}
      className={cn(
        'group border-line relative flex overflow-hidden border-y py-5 motion-reduce:overflow-x-auto',
        className,
      )}
    >
      <div
        className="animate-marquee flex shrink-0 gap-10 pr-10 group-hover:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ animationDuration: `${durationSeconds}s` }}
        aria-hidden
      >
        {(['a', 'b'] as const).map((copy) =>
          items.map((item) => (
            <span key={`${copy}-${item.key}`} className="flex shrink-0 items-center gap-10">
              {item.node}
              <span className="bg-lime size-1.5 rounded-full" />
            </span>
          )),
        )}
      </div>
    </section>
  )
}
