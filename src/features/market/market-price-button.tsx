import { useTranslation } from 'react-i18next'

import { formatPrice } from '@/lib/number'
import { cn } from '@/lib/utils'

import { changeTone, formatChange, priceToField } from './format'
import { useStats } from './use-market'

type MarketPriceButtonProps = {
  asset: string | null
  /** Receives the price as a field value, ready for setField. */
  onUse: (value: string) => void
}

/**
 * "Market 83,800 — use" under a price field. Filling is opt-in rather than
 * automatic: a price the user typed is never overwritten behind their back,
 * and the live number stays visible either way.
 */
export function MarketPriceButton({ asset, onUse }: MarketPriceButtonProps) {
  const { t, i18n } = useTranslation()
  const { data: stats, isError } = useStats(asset)

  if (asset === null) return null
  if (isError) return <span className="text-content-faint">{t('market.unavailable')}</span>
  if (stats === undefined) return <span className="text-content-faint">{t('market.loading')}</span>

  return (
    <button
      type="button"
      onClick={() => onUse(priceToField(stats.price))}
      className="group text-content-muted hover:text-content focus-visible:outline-lime inline-flex cursor-pointer items-center gap-1.5 rounded-sm tabular-nums transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      <span className="bg-lime animate-pulse-dot size-1.5 shrink-0 rounded-full" aria-hidden />
      {t('market.label')}
      <span className={cn('tabular-nums', changeTone(stats.changePct))}>
        {formatPrice(stats.price, i18n.resolvedLanguage)} {formatChange(stats.changePct)}
      </span>
      <span className="text-content group-hover:decoration-lime underline decoration-dotted underline-offset-2 group-hover:decoration-solid group-hover:decoration-2">
        {t('market.use')}
      </span>
    </button>
  )
}
