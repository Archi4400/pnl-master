import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { SectionLabel } from '@/components/ui/section-label'
import { SignedValue } from '@/components/ui/signed-value'
import { CoinIcon } from '@/features/market/coin-icon'
import { useFormat } from '@/hooks/use-format'

import { describeSnapshot } from './describe'
import { removeSaved, type SavedEntry } from './storage'
import { useSaved } from './use-saved'

type SavedListProps = {
  onLoad: (entry: SavedEntry) => void
}

export function SavedList({ onLoad }: SavedListProps) {
  const { t, i18n } = useTranslation()
  const saved = useSaved()
  const format = useFormat()
  const dateFormat = new Intl.DateTimeFormat(i18n.resolvedLanguage, {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return (
    <section className="mx-auto w-full max-w-6xl px-5 pb-16" aria-labelledby="saved-heading">
      <div className="flex items-baseline justify-between gap-4">
        <SectionLabel>
          <span id="saved-heading">{t('saved.heading')}</span>
        </SectionLabel>
        {saved.length > 0 ? (
          <span className="text-content-faint font-mono text-[11px]">{saved.length}</span>
        ) : null}
      </div>

      {saved.length === 0 ? (
        <p className="border-line text-content-faint rounded-card mt-5 border border-dashed px-5 py-8 text-center text-sm">
          {t('saved.empty')}
        </p>
      ) : (
        <ul className="mt-5 grid gap-3 sm:grid-cols-2">
          {saved.map((entry) => {
            const { detail } = describeSnapshot(entry.snapshot, t)
            return (
              <li
                key={entry.id}
                className="border-line bg-surface-raised flex flex-col gap-3 rounded-2xl border p-4"
              >
                <div className="flex items-start gap-3">
                  {entry.snapshot.asset ? (
                    <CoinIcon symbol={entry.snapshot.asset} size={24} className="mt-0.5" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{entry.name}</p>
                    <p className="text-content-faint font-mono text-[11px] tracking-wider uppercase">
                      {t(`mode.${entry.snapshot.mode}`)} · {dateFormat.format(entry.savedAt)}
                    </p>
                  </div>
                  {entry.pnl !== null ? (
                    <SignedValue value={entry.pnl} className="font-semibold tabular-nums">
                      {format.signed(entry.pnl)}
                    </SignedValue>
                  ) : null}
                </div>

                <p
                  className="text-content-muted truncate font-mono text-xs tabular-nums"
                  title={detail}
                >
                  {detail}
                </p>

                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onLoad(entry)}>
                    {t('saved.load')}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    className="ml-auto px-2.5"
                    onClick={() => removeSaved(entry.id)}
                    aria-label={t('saved.remove', { name: entry.name })}
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </Button>
                </div>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
