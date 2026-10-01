import { ArrowDown, ArrowUp } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { cn } from '@/lib/utils'

import type { Side, Trade } from './csv'
import { formatDateTime, formatMoney, formatQty, formatUnitPrice } from './format'

/** Rows added per "show more": enough to scan, few enough to render instantly. */
const PAGE = 100
const DAY_MS = 86_400_000

const PERIODS = ['all', 'd7', 'd30', 'd90', 'd365'] as const
type Period = (typeof PERIODS)[number]
const PERIOD_DAYS: Record<Exclude<Period, 'all'>, number> = { d7: 7, d30: 30, d90: 90, d365: 365 }

type SortKey = 'time' | 'price' | 'qty' | 'total'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

export function TradesTable({
  trades,
  base,
  quote,
}: {
  trades: Trade[]
  base: string
  quote: string
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
    const value = (trade: Trade) => (sort.key === 'time' ? trade.time : Number(trade[sort.key]))
    return trades
      .filter((trade) => (side === 'all' || trade.side === side) && trade.time >= since)
      .sort((a, b) => (sort.dir === 'asc' ? value(a) - value(b) : value(b) - value(a)))
  }, [trades, side, period, sort])

  const columns: { key: SortKey | null; label: string; align: 'left' | 'right' }[] = [
    { key: 'time', label: t('journal.table.date'), align: 'left' },
    { key: null, label: t('journal.table.side'), align: 'left' },
    // One pair per table, so each unit is said once, in the header.
    { key: 'price', label: `${t('journal.table.price')}, ${quote}`, align: 'right' },
    { key: 'qty', label: `${t('journal.table.qty')}, ${base}`, align: 'right' },
    { key: 'total', label: `${t('journal.table.total')}, ${quote}`, align: 'right' },
    { key: null, label: t('journal.table.fee'), align: 'right' },
  ]

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
            { value: 'buy', ariaLabel: t('journal.side.buy'), label: `▲ ${t('journal.side.buy')}` },
            {
              value: 'sell',
              ariaLabel: t('journal.side.sell'),
              label: `▼ ${t('journal.side.sell')}`,
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
        <table className="w-full min-w-[680px] text-sm">
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
                  {column.key ? (
                    <SortButton
                      label={column.label}
                      active={sort.key === column.key}
                      dir={sort.dir}
                      onClick={() => {
                        const key = column.key as SortKey
                        setSort((current) =>
                          current.key === key
                            ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
                            : { key, dir: 'desc' },
                        )
                      }}
                    />
                  ) : (
                    column.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, limit).map((trade, index) => (
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
                    className={cn('mr-1.5', trade.side === 'buy' ? 'text-chart-1' : 'text-chart-2')}
                  >
                    {trade.side === 'buy' ? '▲' : '▼'}
                  </span>
                  {t(`journal.side.${trade.side}`)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatUnitPrice(trade.price, locale)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatQty(trade.qty, locale)}
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums">
                  {formatMoney(trade.total, quote, locale)}
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
