import { Check, Languages } from 'lucide-react'
import { DropdownMenu } from 'radix-ui'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { supportedLanguages } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <Button variant="outline" size="icon" aria-label={t('language.label')}>
          <Languages className="size-4" aria-hidden />
        </Button>
      </DropdownMenu.Trigger>

      {/* Portal renders the menu at the document root so it escapes any parent
          overflow:hidden or stacking context. */}
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={6}
          className="border-border-subtle bg-surface-raised min-w-40 rounded-md border p-1 shadow-lg"
        >
          <DropdownMenu.RadioGroup
            value={i18n.resolvedLanguage}
            onValueChange={(next) => void i18n.changeLanguage(next)}
          >
            {supportedLanguages.map((lng) => (
              <DropdownMenu.RadioItem
                key={lng}
                value={lng}
                className="data-[highlighted]:bg-surface flex cursor-pointer items-center justify-between gap-3 rounded px-2 py-1.5 text-sm outline-none"
              >
                {t(`language.${lng}`)}
                <DropdownMenu.ItemIndicator>
                  <Check className="size-4" aria-hidden />
                </DropdownMenu.ItemIndicator>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
