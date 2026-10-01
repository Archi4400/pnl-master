import { useEffect, useState } from 'react'

/**
 * How far below the top of the viewport a section counts as "reached": the
 * sticky header plus a little slack, so a section scrolled to by the menu is
 * current straight away.
 */
const READ_LINE_PX = 140

/**
 * Which of the given sections the reader is in, for highlighting the matching
 * menu item: the last section whose top has passed just under the header.
 *
 * "Last one passed" rather than "most visible", so a short section (an empty
 * saved list) is not skipped over by the taller one after it; and at the very
 * bottom of the page the last section wins, since it may never reach the top.
 * Null in the hero, above the first section.
 */
export function useActiveSection(ids: readonly string[], enabled: boolean): string | null {
  const [active, setActive] = useState<string | null>(null)
  const key = ids.join(',')

  useEffect(() => {
    if (!enabled) return
    const sectionIds = key.split(',')
    let frame = 0

    const update = () => {
      frame = 0
      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter((element): element is HTMLElement => element !== null)

      const atBottom =
        window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom && elements.length > 0) {
        setActive((elements[elements.length - 1] as HTMLElement).id)
        return
      }

      let current: string | null = null
      for (const element of elements) {
        if (element.getBoundingClientRect().top <= READ_LINE_PX) current = element.id
      }
      setActive(current)
    }

    // One measurement per frame, however fast the scroll events arrive.
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => {
      if (frame) cancelAnimationFrame(frame)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
    }
  }, [key, enabled])

  return enabled ? active : null
}
