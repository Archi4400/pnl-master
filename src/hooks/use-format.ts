import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { formatAmount, formatPrice, formatSigned } from '@/lib/number'

/** Unit counts keep full precision: 0.01191119 BTC is a real position. */
const UNIT_DECIMALS = 8

/**
 * Number formatters bound to the interface language, so readouts group digits
 * the way the reader expects ("1,500.5" in English, "1 500,5" in Ukrainian)
 * without every component threading the locale through by hand.
 */
export function useFormat() {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage

  return useMemo(
    () => ({
      /** Money: two decimals at most. */
      amount: (value: number) => formatAmount(value, locale),
      /** Coin quantities. */
      units: (value: number) => formatAmount(value, locale, UNIT_DECIMALS),
      price: (value: number) => formatPrice(value, locale),
      /** A result with its sign always shown. */
      signed: (value: number) => formatSigned(value, locale),
      /** A signed percentage: "+20%". */
      percent: (value: number) => `${formatSigned(value, locale)}%`,
    }),
    [locale],
  )
}
