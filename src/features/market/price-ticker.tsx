import { useTranslation } from 'react-i18next'

import { Marquee } from '@/components/ui/marquee'
import { formatPrice } from '@/lib/number'
import { cn } from '@/lib/utils'

import { POPULAR_ASSETS, QUOTE_ASSET } from './binance'
import { CoinIcon } from './coin-icon'
import { changeTone, formatChange } from './format'
import { useTickerStats } from './use-market'

/** Seconds per loop for twenty items: an unhurried pace you can read. */
const LOOP_SECONDS = 240

/**
 * The home-page ticker: the popular coins scrolling past with their live price
 * and 24h move. Until the first response the symbols scroll with placeholders,
 * so the strip never jumps in height or appears late.
 */
export function PriceTicker() {
  const { t, i18n } = useTranslation()
  const { data: stats } = useTickerStats()

  const items = POPULAR_ASSETS.map((asset) => {
    const entry = stats?.get(asset)
    const tone = changeTone(entry?.changePct)
    return {
      key: asset,
      node: (
        <span className="flex items-center gap-2.5 font-mono text-sm whitespace-nowrap">
          <CoinIcon symbol={asset} size={20} />
          <span className="font-semibold">{asset}</span>
          <span className="text-content-faint text-xs">/{QUOTE_ASSET}</span>
          {entry ? (
            <>
              <span className={cn('tabular-nums', tone)}>
                {formatPrice(entry.price, i18n.resolvedLanguage)}
              </span>
              <span className={cn('text-xs tabular-nums', tone)}>
                {formatChange(entry.changePct)}
              </span>
            </>
          ) : (
            <span className="bg-line h-3 w-20 animate-pulse rounded-sm" />
          )}
        </span>
      ),
    }
  })

  return <Marquee items={items} durationSeconds={LOOP_SECONDS} label={t('market.ticker')} />
}
