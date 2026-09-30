import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SegmentedControl } from '@/components/ui/segmented-control'

type Theme = 'light' | 'dark'

/** Mirrors the inline script in index.html, which applies it before first paint. */
function readInitialTheme(): Theme {
  try {
    const stored = localStorage.getItem('theme')
    if (stored === 'light' || stored === 'dark') return stored
  } catch {
    // Storage can be disabled; fall through to the OS preference.
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const { t } = useTranslation()
  // Lazy initialiser: the function runs once on mount instead of every render.
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    try {
      localStorage.setItem('theme', theme)
    } catch {
      // Not remembering the choice is harmless.
    }
  }, [theme])

  return (
    <SegmentedControl
      label={t('theme.toggle')}
      value={theme}
      onValueChange={(next) => setTheme(next as Theme)}
      className="w-[5.5rem]"
      options={[
        { value: 'light', ariaLabel: t('theme.light'), label: <Sun className="size-3.5" /> },
        { value: 'dark', ariaLabel: t('theme.dark'), label: <Moon className="size-3.5" /> },
      ]}
    />
  )
}
