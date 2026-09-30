import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { NumberField } from '@/components/ui/number-field'
import { SectionLabel } from '@/components/ui/section-label'
import { SpecRow } from '@/components/ui/spec-row'
import { formatNumber } from '@/features/calculator/math'

import { useSpotCalculator } from './use-spot-calculator'

const DASH = '—'

/** Signed money, coloured for the inverted slab. */
function Signed({ value, suffix = '', decimals = 2 }: { value: number; suffix?: string; decimals?: number }) {
  const sign = value > 0 ? '+' : ''
  return (
    <span className={value < 0 ? 'text-loss-invert' : value > 0 ? 'text-profit-invert' : undefined}>
      {sign}
      {formatNumber(value, decimals)}
      {suffix}
    </span>
  )
}

export function SpotCalculator() {
  const { t } = useTranslation()
  const { values, setField, reset, before, after, saleAfter, saleBefore } = useSpotCalculator()

  const rowClass = 'border-content-invert/15'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="flex flex-col gap-7 rounded-card border border-line bg-surface-raised p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel index="01">{t('spot.holdingHeading')}</SectionLabel>
          <Button variant="ghost" size="sm" onClick={reset} className="-mr-2">
            {t('calculator.reset')}
          </Button>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <NumberField
            id="spot-quantity"
            label={t('spot.quantity')}
            value={values.quantity}
            onValueChange={(next) => setField('quantity', next)}
          />
          <NumberField
            id="spot-average"
            label={t('spot.averagePrice')}
            value={values.averagePrice}
            onValueChange={(next) => setField('averagePrice', next)}
          />
        </div>

        <div className="flex flex-col gap-5 border-t border-line pt-6">
          <SectionLabel index="02">{t('spot.buyHeading')}</SectionLabel>
          <div className="grid gap-5 sm:grid-cols-2">
            <NumberField
              id="spot-buy-amount"
              label={t('spot.buyAmount')}
              value={values.buyAmount}
              onValueChange={(next) => setField('buyAmount', next)}
              hint={
                after && after.boughtQuantity > 0
                  ? t('spot.buyAmountHint', { quantity: formatNumber(after.boughtQuantity, 8) })
                  : undefined
              }
            />
            <NumberField
              id="spot-buy-price"
              label={t('spot.buyPrice')}
              value={values.buyPrice}
              onValueChange={(next) => setField('buyPrice', next)}
            />
          </div>
        </div>

        <div className="border-t border-line pt-6">
          <NumberField
            id="spot-sale-price"
            label={t('spot.salePrice')}
            value={values.salePrice}
            onValueChange={(next) => setField('salePrice', next)}
            size="lg"
            hint={t('spot.salePriceHint')}
          />
        </div>
      </div>

      <div className="flex flex-col gap-5 rounded-card bg-surface-invert p-5 text-content-invert sm:p-7">
        <SectionLabel index="03" className="text-content-invert/55">
          {t('spot.resultHeading')}
        </SectionLabel>

        {/* The headline number: where the average lands after the buy. */}
        <div className="flex flex-col gap-1">
          <span className="font-mono text-[11px] tracking-[0.16em] text-content-invert/55 uppercase">
            {t('spot.newAverage')}
          </span>
          <span className="text-4xl font-bold tabular-nums sm:text-5xl">
            {after ? formatNumber(after.averagePrice, 8) : DASH}
          </span>
          <span className="text-sm text-content-invert/70">
            {before
              ? t('spot.wasAverage', { price: formatNumber(before.averagePrice, 8) })
              : t('spot.noHolding')}
            {after?.averageShiftPct != null && after.averageShiftPct !== 0 ? (
              <>
                {' · '}
                <Signed value={after.averageShiftPct} suffix="%" />
              </>
            ) : null}
          </span>
        </div>

        <dl className="flex flex-col">
          <SpecRow
            label={t('spot.totalQuantity')}
            value={after ? formatNumber(after.quantity, 8) : DASH}
            note={
              after && after.boughtQuantity > 0
                ? t('spot.totalQuantityNote', { quantity: formatNumber(after.boughtQuantity, 8) })
                : undefined
            }
            className={rowClass}
          />
          <SpecRow
            label={t('spot.totalCost')}
            value={after ? formatNumber(after.cost, 2) : DASH}
            note={t('spot.totalCostNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('spot.saleValue')}
            value={saleAfter ? formatNumber(saleAfter.value, 2) : DASH}
            note={t('spot.saleValueNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('spot.pnl')}
            value={
              saleAfter ? (
                <span className="text-xl font-semibold">
                  <Signed value={saleAfter.pnl} />
                </span>
              ) : (
                DASH
              )
            }
            note={
              saleAfter?.roiPct != null
                ? `${saleAfter.roiPct > 0 ? '+' : ''}${formatNumber(saleAfter.roiPct, 2)}% ${t('spot.pnlNote')}`
                : undefined
            }
            className={rowClass}
          />
          <SpecRow
            label={t('spot.pnlWithoutBuy')}
            value={saleBefore ? <Signed value={saleBefore.pnl} /> : DASH}
            note={
              saleAfter && saleBefore
                ? t('spot.pnlWithoutBuyNote', {
                    delta: `${saleAfter.pnl - saleBefore.pnl >= 0 ? '+' : ''}${formatNumber(saleAfter.pnl - saleBefore.pnl, 2)}`,
                  })
                : undefined
            }
            className={rowClass}
          />
        </dl>

        <p className="mt-auto border-t border-content-invert/15 pt-4 text-xs leading-relaxed text-content-invert/55">
          {t('spot.disclaimer')}
        </p>
      </div>
    </div>
  )
}
