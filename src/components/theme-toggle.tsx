import { Moon, Sun } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { SegmentedControl } from '@/components/ui/segmented-control'

type Theme = 'light' | 'dark'

function readInitialTheme(): Theme {
  const stored = localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark') return stored
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeToggle() {
  const { t } = useTranslation()
  // Lazy initialiser: the function runs once on mount instead of every render.
  const [theme, setTheme] = useState<Theme>(readInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
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
