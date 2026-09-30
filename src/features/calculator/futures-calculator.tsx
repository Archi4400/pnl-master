import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { LeverageSlider } from '@/components/ui/leverage-slider'
import { NumberField } from '@/components/ui/number-field'
import { SectionLabel } from '@/components/ui/section-label'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SpecRow } from '@/components/ui/spec-row'
import { MarketPriceButton } from '@/features/market/market-price-button'
import { cn } from '@/lib/utils'

import { formatNumber, LEVERAGE_MIN, LEVERAGE_SLIDER_MAX } from './math'
import { liquidationMovePct, liquidationPrice, positionSize, riskLevel, roiPct } from './risk'
import type { FuturesCalculator as FuturesCalculatorState } from './use-calculator'

// Tones for the inverted slab, so they track the card's ground rather than the
// page's.
const RISK_TONE = {
  calm: 'text-content-invert/70',
  elevated: 'text-content-invert',
  high: 'text-loss-invert',
  extreme: 'text-loss-invert',
} as const

const DASH = '—'

type FuturesCalculatorProps = {
  /** State lives in the page, so saved calculations and links can load into it. */
  calc: FuturesCalculatorState
  /** Picked coin, or null for a generic "units". */
  asset: string | null
  /** Extra buttons for the card header, before Reset (save, share). */
  actions?: React.ReactNode
}

export function FuturesCalculator({ calc, asset, actions }: FuturesCalculatorProps) {
  const { t } = useTranslation()
  const { values, direction, setDirection, setField, normalizeLeverage, reset, parsed } = calc

  const size = positionSize(parsed.amount, parsed.leverage)
  const liqMove = liquidationMovePct(parsed.leverage)
  const liqPrice = liquidationPrice(parsed.openPrice, parsed.leverage, direction)
  const roi = roiPct(parsed.pnl, parsed.amount)
  const level = riskLevel(parsed.leverage)
  const rowClass = 'border-content-invert/15'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-card border-line bg-surface-raised flex flex-col gap-7 border p-5 sm:p-7">
        <div className="flex items-center justify-between gap-2">
          <SectionLabel index="01">{t('calculator.inputs')}</SectionLabel>
          <div className="-mr-2 flex items-center">
            {actions}
            <Button variant="ghost" size="sm" onClick={reset}>
              {t('calculator.reset')}
            </Button>
          </div>
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
            tooltip={t('calculator.tips.amount')}
            value={values.amount}
            onValueChange={(next) => setField('amount', next)}
            suffix={t('units.quote')}
          />
          <NumberField
            id="amount-units"
            label={t('calculator.amountUnits')}
            tooltip={t('calculator.tips.amountUnits')}
            value={values.amountUnits}
            onValueChange={(next) => setField('amountUnits', next)}
            suffix={asset ?? t('units.asset')}
          />
          <NumberField
            id="open-price"
            label={t('calculator.openPrice')}
            tooltip={t('calculator.tips.openPrice')}
            value={values.openPrice}
            onValueChange={(next) => setField('openPrice', next)}
            hint={<MarketPriceButton asset={asset} onUse={(next) => setField('openPrice', next)} />}
          />
          <NumberField
            id="close-price"
            label={t('calculator.closePrice')}
            tooltip={t('calculator.tips.closePrice')}
            value={values.closePrice}
            onValueChange={(next) => setField('closePrice', next)}
            hint={
              <MarketPriceButton asset={asset} onUse={(next) => setField('closePrice', next)} />
            }
          />
          <div className="sm:col-span-2">
            <NumberField
              id="leverage"
              label={t('calculator.leverage')}
              tooltip={t('calculator.tips.leverage')}
              value={values.leverage}
              onValueChange={(next) => setField('leverage', next)}
              onBlur={normalizeLeverage}
              suffix="×"
              step={1}
            />
          </div>
        </div>

        <div className="flex flex-col gap-2.5">
          <LeverageSlider
            label={t('calculator.leverage')}
            value={parsed.leverage}
            onValueChange={(next) => setField('leverage', String(next))}
            min={LEVERAGE_MIN}
            max={LEVERAGE_SLIDER_MAX}
          />
          <div className="text-content-faint flex justify-between font-mono text-[10px] tracking-wider">
            <span>{LEVERAGE_MIN}×</span>
            <span>{LEVERAGE_SLIDER_MAX}×</span>
          </div>
        </div>

        <div className="border-line border-t pt-6">
          <NumberField
            id="pnl"
            label={t('calculator.pnl')}
            tooltip={t('calculator.tips.pnl')}
            value={values.pnl}
            onValueChange={(next) => setField('pnl', next)}
            tone="auto"
            allowNegative
            size="lg"
            hint={t('calculator.pnlHint')}
          />
        </div>
      </div>

      {/* Live risk readout, derived from the same inputs */}
      <div className="rounded-card bg-surface-invert text-content-invert flex flex-col gap-5 p-5 sm:p-7">
        <SectionLabel index="02" tone="invert" className="text-content-invert/55">
          {t('risk.heading')}
        </SectionLabel>

        <dl className="flex flex-col">
          <SpecRow
            label={t('risk.positionSize')}
            tooltip={t('risk.tips.positionSize')}
            value={formatNumber(size, 2)}
            note={t('risk.positionSizeNote', { leverage: formatNumber(parsed.leverage, 0) })}
            className={rowClass}
          />
          <SpecRow
            label={t('risk.roi')}
            tooltip={t('risk.tips.roi')}
            value={
              roi === null ? (
                DASH
              ) : (
                <span className={roi < 0 ? 'text-loss-invert' : 'text-profit-invert'}>
                  {formatNumber(roi, 2)}%
                </span>
              )
            }
            note={t('risk.roiNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('risk.liquidationMove')}
            tooltip={t('risk.tips.liquidationMove')}
            value={
              liqMove === null ? (
                DASH
              ) : (
                <span className={cn('font-semibold', RISK_TONE[level])}>
                  −{formatNumber(liqMove, 2)}%
                </span>
              )
            }
            note={t('risk.liquidationMoveNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('risk.liquidationPrice')}
            tooltip={t('risk.tips.liquidationPrice')}
            value={liqPrice === null ? DASH : formatNumber(liqPrice, 4)}
            note={t(`direction.${direction}`)}
            className={rowClass}
          />
        </dl>

        <p className="border-content-invert/15 text-content-invert/55 mt-auto border-t pt-4 text-xs leading-relaxed">
          {t('risk.disclaimer')}
        </p>
      </div>
    </div>
  )
}
