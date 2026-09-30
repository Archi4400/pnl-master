import { useTranslation } from 'react-i18next'

import { SegmentedControl } from '@/components/ui/segmented-control'
import { supportedLanguages } from '@/i18n'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation()
  const current = supportedLanguages.find((lng) => lng === i18n.resolvedLanguage) ?? 'en'

  return (
    <SegmentedControl
      label={t('language.label')}
      value={current}
      onValueChange={(next) => void i18n.changeLanguage(next)}
      className="w-[6.5rem]"
      options={supportedLanguages.map((lng) => ({
        value: lng,
        ariaLabel: t(`language.${lng}`),
        label: lng,
      }))}
    />
  )
}
