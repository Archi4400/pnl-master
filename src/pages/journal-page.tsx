import { FileUp, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Button } from '@/components/ui/button'
import { ConfirmDialog } from '@/components/ui/confirm-dialog'
import { Marker } from '@/components/ui/marker'
import { SectionLabel } from '@/components/ui/section-label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { AssetDetail } from '@/features/journal/asset-detail'
import { AssetsTable } from '@/features/journal/assets-table'
import { formatDateTime } from '@/features/journal/format'
import { HiddenFileInput, ImportDropzone, ImportNotice } from '@/features/journal/import-panel'
import { PortfolioOverview } from '@/features/journal/portfolio-overview'
import { pairPrice, type PriceState } from '@/features/journal/prices'
import { quoteAssets, type PairKey } from '@/features/journal/stats'
import { usePairStats, useStoredImport, useTradesImport } from '@/features/journal/use-journal'
import { useAllPrices } from '@/features/market/use-market'

/** "BTC/USDT" ↔ "BTC-USDT": a slash would be escaped in the address bar. */
const toParam = (key: PairKey) => key.replace('/', '-')
const fromParam = (param: string | null) => (param ? param.replace('-', '/') : null)

/**
 * Trade journal: a Binance spot trade-history CSV, analysed in the browser.
 *
 * Loaded lazily by the router — the charting library only ships to people who
 * open this page.
 */
export function JournalPage() {
  const { t, i18n } = useTranslation()
  const stored = useStoredImport()
  const { state, importFile, reset, dismiss } = useTradesImport()
  const pairs = usePairStats(stored)
  const quotes = useMemo(() => quoteAssets(pairs), [pairs])

  const [quoteChoice, setQuoteChoice] = useState<string | null>(null)
  const quote = quoteChoice && quotes.includes(quoteChoice) ? quoteChoice : (quotes[0] ?? 'USDT')

  // The open asset lives in the URL, so Back closes it and a reload keeps it.
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedKey = fromParam(searchParams.get('pair'))
  const selected = pairs.find((pair) => pair.key === selectedKey) ?? null
  const select = (key: PairKey | null) =>
    setSearchParams(key ? { pair: toParam(key) } : {}, { preventScrollReset: true })

  const detailRef = useRef<HTMLElement>(null)
  useEffect(() => {
    if (selectedKey) detailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [selectedKey])

  const fileInput = useRef<HTMLInputElement>(null)
  const hasData = stored !== null

  // Prices load as soon as there are trades to price, then keep refreshing.
  const prices = useAllPrices(hasData)
  const priceState: PriceState = {
    prices: prices.data,
    isFetching: prices.isFetching,
    isError: prices.isError,
    updatedAt: prices.dataUpdatedAt,
    refresh: () => void prices.refetch(),
  }

  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-5 pt-12 pb-10 sm:pt-20">
        <div className="animate-rise">
          <SectionLabel index="00">{t('journal.eyebrow')}</SectionLabel>
        </div>
        <div className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-[1.4fr_1fr]">
          <h1
            className="animate-rise text-[clamp(2.2rem,5.5vw,3.8rem)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
            style={{ animationDelay: '60ms' }}
          >
            {t('journal.titleLead')} <Marker>{t('journal.titleMarked')}</Marker> <br />
            <span className="text-content-faint">{t('journal.titleTail')}</span>
          </h1>
          <p
            className="animate-rise text-content-muted max-w-[46ch] self-end"
            style={{ animationDelay: '120ms' }}
          >
            {t('journal.intro')}
          </p>
        </div>
      </section>

      <section className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 pb-16">
        <ImportNotice state={state} onDismiss={dismiss} />

        {!hasData ? (
          <ImportDropzone state={state} onFile={(file) => void importFile(file)} />
        ) : (
          <>
            {/* Toolbar: what is loaded, and the two ways to change it. */}
            <div className="border-line flex flex-wrap items-center gap-3 border-b pb-5">
              <div className="mr-auto min-w-0 text-sm">
                <p className="truncate font-medium">
                  {t('journal.toolbar.file', {
                    name: stored.fileName || 'CSV',
                    date: formatDateTime(stored.importedAt, i18n.resolvedLanguage),
                  })}
                </p>
                {stored.skippedCount > 0 && state.status !== 'done' ? (
                  <p className="text-content-faint text-xs">
                    {t('journal.result.skippedStored', { count: stored.skippedCount })}
                  </p>
                ) : null}
                {stored.format === 'order-history' ? (
                  <p className="text-content-faint text-xs">{t('journal.result.noFees')}</p>
                ) : null}
              </div>
              <HiddenFileInput inputRef={fileInput} onFile={(file) => void importFile(file)} />
              <ConfirmDialog
                trigger={
                  <Button variant="outline" size="sm" disabled={state.status === 'parsing'}>
                    <FileUp className="size-4" aria-hidden />
                    {state.status === 'parsing'
                      ? t('journal.import.parsing', { name: state.fileName })
                      : t('journal.toolbar.newFile')}
                  </Button>
                }
                title={t('journal.toolbar.replaceTitle')}
                description={t('journal.toolbar.replaceBody')}
                confirmLabel={t('journal.toolbar.replaceConfirm')}
                cancelLabel={t('journal.toolbar.cancel')}
                onConfirm={() => fileInput.current?.click()}
              />
              <ConfirmDialog
                trigger={
                  <Button variant="danger" size="sm">
                    <Trash2 className="size-4" aria-hidden />
                    {t('journal.toolbar.reset')}
                  </Button>
                }
                title={t('journal.toolbar.resetTitle')}
                description={t('journal.toolbar.resetBody')}
                confirmLabel={t('journal.toolbar.resetConfirm')}
                cancelLabel={t('journal.toolbar.cancel')}
                onConfirm={() => {
                  select(null)
                  reset()
                }}
                destructive
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t('journal.overview.heading')}
              </h2>
              {/* Figures never mix quote currencies, so pick which one to add up. */}
              {quotes.length > 1 ? (
                <SegmentedControl
                  label={t('journal.overview.quote')}
                  value={quote}
                  onValueChange={setQuoteChoice}
                  options={quotes.map((option) => ({
                    value: option,
                    ariaLabel: option,
                    label: option,
                  }))}
                  className="w-full max-w-sm"
                />
              ) : null}
            </div>

            <PortfolioOverview pairs={pairs} quote={quote} priceState={priceState} />

            <div className="flex flex-col gap-4 pt-4">
              <h2 className="text-2xl font-semibold tracking-tight">
                {t('journal.assets.heading')}
              </h2>
              <AssetsTable
                pairs={pairs.filter((pair) => pair.quote === quote)}
                quote={quote}
                selected={selectedKey}
                onSelect={select}
                priceState={priceState}
              />
            </div>

            {selected ? (
              <section
                ref={detailRef}
                aria-labelledby="asset-detail-heading"
                className="scroll-mt-24 pt-6"
              >
                <AssetDetail
                  pair={selected}
                  price={pairPrice(priceState.prices, selected)}
                  onClose={() => select(null)}
                />
              </section>
            ) : null}
          </>
        )}
      </section>
    </div>
  )
}
