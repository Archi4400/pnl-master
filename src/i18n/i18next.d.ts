import type en from './locales/en.json'

// Makes translation keys type-checked: t('nav.dashboard') compiles, while a
// typo like t('nav.dashbaord') becomes a build error.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation'
    resources: {
      translation: typeof en
    }
  }
}
