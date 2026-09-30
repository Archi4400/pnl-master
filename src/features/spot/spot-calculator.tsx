import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Hint } from '@/components/ui/hint'
import { NumberField } from '@/components/ui/number-field'
import { SectionLabel } from '@/components/ui/section-label'
import { SpecRow } from '@/components/ui/spec-row'
import { formatNumber } from '@/features/calculator/math'

import { useSpotCalculator } from './use-spot-calculator'

const DASH = '—'

/**
 * Signed number, coloured for the inverted slab.
 *
 * `lowerIsBetter` flips the colours for the average-price shift: a holder wants
 * the average to fall, so a negative shift is the good outcome there.
 */
function Signed({
  value,
  suffix = '',
  decimals = 2,
  lowerIsBetter = false,
}: {
  value: number
  suffix?: string
  decimals?: number
  lowerIsBetter?: boolean
}) {
  const sign = value > 0 ? '+' : ''
  const good = lowerIsBetter ? value < 0 : value > 0
  return (
    <span className={value === 0 ? undefined : good ? 'text-profit-invert' : 'text-loss-invert'}>
      {sign}
      {formatNumber(value, decimals)}
      {suffix}
    </span>
  )
}

export function SpotCalculator() {
  const { t } = useTranslation()
  const { values, setField, reset, purchase, before, after, saleAfter, saleBefore } =
    useSpotCalculator()

  const rowClass = 'border-content-invert/15'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="rounded-card border-line bg-surface-raised flex flex-col gap-7 border p-5 sm:p-7">
        <div className="flex items-center justify-between gap-4">
          <SectionLabel index="01">{t('spot.holdingHeading')}</SectionLabel>
          <Button variant="ghost" size="sm" onClick={reset} className="-mr-2">
            {t('calculator.reset')}
          </Button>
        </div>

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
            suffix={t('units.asset')}
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
              />
            </div>
            <NumberField
              id="spot-buy-quantity"
              label={t('spot.buyQuantity')}
              tooltip={t('spot.tips.buyQuantity')}
              value={values.buyQuantity}
              onValueChange={(next) => setField('buyQuantity', next)}
              suffix={t('units.asset')}
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
            hint={t('spot.salePriceHint')}
          />
        </div>
      </div>

      <div className="rounded-card bg-surface-invert text-content-invert flex flex-col gap-5 p-5 sm:p-7">
        <SectionLabel index="03" tone="invert" className="text-content-invert/55">
          {t('spot.resultHeading')}
        </SectionLabel>

        {/* The headline number: where the average lands after the buy. */}
        <div className="flex flex-col gap-1">
          <span className="text-content-invert/55 flex items-center gap-1.5 font-mono text-[11px] tracking-[0.16em] uppercase">
            {t('spot.newAverage')}
            <Hint label={t('spot.newAverage')}>{t('spot.tips.newAverage')}</Hint>
          </span>
          <span className="text-4xl font-bold tabular-nums sm:text-5xl">
            {after ? formatNumber(after.averagePrice, 8) : DASH}
          </span>
          <span className="text-content-invert/70 text-sm">
            {before
              ? t('spot.wasAverage', { price: formatNumber(before.averagePrice, 8) })
              : t('spot.noHolding')}
            {after?.averageShiftPct != null && after.averageShiftPct !== 0 ? (
              <>
                {' · '}
                <Signed value={after.averageShiftPct} suffix="%" lowerIsBetter />
              </>
            ) : null}
          </span>
        </div>

        <dl className="flex flex-col">
          <SpecRow
            label={t('spot.totalQuantity')}
            tooltip={t('spot.tips.totalQuantity')}
            value={after ? formatNumber(after.quantity, 8) : DASH}
            note={
              after && purchase.quantity > 0
                ? t('spot.totalQuantityNote', { quantity: formatNumber(purchase.quantity, 8) })
                : undefined
            }
            className={rowClass}
          />
          <SpecRow
            label={t('spot.totalCost')}
            tooltip={t('spot.tips.totalCost')}
            value={after ? formatNumber(after.cost, 2) : DASH}
            note={t('spot.totalCostNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('spot.saleValue')}
            tooltip={t('spot.tips.saleValue')}
            value={saleAfter ? formatNumber(saleAfter.value, 2) : DASH}
            note={t('spot.saleValueNote')}
            className={rowClass}
          />
          <SpecRow
            label={t('spot.pnl')}
            tooltip={t('spot.tips.pnl')}
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
            tooltip={t('spot.tips.pnlWithoutBuy')}
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

        <p className="border-content-invert/15 text-content-invert/55 mt-auto border-t pt-4 text-xs leading-relaxed">
          {t('spot.disclaimer')}
        </p>
      </div>
    </div>
  )
}
