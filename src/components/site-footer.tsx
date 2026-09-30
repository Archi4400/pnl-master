import { useTranslation } from 'react-i18next'

import { LogoIcon } from '@/components/logo'

export function SiteFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon tile size={32} decorative />
          <div>
            <p className="text-sm font-semibold">PnL Master</p>
            <p className="font-mono text-[11px] tracking-wider text-content-faint uppercase">
              {t('footer.tagline')}
            </p>
          </div>
        </div>

        <p className="max-w-sm text-xs leading-relaxed text-content-faint">{t('footer.disclaimer')}</p>

        <p className="font-mono text-[11px] tracking-wider text-content-faint">© {year}</p>
      </div>
    </footer>
  )
}
