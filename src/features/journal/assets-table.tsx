import { ArrowDown, ArrowUp, Calculator, ChevronRight, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router'

import { SignedValue } from '@/components/ui/signed-value'
import { Tooltip } from '@/components/ui/tooltip'
import { CoinIcon } from '@/features/market/coin-icon'
import { formatSigned, NO_VALUE } from '@/lib/number'
import { cn } from '@/lib/utils'

import { calculatorLink } from './calculator-link'
import { formatMoney, formatMoneySigned, formatQty, formatUnitPrice } from './format'
import { pairPrice, type PriceState } from './prices'
import { unrealizedPct, unrealizedPnl, type PairKey, type PairStats } from './stats'

type SortKey = 'pair' | 'value' | 'price' | 'invested' | 'realized' | 'unrealized'
type Sort = { key: SortKey; dir: 'asc' | 'desc' }

/**
 * Realized PnL is hidden for now; flip this to bring the column back. The
 * figure is still computed and shown in the asset detail.
 */
const SHOW_REALIZED = false

type Row = {
  pair: PairStats
  /** Live market price; undefined until prices load or for unlisted pairs. */
  price: number | undefined
  /** What the open position is worth now, in the quote; null without a price. */
  value: number | null
  unrealized: number | null
  unrealizedPct: number | null
}

/** Sort values; nulls (no average, no price) always sink to the bottom. */
function sortValue(row: Row, key: SortKey): number | string | null {
  switch (key) {
    case 'pair':
      return row.pair.base
    // Units of different coins do not compare; their worth in the quote does.
    case 'value':
      return row.value
    case 'price':
      return row.price ?? null
    case 'invested':
      return row.pair.invested.toNumber()
    case 'realized':
      return row.pair.realizedPnl.toNumber()
    case 'unrealized':
      return row.unrealized
  }
}

function compareRows(a: Row, b: Row, sort: Sort): number {
  const x = sortValue(a, sort.key)
  const y = sortValue(b, sort.key)
  if (x === null || y === null) return x === y ? 0 : x === null ? 1 : -1
  const order = typeof x === 'string' ? x.localeCompare(y as string) : x - (y as number)
  return sort.dir === 'asc' ? order : -order
}

/** Two stacked figures in one cell, Binance-style: the main one, then a muted one. */
function Stacked({ top, bottom }: { top: React.ReactNode; bottom: React.ReactNode }) {
  return (
    <div className="flex flex-col items-end gap-0.5">
      <span>{top}</span>
      <span className="text-content-faint text-xs">{bottom}</span>
    </div>
  )
}

const FAINT_DASH = <span className="text-content-faint">{NO_VALUE}</span>

export function AssetsTable({
  pairs,
  quote,
  selected,
  onSelect,
  priceState,
}: {
  pairs: PairStats[]
  /** Every row is quoted in this; the money columns name it in their header. */
  quote: string
  selected: PairKey | null
  onSelect: (key: PairKey) => void
  priceState: PriceState
}) {
  const { t, i18n } = useTranslation()
  const locale = i18n.resolvedLanguage
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<Sort>({ key: 'invested', dir: 'desc' })

  const rows = useMemo(() => {
    const q = query.trim().toUpperCase()
    return pairs
      .filter((pair) => !q || pair.base.includes(q) || pair.key.includes(q))
      .map((pair) => {
        const price = pairPrice(priceState.prices, pair)
        const value = pair.position.eq(0)
          ? 0
          : price === undefined
            ? null
            : pair.position.times(price).toNumber()
        return {
          pair,
          price,
          value,
          unrealized: unrealizedPnl(pair, price)?.toNumber() ?? null,
          unrealizedPct: unrealizedPct(pair, price)?.toNumber() ?? null,
        }
      })
      .sort((a, b) => compareRows(a, b, sort))
  }, [pairs, query, sort, priceState.prices])

  const allColumns: { key: SortKey; label: string; align: 'left' | 'right' }[] = [
    { key: 'pair', label: t('journal.assets.pair'), align: 'left' },
    { key: 'value', label: t('journal.assets.amount'), align: 'right' },
    { key: 'price', label: `${t('journal.assets.priceAvg')}, ${quote}`, align: 'right' },
    { key: 'invested', label: `${t('journal.assets.invested')}, ${quote}`, align: 'right' },
    { key: 'realized', label: `${t('journal.assets.realized')}, ${quote}`, align: 'right' },
    { key: 'unrealized', label: `${t('journal.assets.unrealizedPnl')}, ${quote}`, align: 'right' },
  ]
  const columns = SHOW_REALIZED
    ? allColumns
    : allColumns.filter((column) => column.key !== 'realized')

  const toggleSort = (key: SortKey) =>
    setSort((current) =>
      current.key === key
        ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
        : // Text sorts A→Z first, figures largest first.
          { key, dir: key === 'pair' ? 'asc' : 'desc' },
    )

  return (
    <div className="flex flex-col gap-4">
      <label className="border-line bg-surface-raised focus-within:border-lime flex max-w-xs items-center gap-2 rounded-full border px-3.5">
        <Search className="text-content-faint size-4 shrink-0" aria-hidden />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t('journal.assets.search')}
          aria-label={t('journal.assets.search')}
          spellCheck={false}
          autoComplete="off"
          className="h-10 w-full min-w-0 bg-transparent text-sm uppercase outline-none placeholder:normal-case"
        />
      </label>

      {/* Scrolls sideways on narrow screens instead of squeezing the figures. */}
      {/* relative: without it, absolutely positioned bits inside (the row link,
          sr-only text) take the page as their containing block and escape the
          horizontal scroll, widening the whole page on phones. */}
      <div className="rounded-card border-line relative overflow-x-auto border">
        {/* nowrap: a figure or header split over two lines is harder to scan than a scroll. */}
        <table className="w-full min-w-[820px] text-sm whitespace-nowrap">
          <thead className="bg-surface-raised">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  aria-sort={
                    sort.key === column.key
                      ? sort.dir === 'asc'
                        ? 'ascending'
                        : 'descending'
                      : undefined
                  }
                  className={cn(
                    'px-2.5 py-3 font-normal',
                    column.align === 'right' && 'text-right',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => toggleSort(column.key)}
                    aria-label={t('journal.assets.sortBy', { column: column.label })}
                    className={cn(
                      'text-content-faint hover:text-content inline-flex cursor-pointer items-center gap-1 font-mono text-[11px] tracking-[0.08em] uppercase',
                      sort.key === column.key && 'text-content',
                    )}
                  >
                    {column.label}
                    {sort.key === column.key ? (
                      sort.dir === 'asc' ? (
                        <ArrowUp className="size-3" aria-hidden />
                      ) : (
                        <ArrowDown className="size-3" aria-hidden />
                      )
                    ) : null}
                  </button>
                </th>
              ))}
              <th scope="col" className="px-2.5 py-3">
                <span className="sr-only">{t('journal.assets.actions')}</span>
              </th>
              {/* The chevron column is decoration; the pair button names the row. */}
              <th scope="col" className="w-8" aria-hidden />
            </tr>
          </thead>
          <tbody>
            {rows.map(({ pair, price, value, unrealized, unrealizedPct }) => (
              <tr
                key={pair.key}
                className={cn(
                  // relative: the pair button's ::after stretches over this row.
                  'border-line hover:bg-lime/10 group relative border-t transition-colors',
                  selected === pair.key && 'bg-lime/15',
                )}
              >
                <td className="px-2.5 py-3">
                  {/* The pair cell holds the real control; the row highlight just follows it.
                      Its ::after covers the whole row, so hovering anywhere on the
                      row opens this tooltip, anchored at the pair name. */}
                  <Tooltip
                    content={t('journal.assets.openHint', { pair: pair.base })}
                    align="start"
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(pair.key)}
                      aria-label={t('journal.assets.open', { pair: pair.key })}
                      aria-current={selected === pair.key ? 'true' : undefined}
                      className="flex cursor-pointer items-center gap-2.5 text-left after:absolute after:inset-0 focus-visible:outline-none"
                    >
                      <CoinIcon symbol={pair.base} size={28} />
                      <span className="flex flex-col">
                        <span className="font-semibold">{pair.base}</span>
                        <span className="text-content-faint font-mono text-[11px]">
                          /{pair.quote}
                        </span>
                      </span>
                    </button>
                  </Tooltip>
                </td>
                <td className="px-2.5 py-3 text-right tabular-nums">
                  {pair.position.eq(0) ? (
                    <span className="text-content-faint">{t('journal.metrics.flat')}</span>
                  ) : (
                    <Stacked
                      top={
                        <>
                          {formatQty(pair.position, locale)}{' '}
                          <span className="text-content-faint text-xs">{pair.base}</span>
                        </>
                      }
                      bottom={
                        value === null
                          ? NO_VALUE
                          : `${formatMoney(value, pair.quote, locale)} ${pair.quote}`
                      }
                    />
                  )}
                </td>
                <td className="px-2.5 py-3 text-right tabular-nums">
                  <Stacked
                    top={price === undefined ? FAINT_DASH : formatUnitPrice(price, locale)}
                    bottom={pair.avgPrice ? formatUnitPrice(pair.avgPrice, locale) : NO_VALUE}
                  />
                </td>
                <td className="px-2.5 py-3 text-right tabular-nums">
                  <Stacked
                    top={formatMoney(pair.invested, pair.quote, locale)}
                    bottom={t('journal.assets.tradeCount', { count: pair.trades.length })}
                  />
                </td>
                {SHOW_REALIZED ? (
                  <td className="px-2.5 py-3 text-right tabular-nums">
                    <SignedValue value={pair.realizedPnl.toNumber()}>
                      {formatMoneySigned(pair.realizedPnl, pair.quote, locale)}
                    </SignedValue>
                  </td>
                ) : null}
                <td className="px-2.5 py-3 text-right tabular-nums">
                  {unrealized === null || unrealizedPct === null ? (
                    FAINT_DASH
                  ) : (
                    <Stacked
                      top={
                        <SignedValue value={unrealized}>
                          {formatMoneySigned(unrealized, pair.quote, locale)}
                        </SignedValue>
                      }
                      bottom={
                        <SignedValue value={unrealizedPct}>
                          {formatSigned(unrealizedPct, locale)}%
                        </SignedValue>
                      }
                    />
                  )}
                </td>
                <td className="px-2.5 py-3 text-center">
                  <CalculatorAction pair={pair} price={price} />
                </td>
                <td className="text-content-faint group-hover:text-content pr-3">
                  <ChevronRight className="size-4" aria-hidden />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 ? (
          <p className="text-content-faint px-4 py-6 text-center text-sm">
            {t('journal.assets.empty', { query })}
          </p>
        ) : null}
      </div>
    </div>
  )
}

/** Opens the spot calculator prefilled with this position; nothing for a flat one. */
function CalculatorAction({ pair, price }: { pair: PairStats; price: number | undefined }) {
  const { t } = useTranslation()
  const to = calculatorLink(pair, price)
  if (!to) return null

  return (
    <Tooltip content={t('journal.assets.calculatorHint', { pair: pair.base })}>
      <Link
        to={to}
        aria-label={t('journal.assets.openCalculator', { pair: pair.base })}
        // relative z-10: sits above the row-wide click target of the pair button.
        className="border-line text-content-muted hover:border-lime hover:bg-lime hover:text-lime-ink focus-visible:ring-lime/40 relative z-10 inline-flex size-8 items-center justify-center rounded-full border transition-colors focus-visible:ring-4 focus-visible:outline-none"
      >
        <Calculator className="size-4" aria-hidden />
      </Link>
    </Tooltip>
  )
}
