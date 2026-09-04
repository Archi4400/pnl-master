import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'

import { transactionsQuery } from '@/features/transactions/queries'
import { cn, formatCurrency } from '@/lib/utils'

export function TransactionsPage() {
  const { t, i18n } = useTranslation()
  // Same query key as the dashboard, so navigating here reuses the cached rows
  // and renders instantly instead of refetching.
  const { data, isPending } = useQuery(transactionsQuery())

  if (isPending) return <p className="text-content-muted">{t('common.loading')}</p>
  if (!data?.length) return <p className="text-content-muted">{t('transactions.empty')}</p>

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('transactions.heading')}</h2>

      <div className="border-border-subtle overflow-x-auto rounded-lg border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-raised text-content-muted">
            <tr>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('transactions.columnDate')}
              </th>
              <th scope="col" className="px-4 py-2 font-medium">
                {t('transactions.columnLabel')}
              </th>
              <th scope="col" className="px-4 py-2 text-right font-medium">
                {t('transactions.columnAmount')}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.id} className="border-border-subtle border-t">
                <td className="text-content-muted px-4 py-2 tabular-nums">{row.date}</td>
                <td className="px-4 py-2">{row.label}</td>
                <td
                  className={cn(
                    'px-4 py-2 text-right font-medium tabular-nums',
                    row.amount >= 0 ? 'text-profit' : 'text-loss',
                  )}
                >
                  {formatCurrency(row.amount, i18n.language)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}
