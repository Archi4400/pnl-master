import type { Big } from 'big.js'
import { RefreshCw } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SignedValue } from '@/components/ui/signed-value'
import { formatSigned } from '@/lib/number'
import { cn } from '@/lib/utils'

import { AllocationDonut, MonthlyVolumeChart } from './charts'
import { formatMoney, formatMoneySigned, formatQty } from './format'
import { MetricGroup, Panel } from './metric'
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

  // Summed only over positions that have a market price; null until prices load.
  const unrealized = priceState.prices
    ? portfolio.pairs.reduce((sum, pair) => {
        const pnl = unrealizedPnl(pair, pairPrice(priceState.prices, pair))
        return pnl === null ? sum : sum + pnl.toNumber()
      }, 0)
    : null
  // Invested plus every gain and loss: received from sales plus what is still held, at market.
  const equity =
    unrealized === null
      ? null
      : portfolio.invested.plus(portfolio.realizedPnl).toNumber() + unrealized
  // Equity against what went in: the colour and the return of the whole portfolio.
  const totalPnl = equity === null ? null : equity - portfolio.invested.toNumber()
  const totalReturn =
    totalPnl === null || portfolio.invested.eq(0)
      ? null
      : (totalPnl / portfolio.invested.toNumber()) * 100
  const buyCount = portfolio.pairs.reduce((sum, pair) => sum + pair.buyCount, 0)
  const sellCount = portfolio.pairs.reduce((sum, pair) => sum + pair.sellCount, 0)
  const pending = <span className="text-content-faint">—</span>
  const money = (value: Big) => `${formatMoney(value, quote, locale)} ${quote}`
  const signedMoney = (value: Big | number) => (
    <SignedValue value={typeof value === 'number' ? value : value.toNumber()}>
      {formatMoneySigned(value, quote, locale)} {quote}
    </SignedValue>
  )

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetricGroup
          rows={[
            {
              label: t('journal.overview.trades'),
              value: portfolio.tradeCount,
              note: (
                <span className="flex flex-wrap gap-x-3">
                  <span>
                    <span className="text-chart-buy" aria-hidden>
                      ▲{' '}
                    </span>
                    {t('journal.side.buy')} {buyCount}
                  </span>
                  <span>
                    <span className="text-loss" aria-hidden>
                      ▼{' '}
                    </span>
                    {t('journal.side.sell')} {sellCount}
                  </span>
                </span>
              ),
            },
          ]}
        />
        <MetricGroup
          rows={[
            { label: t('journal.overview.invested'), value: money(portfolio.invested) },
            {
              label: t('journal.overview.equity'),
              value:
                equity === null || totalPnl === null ? (
                  pending
                ) : (
                  <SignedValue value={totalPnl}>
                    {formatMoney(equity, quote, locale)} {quote}
                  </SignedValue>
                ),
              note:
                totalReturn === null || totalPnl === null ? undefined : (
                  <SignedValue value={totalPnl}>
                    {t('journal.overview.equityReturn', {
                      percent: `${formatSigned(totalReturn, locale)}%`,
                    })}
                  </SignedValue>
                ),
              hint: t('journal.overview.equityHint'),
            },
          ]}
        />
        <MetricGroup
          rows={[
            { label: t('journal.overview.received'), value: money(portfolio.received) },
            { label: t('journal.overview.realized'), value: signedMoney(portfolio.realizedPnl) },
          ]}
        />
        <MetricGroup
          rows={[
            {
              label: t('journal.overview.unrealized'),
              value: unrealized === null ? pending : signedMoney(unrealized),
              note: <PriceStatus priceState={priceState} />,
            },
          ]}
        />
      </div>

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
