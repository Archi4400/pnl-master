import { useTranslation } from 'react-i18next'

import { CalculatorLayout, InputCard, ResultSlab } from '@/components/ui/calculator-card'
import { Hint } from '@/components/ui/hint'
import { NumberField } from '@/components/ui/number-field'
import { SectionLabel } from '@/components/ui/section-label'
import { SignedValue } from '@/components/ui/signed-value'
import { SpecRow } from '@/components/ui/spec-row'
import { MarketPriceButton } from '@/features/market/market-price-button'
import { useFormat } from '@/hooks/use-format'
import { NO_VALUE } from '@/lib/number'

import type { SpotCalculatorState } from './use-spot-calculator'

type SpotCalculatorProps = {
  /** State lives in the page, so saved calculations and links can load into it. */
  calc: SpotCalculatorState
  /** Picked coin, or null for a generic "units". */
  asset: string | null
  /** Extra buttons for the card header, before Reset (save, share). */
  actions?: React.ReactNode
}

export function SpotCalculator({ calc, asset, actions }: SpotCalculatorProps) {
  const { t } = useTranslation()
  const format = useFormat()
  const { values, setField, reset, purchase, before, after, saleAfter, saleBefore } = calc
  const assetUnit = asset ?? t('units.asset')

  return (
    <CalculatorLayout>
      <InputCard index="01" title={t('spot.holdingHeading')} actions={actions} onReset={reset}>
        {/* The price comes first because it is what links the two amounts
            below: type either one and the other follows through it. */}
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <NumberField
              id="spot-average"
              label={t('spot.averagePrice')}
              tooltip={t('spot.tips.averagePrice')}
              value={values.averagePrice}
              onValueChange={(next) => setField('averagePrice', next)}
            />
          </div>
          <NumberField
            id="spot-quantity"
            label={t('spot.quantity')}
            tooltip={t('spot.tips.quantity')}
            value={values.quantity}
            onValueChange={(next) => setField('quantity', next)}
            suffix={assetUnit}
          />
          <NumberField
            id="spot-invested"
            label={t('spot.invested')}
            tooltip={t('spot.tips.invested')}
            value={values.invested}
            onValueChange={(next) => setField('invested', next)}
            suffix={t('units.quote')}
          />
        </div>

        <div className="border-line flex flex-col gap-5 border-t pt-6">
          <SectionLabel index="02">{t('spot.buyHeading')}</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <NumberField
                id="spot-buy-price"
                label={t('spot.buyPrice')}
                tooltip={t('spot.tips.buyPrice')}
                value={values.buyPrice}
                onValueChange={(next) => setField('buyPrice', next)}
                hint={
                  <MarketPriceButton asset={asset} onUse={(next) => setField('buyPrice', next)} />
                }
              />
            </div>
            <NumberField
              id="spot-buy-quantity"
              label={t('spot.buyQuantity')}
              tooltip={t('spot.tips.buyQuantity')}
              value={values.buyQuantity}
              onValueChange={(next) => setField('buyQuantity', next)}
              suffix={assetUnit}
            />
            <NumberField
              id="spot-buy-cost"
              label={t('spot.buyCost')}
              tooltip={t('spot.tips.buyCost')}
              value={values.buyCost}
              onValueChange={(next) => setField('buyCost', next)}
              suffix={t('units.quote')}
            />
          </div>
        </div>

        <div className="border-line border-t pt-6">
          <NumberField
            id="spot-sale-price"
            label={t('spot.salePrice')}
            tooltip={t('spot.tips.salePrice')}
            value={values.salePrice}
            onValueChange={(next) => setField('salePrice', next)}
            size="lg"
            hint={
              asset ? (
                <MarketPriceButton asset={asset} onUse={(next) => setField('salePrice', next)} />
              ) : (
                t('spot.salePriceHint')
              )
            }
          />
        </div>
      </InputCard>

      <ResultSlab index="03" title={t('spot.resultHeading')} footnote={t('spot.disclaimer')}>
        {/* The headline number: where the average lands after the buy. */}
        <div className="flex flex-col gap-1">
          <span className="text-content-invert/55 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            {t('spot.newAverage')}
            <Hint label={t('spot.newAverage')}>{t('spot.tips.newAverage')}</Hint>
          </span>
          <span className="text-4xl font-bold tabular-nums sm:text-5xl">
            {after ? format.price(after.averagePrice) : NO_VALUE}
          </span>
          <span className="text-content-invert/70 text-sm">
            {before
              ? t('spot.wasAverage', { price: format.price(before.averagePrice) })
              : t('spot.noHolding')}
            {after?.averageShiftPct != null && after.averageShiftPct !== 0 ? (
              <>
                {' · '}
                <SignedValue value={after.averageShiftPct} surface="invert" lowerIsBetter>
                  {format.percent(after.averageShiftPct)}
                </SignedValue>
              </>
            ) : null}
          </span>
        </div>

        <dl className="flex flex-col">
          <SpecRow
            tone="invert"
            label={t('spot.totalQuantity')}
            tooltip={t('spot.tips.totalQuantity')}
            value={after ? format.units(after.quantity) : NO_VALUE}
            note={
              after && purchase.quantity > 0
                ? t('spot.totalQuantityNote', { quantity: format.units(purchase.quantity) })
                : undefined
            }
          />
          <SpecRow
            tone="invert"
            label={t('spot.totalCost')}
            tooltip={t('spot.tips.totalCost')}
            value={after ? format.amount(after.cost) : NO_VALUE}
            note={t('spot.totalCostNote')}
          />
          <SpecRow
            tone="invert"
            label={t('spot.saleValue')}
            tooltip={t('spot.tips.saleValue')}
            value={saleAfter ? format.amount(saleAfter.value) : NO_VALUE}
            note={t('spot.saleValueNote')}
          />
          <SpecRow
            tone="invert"
            label={t('spot.pnl')}
            tooltip={t('spot.tips.pnl')}
            value={
              saleAfter ? (
                <SignedValue
                  value={saleAfter.pnl}
                  surface="invert"
                  className="text-xl font-semibold"
                >
                  {format.signed(saleAfter.pnl)}
                </SignedValue>
              ) : (
                NO_VALUE
              )
            }
            note={
              saleAfter?.roiPct != null
                ? `${format.percent(saleAfter.roiPct)} ${t('spot.pnlNote')}`
                : undefined
            }
          />
          <SpecRow
            tone="invert"
            label={t('spot.pnlWithoutBuy')}
            tooltip={t('spot.tips.pnlWithoutBuy')}
            value={
              saleBefore ? (
                <SignedValue value={saleBefore.pnl} surface="invert">
                  {format.signed(saleBefore.pnl)}
                </SignedValue>
              ) : (
                NO_VALUE
              )
            }
            note={
              saleAfter && saleBefore
                ? t('spot.pnlWithoutBuyNote', {
                    delta: format.signed(saleAfter.pnl - saleBefore.pnl),
                  })
                : undefined
            }
          />
        </dl>
      </ResultSlab>
    </CalculatorLayout>
  )
}
