import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import uk from './locales/uk.json'

export const supportedLanguages = ['en', 'uk'] as const
export type SupportedLanguage = (typeof supportedLanguages)[number]

export const resources = {
  en: { translation: en },
  uk: { translation: uk },
} as const

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    supportedLngs: supportedLanguages,
    // React escapes interpolated values already; escaping twice mangles output.
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

// Keep <html lang> in step with the interface language: screen readers pick
// their voice from it, and browsers their hyphenation and number formatting.
function syncDocumentLanguage(language: string | undefined) {
  if (language) document.documentElement.lang = language
}
syncDocumentLanguage(i18n.resolvedLanguage)
i18n.on('languageChanged', () => syncDocumentLanguage(i18n.resolvedLanguage))

export default i18n
