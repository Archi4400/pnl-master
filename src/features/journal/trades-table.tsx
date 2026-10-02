import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SignedValue } from '@/components/ui/signed-value'
import { formatSigned, NO_VALUE } from '@/lib/number'
import { cn } from '@/lib/utils'

import type { Side, Trade } from './csv'
import {
  formatDateTime,
  formatMoney,
  formatMoneySigned,
  formatQty,
  formatUnitPrice,
} from './format'
import { tradePnl } from './stats'

/** Rows added per "show more": enough to scan, few enough to render instantly. */
const PAGE = 100
const DAY_MS = 86_400_000

const PERIODS = ['all', 'd7', 'd30', 'd90', 'd365'] as const
type Period = (typeof PERIODS)[number]
const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { d7: 7, d30: 30, d90: 90, d365: 365 }

type SortKey = 'time' | 'price' | 'qty' | 'pnl'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

export function TradesTable({
  trades,
  base,
  quote,
  price,
}: {
  trades: Trade[]
  base: string
  quote: string
  /** Live market price; the PnL column fills in once it loads. */
  price: number | undefined
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const [side, setSide] = useState<'all' | Side>('all')
  const [period, setPeriod] = useState<Period>('all')
  const [sort, setSort] = useState<Sort>({ key: 'time', dir: 'desc' })
  const [limit, setLimit] = useState(PAGE)

  const rows = useMemo(() => {
    // Periods count back from the newest trade, not from today: an old export
    // should still show its own "last 30 days" rather than nothing.
    const newest = trades.reduce((max, trade) => Math.max(max, trade.time), 0)
    const since = period === 'all' ? -Infinity : newest - PERIOD_DAYS[period] * DAY_MS
    const withPnl = trades
      .filter((trade) => (side === 'all' || trade.side === side) && trade.time >= since)
      .map((trade) => ({ trade, result: tradePnl(trade, price) }))
    const value = ({ trade, result }: (typeof withPnl)[number]): number | null =>
      sort.key === 'time'
        ? trade.time
        : sort.key === 'pnl'
          ? (result?.pnl.toNumber() ?? null)
          : Number(trade[sort.key])
    return withPnl.sort((a, b) => {
      const x = value(a)
      const y = value(b)
      // Rows without a figure (prices not loaded) sink to the bottom either way.
      if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
      return sort.dir === 'asc' ? x - y : y - x
    })
  }, [trades, side, period, sort, price])

  const columns: {
    key: SortKey | null
    label: string
    align: 'left' | 'right'
    hint?: string
  }[] = [
    { key: 'time', label: t('journal.table.date'), align: 'left' },
    { key: null, label: t('journal.table.side'), align: 'left' },
    // Two figures per cell, Binance-style; the header names both, top first.
    { key: 'price', label: `${t('journal.table.priceNow')}, ${quote}`, align: 'right' },
    { key: 'qty', label: t('journal.table.qtyTotal'), align: 'right' },
    {
      key: 'pnl',
      label: `${t('journal.table.pnl')}, ${quote}`,
      align: 'right',
      hint: t('journal.table.pnlHint'),
    },
    { key: null, label: t('journal.table.fee'), align: 'right' },
  ]

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: 'desc' },
    )

  const changeFilter = (apply: () => void) => {
    apply()
    setLimit(PAGE)
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          label={t('journal.table.side')}
          value={side}
          onValueChange={(next) => changeFilter(() => setSide(next as 'all' | Side))}
          className="w-full max-w-xs"
          options={[
            { value: 'all', ariaLabel: t('journal.table.all'), label: t('journal.table.all') },
            {
              value: 'buy',
              ariaLabel: t('journal.side.buy'),
              label: <SideFilterLabel side="buy" />,
            },
            {
              value: 'sell',
              ariaLabel: t('journal.side.sell'),
              label: <SideFilterLabel side="sell" />,
            },
          ]}
        />
        <label className="text-content-faint flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] uppercase">
          {t('journal.table.period')}
          <select
            value={period}
            onChange={(event) => changeFilter(() => setPeriod(event.target.value as Period))}
            className="border-line bg-surface-raised text-content focus:border-lime h-10 cursor-pointer rounded-full border px-3 font-sans text-sm tracking-normal normal-case outline-none"
          >
            {PERIODS.map((option) => (
              <option key={option} value={option}>
                {t(`journal.table.periods.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <span className="text-content-faint ml-auto text-xs">
          {t('journal.table.count', {
            shown: Math.min(limit, rows.length),
            count: rows.length,
          })}
        </span>
      </div>

      {/* relative keeps absolutely positioned descendants inside the scroll. */}
      <div className="rounded-card border-line relative overflow-x-auto border">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-surface-raised">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.label}
                  scope="col"
                  aria-sort={
                    column.key && sort.key === column.key
                      ? sort.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={cn(
                    'text-content-faint px-4 py-3 font-mono text-[11px] font-normal tracking-[0.12em] uppercase',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  {column.hint ? (
                    <span className="inline-flex items-center gap-1.5">
                      {column.key ? (
                        <SortButton
                          label={column.label}
                          active={sort.key === column.key}
                          dir={sort.dir}
                          onClick={() => toggleSort(column.key as SortKey)}
                        />
                      ) : (
                        column.label
                      )}
                      <Hint label={column.label}>{column.hint}</Hint>
                    </span>
                  ) : column.key ? (
                    <SortButton
                      label={column.label}
                      active={sort.key === column.key}
                      dir={sort.dir}
                      onClick={() => toggleSort(column.key as SortKey)}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map(({ trade, result }, index) => (
              // Two fills can share every field; position in the sorted list
              // is the only stable identity they have.
              // oxlint-disable-next-line react/no-array-index-key
              <tr key={`${trade.time}-${index}`} className="border-line border-t">
                <td className="px-4 py-2.5 whitespace-nowrap tabular-nums">
                  {formatDateTime(trade.time, locale)}
                </td>
                <td className="px-4 py-2.5 font-medium whitespace-nowrap">
                  {/* The arrow carries the chart colour; the word stays in ink. */}
                  <span
                    aria-hidden
                    className={cn('mr-1.5', trade.side === 'buy' ? 'text-chart-buy' : 'text-loss')}
                  >
                    {trade.side === 'buy' ? '▲' : '▼'}
                  </span>
                  {t(`journal.side.${trade.side}`)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <Stacked
                    top={formatUnitPrice(trade.price, locale)}
                    bottom={price === undefined ? NO_VALUE : formatUnitPrice(price, locale)}
                  />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  <Stacked
                    top={
                      <>
                        {formatQty(trade.qty, locale)}{' '}
                        <span className="text-content-faint text-xs">{base}</span>
                      </>
                    }
                    bottom={`${formatMoney(trade.total, quote, locale)} ${quote}`}
                  />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {result === null ? (
                    <span className="text-content-faint">{NO_VALUE}</span>
                  ) : (
                    <Stacked
                      top={
                        <SignedValue value={result.pnl.toNumber()}>
                          {formatMoneySigned(result.pnl, quote, locale)}
                        </SignedValue>
                      }
                      bottom={
                        <SignedValue value={result.pct.toNumber()}>
                          {formatSigned(result.pct.toNumber(), locale)}%
                        </SignedValue>
                      }
                    />
                  )}
                </td>
                <td className="text-content-muted px-4 py-2.5 text-right whitespace-nowrap tabular-nums">
                  {formatQty(trade.fee, locale)} {trade.feeAsset}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="text-content-faint px-4 py-6 text-center text-sm">
            {t('journal.table.empty')}
          </p>
        ) : null}
      </div>

      {rows.length > limit ? (
        <Button
          variant="outline"
          size="sm"
          className="self-center"
          onClick={() => setLimit(limit + PAGE)}
        >
          {t('journal.table.showMore', { count: Math.min(PAGE, rows.length - limit) })}
        </Button>
      ) : null}
    </div>
  )
}

/** Two stacked figures in one cell: the main one, then a muted one. */
function Stacked({ top, bottom }: { top: React.ReactNode; bottom: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-0.5 whitespace-nowrap">
      <span>{top}</span>
      <span className="text-content-faint text-xs">{bottom}</span>
    </div>
  )
}

function SortButton({
  label,
  active,
  dir,
  onClick,
}: {
  label: string
  active: boolean
  dir: 'asc' | 'desc'
  onClick: () => void
}) {
  const { t } = useTranslation()
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={t('journal.assets.sortBy', { column: label })}
      className={cn(
        'hover:text-content inline-flex cursor-pointer items-center gap-1 uppercase',
        active && 'text-content',
      )}
    >
      {label}
      {active ? (
        dir === 'asc' ? (
          <ArrowUp className="size-3" aria-hidden />
        ) : (
          <ArrowDown className="size-3" aria-hidden />
        )
      ) : null}
    </button>
  )
}

/**
 * A side filter option: the coloured ▲/▼ the charts use, then the word. On
 * the selected (lime) segment the glyph takes the label colour, since a lime
 * arrow would vanish into it.
 */
function SideFilterLabel({ side }: { side: Side }) {
  const { t } = useTranslation()
  return (
    <>
      <span
        aria-hidden
        className={cn(
          'mr-1',
          side === 'buy' ? 'text-chart-buy' : 'text-loss',
          'in-data-[state=on]:text-current',
        )}
      >
        {side === 'buy' ? '▲' : '▼'}
      </span>
      {t(`journal.side.${side}`)}
    </>
  )
}
