import { useTranslation } from 'react-i18next'
import { useSearchParams } from 'react-router'

import { Marker } from '@/components/ui/marker'
import { Marquee } from '@/components/ui/marquee'
import { NumberField } from '@/components/ui/number-field'
import { SectionLabel } from '@/components/ui/section-label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SpecRow } from '@/components/ui/spec-row'
import { Button } from '@/components/ui/button'
import { LeverageSlider } from '@/components/ui/leverage-slider'
import { formatNumber, LEVERAGE_MAX, LEVERAGE_MIN } from '@/features/calculator/math'
import {
  liquidationMovePct,
  liquidationPrice,
  positionSize,
  riskLevel,
  roiPct,
} from '@/features/calculator/risk'
import { useCalculator } from '@/features/calculator/use-calculator'
import { SpotCalculator } from '@/features/spot/spot-calculator'
import { useReveal } from '@/hooks/use-reveal'
import { cn } from '@/lib/utils'

// Tones for the inverted slab, so they track the card's ground rather than the
// page's.
const RISK_TONE = {
  calm: 'text-content-invert/70',
  elevated: 'text-content-invert',
  high: 'text-loss-invert',
  extreme: 'text-loss-invert',
} as const

type Mode = 'futures' | 'spot'

export function CalculatorPage() {
  const { t } = useTranslation()
  // The mode lives in the URL (?mode=spot) so a link opens the same calculator.
  const [searchParams, setSearchParams] = useSearchParams()
  const mode: Mode = searchParams.get('mode') === 'spot' ? 'spot' : 'futures'
  const setMode = (next: Mode) =>
    setSearchParams(next === 'spot' ? { mode: 'spot' } : {}, { replace: true })

  // Hero copy follows the mode: the leverage pitch means nothing on spot.
  const copy = mode === 'spot' ? 'spot' : 'calculator'

  return (
    <div className="flex flex-col">
      <section className="mx-auto w-full max-w-5xl px-5 pt-12 pb-10 sm:pt-20">
        <div className="animate-rise">
          <SectionLabel index="00">
            {t('calculator.eyebrow')} · {t(`mode.${mode}`)}
          </SectionLabel>
        </div>

        <div className="mt-6 grid gap-x-12 gap-y-6 lg:grid-cols-[1.15fr_1fr]">
          <h1
            className="animate-rise text-[clamp(2.4rem,6vw,4.2rem)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
            style={{ animationDelay: '60ms' }}
          >
            {t(`${copy}.titleLead`)} <Marker>{t(`${copy}.titleMarked`)}</Marker>{' '}
            <span className="text-content-faint">{t(`${copy}.titleTail`)}</span>
          </h1>

          <p
            className="animate-rise max-w-[46ch] self-end text-content-muted"
            style={{ animationDelay: '120ms' }}
          >
            {t(`${copy}.intro`)}
          </p>
        </div>
      </section>

      {/* The tool itself */}
      <section className="mx-auto w-full max-w-5xl px-5 pb-16">
        <div className="animate-rise flex flex-col gap-6" style={{ animationDelay: '180ms' }}>
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

          {mode === 'spot' ? <SpotCalculator /> : <FuturesCalculator />}
        </div>
      </section>

      <Marquee
        items={[
          t('marquee.one'),
          t('marquee.two'),
          t('marquee.three'),
          t('marquee.four'),
        ]}
      />

      <InfoSection />
    </div>
  )
}

function FuturesCalculator() {
  const { t } = useTranslation()
  const { values, direction, setDirection, setField, normalizeLeverage, reset, parsed } =
    useCalculator()

  const size = positionSize(parsed.amount, parsed.leverage)
  const liqMove = liquidationMovePct(parsed.leverage)
  const liqPrice = liquidationPrice(parsed.openPrice, parsed.leverage, direction)
  const roi = roiPct(parsed.pnl, parsed.amount)
  const level = riskLevel(parsed.leverage)

  const dash = '—'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-7 rounded-card border border-line bg-surface-raised p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel index="01">{t('calculator.inputs')}</SectionLabel>
          <Button variant="ghost" size="sm" onClick={reset} className="-mr-2">
            {t('calculator.reset')}
          </Button>
        </div>

        <SegmentedControl
          label={t('direction.label')}
          value={direction}
          onValueChange={(next) => setDirection(next as typeof direction)}
          options={[
            { value: 'long', ariaLabel: t('direction.long'), label: t('direction.long') },
            { value: 'short', ariaLabel: t('direction.short'), label: t('direction.short') },
          ]}
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="amount"
            label={t('calculator.amount')}
            value={values.amount}
            onValueChange={(next) => setField('amount', next)}
          />
          <NumberField
            id="open-price"
            label={t('calculator.openPrice')}
            value={values.openPrice}
            onValueChange={(next) => setField('openPrice', next)}
          />
          <NumberField
            id="close-price"
            label={t('calculator.closePrice')}
            value={values.closePrice}
            onValueChange={(next) => setField('closePrice', next)}
          />
          <NumberField
            id="leverage"
            label={t('calculator.leverage')}
            value={values.leverage}
            onValueChange={(next) => setField('leverage', next)}
            onBlur={normalizeLeverage}
            suffix="×"
          />
        </div>

        <div className="flex flex-col gap-2.5">
          <LeverageSlider
            label={t('calculator.leverage')}
            value={parsed.leverage}
            onValueChange={(next) => setField('leverage', String(next))}
            min={LEVERAGE_MIN}
            max={LEVERAGE_MAX}
          />
          <div className="flex justify-between font-mono text-[10px] tracking-wider text-content-faint">
            <span>{LEVERAGE_MIN}×</span>
            <span>{LEVERAGE_MAX}×</span>
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <NumberField
            id="pnl"
            label={t('calculator.pnl')}
            value={values.pnl}
            onValueChange={(next) => setField('pnl', next)}
            tone="auto"
            size="lg"
            hint={t('calculator.pnlHint')}
          />
        </div>
      </div>

      {/* Live risk readout, derived from the same inputs */}
      <div className="flex flex-col gap-5 rounded-card bg-surface-invert p-5 text-content-invert sm:p-7">
        <SectionLabel index="02" className="text-content-invert/55">
          {t('risk.heading')}
        </SectionLabel>

        <dl className="flex flex-col">
          <SpecRow
            label={t('risk.positionSize')}
            value={formatNumber(size, 2)}
            note={t('risk.positionSizeNote', { leverage: formatNumber(parsed.leverage, 0) })}
            className="border-content-invert/15"
          />
          <SpecRow
            label={t('risk.roi')}
            value={
              roi === null ? (
                dash
              ) : (
                <span className={roi < 0 ? 'text-loss-invert' : 'text-profit-invert'}>
                  {formatNumber(roi, 2)}%
                </span>
              )
            }
            note={t('risk.roiNote')}
            className="border-content-invert/15"
          />
          <SpecRow
            label={t('risk.liquidationMove')}
            value={
              liqMove === null ? (
                dash
              ) : (
                <span className={cn('font-semibold', RISK_TONE[level])}>
                  −{formatNumber(liqMove, 2)}%
                </span>
              )
            }
            note={t('risk.liquidationMoveNote')}
            className="border-content-invert/15"
          />
          <SpecRow
            label={t('risk.liquidationPrice')}
            value={liqPrice === null ? dash : formatNumber(liqPrice, 4)}
            note={t(`direction.${direction}`)}
            className="border-content-invert/15"
          />
        </dl>

        <p className="mt-auto border-t border-content-invert/15 pt-4 text-xs leading-relaxed text-content-invert/55">
          {t('risk.disclaimer')}
        </p>
      </div>
    </div>
  )
}

function InfoSection() {
  const { t } = useTranslation()
  const { ref, revealed } = useReveal<HTMLElement>()

  const cards = [
    { index: '01', title: t('info.liquidationTitle'), body: t('info.liquidationBody') },
    { index: '02', title: t('info.feesTitle'), body: t('info.feesBody') },
    { index: '03', title: t('info.asymmetryTitle'), body: t('info.asymmetryBody') },
  ]

  return (
    <section ref={ref} className="mx-auto w-full max-w-5xl px-5 py-20">
      <SectionLabel index="03">{t('info.eyebrow')}</SectionLabel>

      <div className="mt-6 grid gap-x-12 gap-y-5 lg:grid-cols-[1.15fr_1fr]">
        <h2 className="text-[clamp(1.9rem,4.4vw,3rem)] leading-[1.02] font-medium tracking-[-0.03em] text-balance">
          {t('info.titleLead')} <Marker>{t('info.titleMarked')}</Marker>
        </h2>
        <p className="max-w-[46ch] self-end text-content-muted">{t('info.intro')}</p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card, i) => (
          <article
            key={card.index}
            data-reveal
            className={cn(
              'flex flex-col gap-3 rounded-card border border-line bg-surface-raised p-6',
              'transition-all duration-300 ease-brand hover:-translate-y-1 hover:border-content',
              // Reveal on scroll rather than on load: these sit below the fold.
              revealed ? 'animate-rise' : 'opacity-0',
            )}
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <span className="font-mono text-xs tracking-widest text-lime">{card.index}</span>
            <h3 className="text-lg font-semibold tracking-tight">{card.title}</h3>
            <p className="text-sm leading-relaxed text-content-muted">{card.body}</p>
          </article>
        ))}
      </div>
    </section>
  )
}
