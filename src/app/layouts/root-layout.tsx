import { Outlet } from 'react-router'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { SiteFooter } from '@/components/site-footer'
import { ThemeToggle } from '@/components/theme-toggle'

export function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="border-line bg-surface/85 sticky top-0 z-20 border-b backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-3 px-5 py-3.5">
          <Logo size={34} className="mr-auto" />
          <div className="flex items-center gap-2">
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
    </div>
  )
}
