import { ArrowLeft, Info } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SignedValue } from '@/components/ui/signed-value'
import { CoinIcon } from '@/features/market/coin-icon'
import { NO_VALUE } from '@/lib/number'

import { AvgPriceChart, PositionChart, PriceTimelineChart } from './charts'
import { formatDate, formatMoney, formatMoneySigned, formatQty, formatUnitPrice } from './format'
import { Metric, Panel } from './metric'
import { FeeList } from './portfolio-overview'
import { unrealizedPnl, type PairStats, type SellResult } from './stats'
import { TradesTable } from './trades-table'

export function AssetDetail({
  pair,
  price,
  onClose,
}: {
  pair: PairStats
  price: number | undefined
  onClose: () => void
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const { base, quote } = pair
  const money = (value: Parameters<typeof formatMoney>[0]) => formatMoney(value, quote, locale)
  const unitPrice = (value: Parameters<typeof formatUnitPrice>[0]) => formatUnitPrice(value, locale)
  const unrealized = unrealizedPnl(pair, price)

  const sellNote = (sell: SellResult | null) =>
    sell ? (
      <>
        {formatQty(sell.trade.qty, locale)} {base} ·{' '}
        {t('journal.metrics.at', { price: unitPrice(sell.trade.price) })} ·{' '}
        {formatDate(sell.trade.time, locale)}
      </>
    ) : undefined

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2
          id="asset-detail-heading"
          className="flex items-center gap-3 text-2xl font-semibold tracking-tight"
        >
          <CoinIcon symbol={base} size={32} />
          {t('journal.detail.heading', { pair: pair.key })}
        </h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <ArrowLeft className="size-4" aria-hidden />
          {t('journal.detail.close')}
        </Button>
      </div>

      <dl className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
        <Metric
          label={t('journal.metrics.position')}
          value={
            pair.position.eq(0)
              ? t('journal.metrics.flat')
              : `${formatQty(pair.position, locale)} ${base}`
          }
          note={
            pair.position.gt(0)
              ? `${t('journal.metrics.costBasis')}: ${money(pair.costBasis)} ${quote}`
              : undefined
          }
        />
        <Metric
          label={t('journal.metrics.avgPrice')}
          value={pair.avgPrice ? `${unitPrice(pair.avgPrice)} ${quote}` : NO_VALUE}
        />
        <Metric
          label={t('journal.metrics.realized')}
          value={
            <SignedValue value={pair.realizedPnl.toNumber()}>
              {formatMoneySigned(pair.realizedPnl, quote, locale)} {quote}
            </SignedValue>
          }
        />
        <Metric
          label={t('journal.metrics.unrealized')}
          value={
            unrealized === null ? (
              NO_VALUE
            ) : (
              <SignedValue value={unrealized.toNumber()}>
                {formatMoneySigned(unrealized, quote, locale)} {quote}
              </SignedValue>
            )
          }
          note={
            price !== undefined ? t('journal.metrics.at', { price: unitPrice(price) }) : undefined
          }
        />
        <Metric
          label={t('journal.metrics.bought')}
          value={`${formatQty(pair.boughtQty, locale)} ${base}`}
          note={t('journal.metrics.trades', { buys: pair.buyCount, sells: pair.sellCount })}
        />
        <Metric
          label={t('journal.metrics.sold')}
          value={`${formatQty(pair.soldQty, locale)} ${base}`}
        />
        <Metric label={t('journal.metrics.invested')} value={`${money(pair.invested)} ${quote}`} />
        <Metric label={t('journal.metrics.received')} value={`${money(pair.received)} ${quote}`} />
        <Metric
          label={t('journal.metrics.fees')}
          value={
            <span className="text-sm font-medium">
              {pair.fees.size > 0 ? <FeeList fees={pair.fees} locale={locale} /> : NO_VALUE}
            </span>
          }
        />
        <Metric
          label={t('journal.metrics.avgBuy')}
          value={pair.avgBuySize ? `${money(pair.avgBuySize)} ${quote}` : NO_VALUE}
        />
        <Metric
          label={t('journal.metrics.largestBuy')}
          value={pair.largestBuy ? `${money(pair.largestBuy.total)} ${quote}` : NO_VALUE}
          note={
            pair.largestBuy
              ? `${t('journal.metrics.at', { price: unitPrice(pair.largestBuy.price) })} · ${formatDate(pair.largestBuy.time, locale)}`
              : undefined
          }
        />
        <Metric
          label={t('journal.metrics.first')}
          value={formatDate(pair.firstTime, locale)}
          note={`${t('journal.metrics.last')}: ${formatDate(pair.lastTime, locale)}`}
        />
        <Metric
          label={t('journal.metrics.bestSell')}
          value={
            pair.bestSell ? (
              <SignedValue value={pair.bestSell.pnl.toNumber()}>
                {formatMoneySigned(pair.bestSell.pnl, quote, locale)} {quote}
              </SignedValue>
            ) : (
              NO_VALUE
            )
          }
          note={sellNote(pair.bestSell)}
        />
        <Metric
          label={t('journal.metrics.worstSell')}
          value={
            pair.worstSell ? (
              <SignedValue value={pair.worstSell.pnl.toNumber()}>
                {formatMoneySigned(pair.worstSell.pnl, quote, locale)} {quote}
              </SignedValue>
            ) : (
              NO_VALUE
            )
          }
          note={sellNote(pair.worstSell)}
        />
      </dl>

      {pair.unmatchedSellQty.gt(0) ? (
        <p className="border-line text-content-muted flex gap-2.5 rounded-2xl border px-4 py-3 text-sm leading-relaxed">
          <Info className="text-content-faint mt-0.5 size-4 shrink-0" aria-hidden />
          {t('journal.metrics.unmatched', {
            qty: formatQty(pair.unmatchedSellQty, locale),
            asset: base,
          })}
        </p>
      ) : null}

      <Panel title={t('journal.detail.prices')}>
        <PriceTimelineChart
          timeline={pair.timeline}
          avgPrice={pair.avgPrice?.toNumber() ?? null}
          base={base}
          quote={quote}
        />
      </Panel>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title={t('journal.detail.position')}>
          <PositionChart timeline={pair.timeline} base={base} />
        </Panel>
        <Panel title={t('journal.detail.average')}>
          <AvgPriceChart timeline={pair.timeline} quote={quote} />
        </Panel>
      </div>

      <Panel title={t('journal.detail.history')}>
        <TradesTable trades={pair.trades} base={base} quote={quote} />
      </Panel>
    </div>
  )
}
