import type { Big } from 'big.js'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SignedValue } from '@/components/ui/signed-value'
import { cn } from '@/lib/utils'

import { AllocationDonut, MonthlyVolumeChart } from './charts'
import { formatMoney, formatMoneySigned, formatQty } from './format'
import { Metric, Panel } from './metric'
import { pairPrice, type PriceState } from './prices'
import { computePortfolio, unrealizedPnl, type PairStats } from './stats'

/** Fees as "0.0123 BNB · 4.2 USDT", or null when there were none. */
export function FeeList({ fees, locale }: { fees: Map<string, Big>; locale?: string }) {
  const entries = [...fees.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  if (entries.length === 0) return null
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-0.5">
      {entries.map(([asset, amount]) => (
        <span key={asset} className="whitespace-nowrap">
          {formatQty(amount, locale)} {asset}
        </span>
      ))}
    </span>
  )
}

export function PortfolioOverview({
  pairs,
  quote,
  priceState,
}: {
  pairs: PairStats[]
  quote: string
  priceState: PriceState
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const portfolio = useMemo(() => computePortfolio(pairs, quote), [pairs, quote])

  // Summed only over positions that have a market price.
  const unrealized = priceState.prices
    ? portfolio.pairs.reduce<number | null>((sum, pair) => {
        const pnl = unrealizedPnl(pair, pairPrice(priceState.prices, pair))
        return pnl === null ? sum : (sum ?? 0) + pnl.toNumber()
      }, null)
    : null

  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
        <Metric label={t('journal.overview.trades')} value={portfolio.tradeCount} />
        <Metric
          label={t('journal.overview.invested')}
          value={formatMoney(portfolio.invested, quote, locale)}
          note={quote}
        />
        <Metric
          label={t('journal.overview.received')}
          value={formatMoney(portfolio.received, quote, locale)}
          note={quote}
        />
        <Metric
          label={t('journal.overview.realized')}
          value={
            <SignedValue value={portfolio.realizedPnl.toNumber()}>
              {formatMoneySigned(portfolio.realizedPnl, quote, locale)}
            </SignedValue>
          }
          note={quote}
        />
        <Metric
          label={t('journal.overview.unrealized')}
          value={
            unrealized === null ? (
              <span className="text-content-faint">—</span>
            ) : (
              <SignedValue value={unrealized}>
                {formatMoneySigned(unrealized, quote, locale)}
              </SignedValue>
            )
          }
          note={<PriceStatus priceState={priceState} />}
        />
      </dl>

      {/* A line of its own: fees come in many assets and would stretch a tile. */}
      <div className="border-line bg-surface-raised flex flex-wrap items-baseline gap-x-4 gap-y-1 rounded-2xl border px-4 py-3 text-sm">
        <span className="text-content-faint font-mono text-[11px] tracking-[0.16em] uppercase">
          {t('journal.overview.fees')}
        </span>
        {portfolio.fees.size > 0 ? (
          <FeeList fees={portfolio.fees} locale={locale} />
        ) : (
          <span className="text-content-faint">{t('journal.overview.noFees')}</span>
        )}
      </div>

      <p className="text-content-faint text-xs leading-relaxed">{t('journal.overview.method')}</p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('journal.overview.allocation')}>
          <AllocationDonut data={portfolio.allocation} quote={quote} />
        </Panel>
        <Panel title={t('journal.overview.volume')}>
          <MonthlyVolumeChart data={portfolio.monthly} quote={quote} />
        </Panel>
      </div>
    </div>
  )
}

function PriceStatus({ priceState }: { priceState: PriceState }) {
  const { t, i18n } = useTranslation()
  // Seconds matter: the prices refresh every 20 s.
  const time = new Intl.DateTimeFormat(i18n.resolvedLanguage, { timeStyle: 'medium' })

  return (
    <span className="flex flex-col items-start gap-1.5">
      <span className={cn(priceState.isError && 'text-loss')}>
        {/* A background refresh keeps the last time on screen instead of flashing "Loading". */}
        {priceState.isFetching && !priceState.prices
          ? t('journal.overview.loadingPrices')
          : priceState.isError
            ? t('journal.overview.pricesFailed')
            : priceState.prices
              ? t('journal.overview.pricesAt', { time: time.format(priceState.updatedAt) })
              : t('journal.overview.pricesHint')}
      </span>
      <Button
        variant="outline"
        size="sm"
        className="h-7 px-2.5 text-[11px]"
        onClick={priceState.refresh}
        disabled={priceState.isFetching}
      >
        <RefreshCw className={cn('size-3', priceState.isFetching && 'animate-spin')} aria-hidden />
        {t('journal.overview.refreshPrices')}
      </Button>
    </span>
  )
}
