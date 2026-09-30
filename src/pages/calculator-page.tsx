import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Marker } from '@/components/ui/marker'
import { Marquee } from '@/components/ui/marquee'
import { SectionLabel } from '@/components/ui/section-label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { FuturesCalculator } from '@/features/futures/futures-calculator'
import { useFuturesCalculator } from '@/features/futures/use-futures-calculator'
import { InfoSection } from '@/features/info/info-section'
import { AssetPicker } from '@/features/market/asset-picker'
import { useAsset } from '@/features/market/use-asset'
import { SaveButton } from '@/features/saved/save-button'
import { SavedList } from '@/features/saved/saved-list'
import type { SavedEntry } from '@/features/saved/storage'
import { ShareButton } from '@/features/share/share-button'
import { decodeSnapshot, readMode, type Mode, type Snapshot } from '@/features/share/snapshot'
import { useUrlSnapshot } from '@/features/share/use-url-snapshot'
import { SpotCalculator } from '@/features/spot/spot-calculator'
import { useSpotCalculator } from '@/features/spot/use-spot-calculator'

export function CalculatorPage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()

  // The URL is read once, on first render, to seed everything; after that it
  // only mirrors the state (useUrlSnapshot below), so it can never fight it.
  const [fromLink] = useState(() => decodeSnapshot(searchParams))
  const [mode, setMode] = useState<Mode>(() => fromLink?.mode ?? readMode(searchParams))
  const [asset, setAsset] = useAsset(fromLink?.asset)
  const futures = useFuturesCalculator(fromLink?.mode === 'futures' ? fromLink.futures : undefined)
  const spot = useSpotCalculator(fromLink?.mode === 'spot' ? fromLink.spot : undefined)

  const futuresSnapshot: Snapshot = { mode: 'futures', asset, futures: futures.inputs }
  const spotSnapshot: Snapshot = { mode: 'spot', asset, spot: spot.inputs }
  useUrlSnapshot(mode === 'spot' ? spotSnapshot : futuresSnapshot)

  const toolRef = useRef<HTMLElement>(null)
  const loadSaved = ({ snapshot }: SavedEntry) => {
    setMode(snapshot.mode)
    setAsset(snapshot.asset)
    if (snapshot.mode === 'futures') futures.load(snapshot.futures)
    else spot.load(snapshot.spot)
    toolRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  // Hero copy follows the mode: the leverage pitch means nothing on spot.
  const copy = mode === 'spot' ? 'spot' : 'calculator'

  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-6xl px-5 pt-12 pb-10 sm:pt-20">
        <div className="animate-rise">
          <SectionLabel index="00">
            {t('calculator.eyebrow')} · {t(`mode.${mode}`)}
          </SectionLabel>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <h1
            className="animate-rise text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
            style={{ animationDelay: '60ms' }}
          >
            {t(`${copy}.titleLead`)} <Marker>{t(`${copy}.titleMarked`)}</Marker> <br />
            <span className="text-content-faint">{t(`${copy}.titleTail`)}</span>
          </h1>

          <p
            className="animate-rise text-content-muted max-w-[46ch] self-end"
            style={{ animationDelay: '120ms' }}
          >
            {t(`${copy}.intro`)}
          </p>
        </div>
      </section>

      {/* The tool itself. scroll-mt clears the sticky header when a saved
          calculation scrolls back up to it. */}
      <section ref={toolRef} className="mx-auto w-full max-w-6xl scroll-mt-24 px-5 pb-16">
        <div className="animate-rise flex flex-col gap-6" style={{ animationDelay: '180ms' }}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <SegmentedControl
              label={t('mode.label')}
              value={mode}
              onValueChange={(next) => setMode(next as Mode)}
              options={[
                { value: 'futures', ariaLabel: t('mode.futures'), label: t('mode.futures') },
                { value: 'spot', ariaLabel: t('mode.spot'), label: t('mode.spot') },
              ]}
              className="w-full max-w-xs"
            />
            <AssetPicker value={asset} onChange={setAsset} />
          </div>

          {/* Both stay mounted so switching modes does not wipe what was typed. */}
          <div hidden={mode !== 'futures'}>
            <FuturesCalculator
              calc={futures}
              asset={asset}
              actions={
                <>
                  <SaveButton snapshot={futuresSnapshot} pnl={futures.parsed.pnl} />
                  <ShareButton snapshot={futuresSnapshot} />
                </>
              }
            />
          </div>
          <div hidden={mode !== 'spot'}>
            <SpotCalculator
              calc={spot}
              asset={asset}
              actions={
                <>
                  <SaveButton snapshot={spotSnapshot} pnl={spot.saleAfter?.pnl ?? null} />
                  <ShareButton snapshot={spotSnapshot} />
                </>
              }
            />
          </div>
        </div>
      </section>

      <SavedList onLoad={loadSaved} />

      <Marquee
        items={[t('marquee.one'), t('marquee.two'), t('marquee.three'), t('marquee.four')]}
      />

      <InfoSection />
    </div>
  )
}
