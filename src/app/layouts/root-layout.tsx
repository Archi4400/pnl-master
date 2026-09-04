import { useTranslation } from 'react-i18next'
import { NavLink, Outlet } from 'react-router'

import { LanguageSwitcher } from '@/components/language-switcher'
import { ThemeToggle } from '@/components/theme-toggle'
import { cn } from '@/lib/utils'

const navItems = [
  { to: '/', labelKey: 'nav.dashboard' },
  { to: '/transactions', labelKey: 'nav.transactions' },
] as const

export function RootLayout() {
  const { t } = useTranslation()

  return (
    <div className="min-h-dvh">
      <header className="border-border-subtle border-b">
        <div className="mx-auto flex max-w-4xl items-center gap-6 px-4 py-4">
          <div className="mr-auto">
            <h1 className="font-semibold">{t('app.title')}</h1>
            <p className="text-content-muted text-xs">{t('app.tagline')}</p>
          </div>

          <nav className="flex gap-1">
            {navItems.map((item) => (
              // NavLink is the router's active-aware link. The className callback
              // receives isActive, which replaces Vue Router's router-link-active.
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  cn(
                    'rounded-md px-3 py-1.5 text-sm transition-colors',
                    isActive ? 'bg-surface-raised font-medium' : 'text-content-muted',
                  )
                }
              >
                {t(item.labelKey)}
              </NavLink>
            ))}
          </nav>

          <div className="flex gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Outlet is where the matched child route renders — Vue's <router-view>. */}
      <main className="mx-auto max-w-4xl px-4 py-8">
        <Outlet />
      </main>
    </div>
  )
}
