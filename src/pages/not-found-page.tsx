import { Link } from 'react-router'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold">{t('common.notFoundTitle')}</h2>
      <p className="text-content-muted">{t('common.notFoundBody')}</p>
      {/* asChild keeps this a real <a> for accessibility while looking like a button. */}
      <Button asChild variant="outline">
        <Link to="/">{t('common.goHome')}</Link>
      </Button>
    </section>
  )
}
