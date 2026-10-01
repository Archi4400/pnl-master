import { ArrowUpRight, Menu } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useTranslation } from 'react-i18next'
import { Link, useLocation } from 'react-router'

import { scrollToSection, VISIBLE_HOME_SECTIONS, type HomeSection } from '@/app/sections'
import { useActiveSection } from '@/hooks/use-active-section'
import { cn } from '@/lib/utils'

/**
 * On the home page a section link scrolls in place; anywhere else it is a real
 * link to /#section, which the home page scrolls to once it has rendered.
 * Rendering it as a link either way keeps open-in-new-tab and copy-link working.
 */
function useSectionNavigation() {
  const { pathname } = useLocation()
  const onHome = pathname === '/'
  const active = useActiveSection(VISIBLE_HOME_SECTIONS, onHome)

  const linkProps = (id: HomeSection) => ({
    to: { pathname: '/', hash: id },
    onClick: (event: React.MouseEvent) => {
      if (!onHome || event.metaKey || event.ctrlKey || event.shiftKey) return
      event.preventDefault()
      scrollToSection(id)
    },
    'aria-current': active === id ? ('location' as const) : undefined,
  })

  return { linkProps, active, onJournal: pathname.startsWith('/journal') }
}

const ITEM_CLASS = cn(
  'relative inline-flex items-center gap-1 py-2 font-mono text-[11px] tracking-[0.14em] whitespace-nowrap uppercase',
  'text-content-muted hover:text-content transition-colors duration-200',
  // The lime rule under the current item: a menu, not a row of tabs.
  'after:bg-lime after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-left after:scale-x-0 after:rounded-full after:transition-transform after:duration-300',
  'hover:after:scale-x-100 aria-[current]:text-content aria-[current]:after:scale-x-100',
  'focus-visible:outline-lime rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4',
)

/** Desktop: a plain row of links in the header. */
export function SiteNav({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { linkProps, onJournal } = useSectionNavigation()

  return (
    <nav aria-label={t('nav.label')} className={cn('hidden lg:block', className)}>
      <ul className="flex items-center gap-6">
        {VISIBLE_HOME_SECTIONS.map((id) => (
          <li key={id}>
            <Link {...linkProps(id)} className={ITEM_CLASS}>
              {t(`nav.sections.${id}`)}
            </Link>
          </li>
        ))}
        <li className="border-line border-l pl-6">
          <Link to="/journal" aria-current={onJournal ? 'page' : undefined} className={ITEM_CLASS}>
            {t('nav.journal')}
            <ArrowUpRight className="size-3" aria-hidden />
          </Link>
        </li>
      </ul>
    </nav>
  )
}

const MENU_ITEM_CLASS = cn(
  'flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm outline-none',
  'data-[highlighted]:bg-lime/20 aria-[current]:font-semibold',
)

/** Phones and small tablets: the same links behind a Menu button. */
export function MobileNav({ className }: { className?: string }) {
  const { t } = useTranslation()
  const { linkProps, active, onJournal } = useSectionNavigation()

  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        className={cn(
          'border-line bg-surface-raised hover:border-lime data-[state=open]:border-lime inline-flex h-10 cursor-pointer items-center gap-2 rounded-full border px-3 sm:px-3.5 lg:hidden',
          'focus-visible:outline-lime font-mono text-[11px] tracking-wider uppercase focus-visible:outline-2 focus-visible:outline-offset-2',
          className,
        )}
      >
        <Menu className="size-4" aria-hidden />
        {/* Icon-only on phones, where every pixel of the header row counts. */}
        <span className="sr-only sm:not-sr-only">{t('nav.menu')}</span>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          aria-label={t('nav.label')}
          className="border-line bg-surface-raised z-50 flex w-64 flex-col rounded-2xl border p-1.5 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.5)]"
        >
          {VISIBLE_HOME_SECTIONS.map((id) => (
            <DropdownMenu.Item key={id} asChild>
              <Link {...linkProps(id)} className={MENU_ITEM_CLASS}>
                {t(`nav.sections.${id}`)}
                {active === id ? (
                  <span className="bg-lime size-1.5 rounded-full" aria-hidden />
                ) : null}
              </Link>
            </DropdownMenu.Item>
          ))}
          <DropdownMenu.Separator className="bg-line mx-2 my-1.5 h-px" />
          <DropdownMenu.Item asChild>
            <Link
              to="/journal"
              aria-current={onJournal ? 'page' : undefined}
              className={MENU_ITEM_CLASS}
            >
              {t('nav.journal')}
              <ArrowUpRight className="text-content-faint size-4" aria-hidden />
            </Link>
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
