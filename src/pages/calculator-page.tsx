import { useTranslation } from 'react-i18next'

import { NumberField } from '@/components/ui/number-field'
import { LEVERAGE_MAX, LEVERAGE_MIN } from '@/features/calculator/math'
import { useCalculator } from '@/features/calculator/use-calculator'

export function CalculatorPage() {
  const { t } = useTranslation()
  const { values, setField, normalizeLeverage, reset } = useCalculator()

  return (
    <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">{t('calculator.heading')}</h2>
          <p className="mt-1 text-sm text-content-muted">{t('calculator.subheading')}</p>
        </div>
        <button
          type="button"
          onClick={reset}
          className="cursor-pointer text-sm text-content-faint underline-offset-4 transition-colors hover:text-content hover:underline"
        >
          {t('calculator.reset')}
        </button>
      </div>

      <div className="flex flex-col gap-8 rounded-brand border border-line bg-surface-raised p-6 sm:p-8">
        <div className="grid gap-x-8 gap-y-7 sm:grid-cols-2">
          <NumberField
            id="amount"
            label={t('calculator.amount')}
            value={values.amount}
            onValueChange={(next) => setField('amount', next)}
          />

          <div className="flex flex-col gap-3">
            <NumberField
              id="leverage"
              label={t('calculator.leverage')}
              value={values.leverage}
              onValueChange={(next) => setField('leverage', next)}
              onBlur={normalizeLeverage}
              hint={t('calculator.leverageHint', { min: LEVERAGE_MIN, max: LEVERAGE_MAX })}
            />
            <input
              type="range"
              aria-label={t('calculator.leverage')}
              min={LEVERAGE_MIN}
              max={LEVERAGE_MAX}
              step={1}
              value={values.leverage === '' ? LEVERAGE_MIN : Number(values.leverage)}
              onChange={(event) => setField('leverage', event.target.value)}
              className="w-full cursor-pointer accent-lime"
            />
          </div>

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
        </div>

        <div className="border-t border-line pt-7">
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
    </section>
  )
}
