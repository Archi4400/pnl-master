import { NEWS_API_KEY } from '@/features/news/use-news'

/**
 * Sections of the home page the header menu can jump to, in page order. The
 * ids double as the anchors in /#id links from other pages.
 */
export const HOME_SECTIONS = ['calculator', 'news'] as const

export type HomeSection = (typeof HOME_SECTIONS)[number]

/**
 * The sections that actually render. News is dropped in production when no
 * API key is configured, so the menu never points at a missing section.
 */
export const VISIBLE_HOME_SECTIONS = HOME_SECTIONS.filter(
  (id) => id !== 'news' || NEWS_API_KEY !== null || import.meta.env.DEV,
)

export function isHomeSection(value: string): value is HomeSection {
  return (HOME_SECTIONS as readonly string[]).includes(value)
}

/**
 * Smooth-scroll to a home section. Scrolling is done here instead of through a
 * #hash in the URL because the home page keeps rewriting its query string to
 * mirror the calculator, which would drop the hash anyway.
 */
export function scrollToSection(id: HomeSection, behavior: ScrollBehavior = 'smooth') {
  document.getElementById(id)?.scrollIntoView({ behavior, block: 'start' })
}
