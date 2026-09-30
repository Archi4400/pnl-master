import { useTranslation } from 'react-i18next'

import { LogoIcon } from '@/components/logo'

// Brand marks are drawn inline: lucide dropped its brand icons, and two paths do
// not justify another icon package. Both are the Simple Icons glyphs.
const LINKEDIN_PATH =
  'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z'
const TELEGRAM_PATH =
  'M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z'

const LINKS = [
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/in/artur-liashenko-1a3171209',
    path: LINKEDIN_PATH,
  },
  { label: '@archi4400', href: 'https://t.me/archi4400', path: TELEGRAM_PATH },
] as const

export function SiteFooter() {
  const { t } = useTranslation()
  const year = new Date().getFullYear()

  return (
    <footer className="border-line mt-24 border-t">
      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-5 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <LogoIcon tile size={32} decorative />
          <div>
            <p className="text-sm font-semibold">PnL Master</p>
            <p className="text-content-faint font-mono text-[11px] tracking-wider uppercase">
              {t('footer.tagline')}
            </p>
          </div>
        </div>

        <p className="text-content-faint max-w-sm text-xs leading-relaxed">
          {t('footer.disclaimer')}
        </p>

        <div className="flex shrink-0 flex-col gap-2.5 sm:items-end">
          <p className="text-content-faint font-mono text-[11px] tracking-wider">
            {t('footer.madeBy')} Artur Liashenko · © {year}
          </p>
          <ul className="flex flex-wrap gap-2 sm:justify-end">
            {LINKS.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="border-line text-content-muted hover:border-lime hover:bg-lime hover:text-lime-ink focus-visible:outline-lime ease-brand inline-flex items-center gap-2 rounded-full border px-3 py-1.5 font-mono text-[11px] tracking-wider transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2"
                >
                  <svg viewBox="0 0 24 24" className="size-3.5 fill-current" aria-hidden>
                    <path d={link.path} />
                  </svg>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  )
}
