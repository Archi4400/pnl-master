import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { transactionsQuery } from '@/features/transactions/queries'
import { cn, formatCurrency } from '@/lib/utils'

export function DashboardPage() {
  const { t, i18n } = useTranslation()
  const { data, isPending, isError, refetch } = useQuery(transactionsQuery())

  // useMemo is React's `computed`. Without it these totals would be recalculated
  // on every render, including renders triggered by unrelated state.
  const totals = useMemo(() => {
    const rows = data ?? []
    const income = rows.filter((r) => r.amount > 0).reduce((sum, r) => sum + r.amount, 0)
    const expenses = rows.filter((r) => r.amount < 0).reduce((sum, r) => sum + r.amount, 0)
    return { income, expenses, net: income + expenses, count: rows.length }
  }, [data])

  if (isPending) return <p className="text-content-muted">{t('common.loading')}</p>

  if (isError) {
    return (
      <div className="space-y-3">
        <p className="text-loss">{t('common.error')}</p>
        <button className="underline" onClick={() => void refetch()}>
          {t('common.retry')}
        </button>
      </div>
    )
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold">{t('dashboard.heading')}</h2>
        <p className="text-content-muted text-sm">
          {t('dashboard.entryCount', { count: totals.count })}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label={t('dashboard.netResult')} value={totals.net} locale={i18n.language} />
        <StatCard label={t('dashboard.income')} value={totals.income} locale={i18n.language} />
        <StatCard label={t('dashboard.expenses')} value={totals.expenses} locale={i18n.language} />
      </div>
    </section>
  )
}

type StatCardProps = {
  label: string
  value: number
  locale: string
}

function StatCard({ label, value, locale }: StatCardProps) {
  return (
    <div className="border-border-subtle bg-surface-raised rounded-lg border p-4">
      <p className="text-content-muted text-sm">{label}</p>
      <p
        className={cn(
          'mt-1 text-2xl font-semibold tabular-nums',
          value >= 0 ? 'text-profit' : 'text-loss',
        )}
      >
        {formatCurrency(value, locale)}
      </p>
    </div>
  )
}
