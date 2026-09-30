import { useTranslation } from 'react-i18next'

import { CalculatorLayout, InputCard, ResultSlab } from '@/components/ui/calculator-card'
import { LeverageSlider } from '@/components/ui/leverage-slider'
import { NumberField } from '@/components/ui/number-field'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { SignedValue } from '@/components/ui/signed-value'
import { SpecRow } from '@/components/ui/spec-row'
import { MarketPriceButton } from '@/features/market/market-price-button'
import { useFormat } from '@/hooks/use-format'
import { NO_VALUE } from '@/lib/number'
import { cn } from '@/lib/utils'

import { LEVERAGE_MIN, LEVERAGE_SLIDER_MAX, type Direction } from './math'
import { liquidationMovePct, liquidationPrice, positionSize, riskLevel, roiPct } from './risk'
import type { FuturesCalculatorState } from './use-futures-calculator'

// Tones for the inverted slab, so they track the card's ground rather than the
// page's.
const RISK_TONE = {
  calm: 'text-content-invert/70',
  elevated: 'text-content-invert',
  high: 'text-loss-invert',
  extreme: 'text-loss-invert',
} as const

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
  const format = useFormat()
  const { values, direction, setDirection, setField, normalizeLeverage, reset, parsed } = calc

  const size = positionSize(parsed.amount, parsed.leverage)
  const liqMove = liquidationMovePct(parsed.leverage)
  const liqPrice = liquidationPrice(parsed.openPrice, parsed.leverage, direction)
  const roi = roiPct(parsed.pnl, parsed.amount)
  const level = riskLevel(parsed.leverage)

  return (
    <CalculatorLayout>
      <InputCard index="01" title={t('calculator.inputs')} actions={actions} onReset={reset}>
        <SegmentedControl
          label={t('direction.label')}
          value={direction}
          onValueChange={(next) => setDirection(next as Direction)}
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
            aria-invalid={!calc.pnlReachable}
            hint={
              calc.pnlReachable ? (
                t('calculator.pnlHint')
              ) : (
                <span className="text-loss">
                  {t(`calculator.pnlUnreachable.${direction}`, {
                    limit: format.signed(calc.pnlLimit),
                  })}
                </span>
              )
            }
          />
        </div>
      </InputCard>

      {/* Live risk readout, derived from the same inputs */}
      <ResultSlab index="02" title={t('risk.heading')} footnote={t('risk.disclaimer')}>
        <dl className="flex flex-col">
          <SpecRow
            tone="invert"
            label={t('risk.positionSize')}
            tooltip={t('risk.tips.positionSize')}
            value={format.amount(size)}
            note={t('risk.positionSizeNote', { leverage: format.amount(parsed.leverage) })}
          />
          <SpecRow
            tone="invert"
            label={t('risk.roi')}
            tooltip={t('risk.tips.roi')}
            value={
              roi === null ? (
                NO_VALUE
              ) : (
                <SignedValue value={roi} surface="invert">
                  {format.percent(roi)}
                </SignedValue>
              )
            }
            note={t('risk.roiNote')}
          />
          <SpecRow
            tone="invert"
            label={t('risk.liquidationMove')}
            tooltip={t('risk.tips.liquidationMove')}
            value={
              liqMove === null ? (
                NO_VALUE
              ) : (
                <span className={cn('font-semibold', RISK_TONE[level])}>
                  {format.percent(-liqMove)}
                </span>
              )
            }
            note={t('risk.liquidationMoveNote')}
          />
          <SpecRow
            tone="invert"
            label={t('risk.liquidationPrice')}
            tooltip={t('risk.tips.liquidationPrice')}
            value={liqPrice === null ? NO_VALUE : format.price(liqPrice)}
            note={t(`direction.${direction}`)}
          />
        </dl>
      </ResultSlab>
    </CalculatorLayout>
  )
}
