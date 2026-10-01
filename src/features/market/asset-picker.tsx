import { useVirtualizer } from '@tanstack/react-virtual'
import { ChevronDown, Search, X } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { formatPrice } from '@/lib/number'
import { cn } from '@/lib/utils'

import { POPULAR_ASSETS, QUOTE_ASSET } from './binance'
import { CoinIcon } from './coin-icon'
import { changeTone, formatChange } from './format'
import { orderAssets } from './search'
import { useStats, useStatsBatches, useUsdtPrices } from './use-market'

/** Fixed row height: it lets the virtualizer place rows without measuring them. */
const ROW_HEIGHT = 44
/** Rows rendered beyond the visible ones, so a quick flick does not show gaps. */
const OVERSCAN = 6
/** 24h stats are fetched per block of rows; Binance takes up to 100 symbols. */
const BATCH_SIZE = 20

type AssetPickerProps = {
  value: string | null
  onChange: (asset: string | null) => void
  className?: string
}

export function AssetPicker({ value, onChange, className }: AssetPickerProps) {
  const { t, i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const locale = i18n.resolvedLanguage

  const prices = useUsdtPrices(open)
  const selected = useStats(value)

  const assets = useMemo(
    () => (prices.data ? orderAssets(prices.data.keys(), query, POPULAR_ASSETS) : []),
    [prices.data, query],
  )

  // The scroll container lives in a Radix portal, which mounts its content a
  // render after this component. A plain ref would stay null on that render
  // and, since filling a ref never re-renders, the virtualizer would never see
  // the element: an empty list on reopening. State re-renders when it attaches.
  const [listElement, setListElement] = useState<HTMLDivElement | null>(null)
  // The list holds every USDT pair on Binance (~700), so only the rows in
  // view are rendered.
  // TanStack Virtual returns fresh functions each render, which React Compiler
  // cannot memoise. The compiler is not enabled here, and nothing below passes
  // the virtualizer into memoised children, so the warning does not apply.
  // oxlint-disable-next-line react/incompatible-library
  const virtualizer = useVirtualizer({
    count: assets.length,
    getScrollElement: () => listElement,
    estimateSize: () => ROW_HEIGHT,
    overscan: OVERSCAN,
  })
  const rows = virtualizer.getVirtualItems()

  // The blocks of rows on screen right now; each is one 24h-stats request, so
  // colours load as the user scrolls rather than all ~1 MB up front.
  const blockKey = [...new Set(rows.map((row) => Math.floor(row.index / BATCH_SIZE)))].join(',')
  const batches = useMemo(
    () =>
      blockKey === ''
        ? []
        : blockKey
            .split(',')
            .map(Number)
            .map((block) => assets.slice(block * BATCH_SIZE, (block + 1) * BATCH_SIZE)),
    [blockKey, assets],
  )
  const stats = useStatsBatches(open ? batches : [])

  const choose = (asset: string | null) => {
    onChange(asset)
    setOpen(false)
    setQuery('')
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger
        className={cn(
          'border-line bg-surface-raised hover:border-lime data-[state=open]:border-lime focus-visible:outline-lime ease-brand',
          'inline-flex h-10 cursor-pointer items-center gap-2.5 rounded-full border pr-3 pl-2.5',
          'font-mono text-[13px] transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2',
          className,
        )}
      >
        {value ? (
          <>
            <CoinIcon symbol={value} size={20} />
            <span className="font-semibold">{value}</span>
            <span className={cn('tabular-nums', changeTone(selected.data?.changePct))}>
              {selected.data ? formatPrice(selected.data.price, locale) : '…'}
            </span>
            {selected.data ? (
              <span className={cn('text-[11px] tabular-nums', changeTone(selected.data.changePct))}>
                {formatChange(selected.data.changePct)}
              </span>
            ) : null}
          </>
        ) : (
          <span className="text-content-muted px-1">{t('market.pick')}</span>
        )}
        <ChevronDown className="text-content-faint size-3.5" aria-hidden />
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="border-line bg-surface-raised z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border shadow-[0_18px_48px_-18px_rgba(0,0,0,0.5)]"
        >
          <label className="border-line flex items-center gap-2 border-b px-3">
            <Search className="text-content-faint size-4 shrink-0" aria-hidden />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value)
                // A new result set starts at its best match, not mid-list.
                listElement?.scrollTo({ top: 0 })
              }}
              onKeyDown={(event) => {
                // Enter takes the best match, so "sol⏎" is a complete gesture.
                const first = assets[0]
                if (event.key === 'Enter' && first) choose(first)
              }}
              placeholder={t('market.search')}
              aria-label={t('market.search')}
              spellCheck={false}
              autoComplete="off"
              className="h-11 w-full min-w-0 bg-transparent font-mono text-sm uppercase outline-none placeholder:normal-case"
            />
          </label>

          {value ? (
            <button
              type="button"
              onClick={() => choose(null)}
              className="text-content-muted hover:bg-lime/20 hover:text-content border-line flex w-full cursor-pointer items-center gap-2.5 border-b px-4 py-2.5 text-left text-sm"
            >
              <X className="size-4" aria-hidden />
              {t('market.clear')}
            </button>
          ) : null}

          {prices.isPending ? (
            <ListSkeleton label={t('market.loading')} />
          ) : prices.isError ? (
            <p className="text-content-faint px-4 py-3 text-sm">{t('market.unavailable')}</p>
          ) : assets.length === 0 ? (
            <p className="text-content-faint px-4 py-3 text-sm">{t('market.noResults')}</p>
          ) : (
            <div ref={setListElement} className="max-h-80 overflow-y-auto p-1.5">
              <ul className="relative" style={{ height: virtualizer.getTotalSize() }}>
                {rows.map((row) => {
                  const asset = assets[row.index] as string
                  const rowStats = stats.get(asset)
                  const price = rowStats?.price ?? prices.data.get(asset) ?? 0
                  const tone = changeTone(rowStats?.changePct)
                  return (
                    <li
                      key={asset}
                      className="absolute inset-x-0 top-0"
                      style={{ height: row.size, transform: `translateY(${row.start}px)` }}
                    >
                      <button
                        type="button"
                        onClick={() => choose(asset)}
                        aria-current={asset === value ? 'true' : undefined}
                        className={cn(
                          'hover:bg-lime/20 flex h-full w-full cursor-pointer items-center gap-2.5 rounded-lg px-2.5 text-left',
                          'focus-visible:bg-lime/20 outline-none',
                          asset === value && 'bg-line',
                        )}
                      >
                        <CoinIcon symbol={asset} size={20} />
                        <span className="font-mono text-sm font-semibold">{asset}</span>
                        <span className="text-content-faint font-mono text-[11px]">
                          /{QUOTE_ASSET}
                        </span>
                        <span className="ml-auto flex flex-col items-end leading-tight">
                          <span className={cn('font-mono text-xs tabular-nums', tone)}>
                            {formatPrice(price, locale)}
                          </span>
                          <span className={cn('font-mono text-[10px] tabular-nums', tone)}>
                            {rowStats ? (
                              formatChange(rowStats.changePct)
                            ) : (
                              <span className="bg-line inline-block h-2 w-9 animate-pulse rounded-sm align-middle" />
                            )}
                          </span>
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}

          <p className="border-line text-content-faint border-t px-4 py-2 text-[11px]">
            {t('market.source')}
          </p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}

/** Rows shown while the coin list loads, shaped like the real ones. */
const SKELETON_ROWS = 7

function ListSkeleton({ label }: { label: string }) {
  return (
    // <output> announces the loading state like role="status" would.
    <output className="block p-1.5" aria-label={label}>
      {Array.from({ length: SKELETON_ROWS }, (_, index) => (
        <div
          key={index}
          className="flex items-center gap-2.5 px-2.5"
          style={{ height: ROW_HEIGHT }}
          aria-hidden
        >
          <span className="bg-line size-5 shrink-0 animate-pulse rounded-full" />
          <span className="bg-line h-3 w-12 animate-pulse rounded-sm" />
          <span className="bg-line h-2.5 w-9 animate-pulse rounded-sm opacity-60" />
          <span className="ml-auto flex flex-col items-end gap-1.5">
            <span className="bg-line h-2.5 w-14 animate-pulse rounded-sm" />
            <span className="bg-line h-2 w-9 animate-pulse rounded-sm opacity-60" />
          </span>
        </div>
      ))}
    </output>
  )
}
