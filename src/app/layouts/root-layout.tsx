import { Link, Outlet } from 'react-router'
import { useTranslation } from 'react-i18next'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { MobileNav, SiteNav } from '@/components/site-nav'
import { SiteFooter } from '@/components/site-footer'
import { ThemeToggle } from '@/components/theme-toggle'
import { Toaster } from '@/components/toaster'

export function RootLayout() {
  const { t } = useTranslation()
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line bg-surface/85 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-x-4 px-5 py-3.5">
          {/* The logo is the home link. Phones get the icon alone so the menu
              button and both toggles still fit on one row. */}
          <Link
            to="/"
            aria-label={t('nav.home')}
            className="focus-visible:outline-lime shrink-0 rounded-xl focus-visible:outline-2 focus-visible:outline-offset-4"
          >
            <Logo size={34} className="hidden sm:inline-flex" />
            <Logo size={34} iconOnly className="sm:hidden" />
          </Link>
          <SiteNav className="mr-auto ml-6 xl:ml-10" />
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <MobileNav />
            <LanguageSwitcher />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Outlet is where the matched child route renders — Vue's <router-view>. */}
      <main className="flex-1">
        <Outlet />
      </main>

      <SiteFooter />
      <Toaster />
    </div>
  )
}
