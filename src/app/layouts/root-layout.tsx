import { Outlet } from 'react-router'

import { LanguageSwitcher } from '@/components/language-switcher'
import { Logo } from '@/components/logo'
import { ThemeToggle } from '@/components/theme-toggle'

export function RootLayout() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line">
        <div className="mx-auto flex max-w-4xl items-center gap-4 px-4 py-4">
          <Logo size={38} className="mr-auto" />
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* Outlet is where the matched child route renders — Vue's <router-view>. */}
      <main className="mx-auto max-w-4xl px-4 py-10 sm:py-14">
        <Outlet />
      </main>
    </div>
  )
}
