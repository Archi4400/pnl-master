import { Bookmark, Check } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { notify } from '@/lib/notify'
import type { Snapshot } from '@/features/share/snapshot'

import { describeSnapshot } from './describe'
import { addSaved, NAME_MAX_LENGTH } from './storage'

type SaveButtonProps = {
  snapshot: Snapshot
  pnl: number | null
}

/** How long the button shows its tick after a save. */
const CONFIRM_MS = 1600

/**
 * Save the current calculation under a name. The name field starts empty with
 * the generated title as its placeholder, so Enter alone saves a sensible name
 * and typing replaces it without having to clear anything first.
 */
export function SaveButton({ snapshot, pnl }: SaveButtonProps) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [failed, setFailed] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  useEffect(() => {
    if (!justSaved) return
    const timer = setTimeout(() => setJustSaved(false), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [justSaved])

  const fallbackName = describeSnapshot(snapshot, t).title

  const save = () => {
    const savedName = name.trim() || fallbackName
    const ok = addSaved({ name: savedName, snapshot, pnl })
    setFailed(!ok)
    if (!ok) return
    setOpen(false)
    setName('')
    setJustSaved(true)
    notify.success({ title: t('saved.toast', { name: savedName }), body: t('saved.toastHint') })
  }

  return (
    <Popover.Root
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setFailed(false)
      }}
    >
      <Popover.Trigger asChild>
        <Button variant="ghost" size="sm" className="px-2.5">
          {justSaved ? (
            <Check className="text-profit size-4" aria-hidden />
          ) : (
            <Bookmark className="size-4" aria-hidden />
          )}
          <span className="sr-only sm:not-sr-only">
            {justSaved ? t('saved.done') : t('saved.save')}
          </span>
        </Button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          className="border-line bg-surface-raised z-50 w-72 rounded-2xl border p-4 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.5)]"
        >
          <form
            className="flex flex-col gap-3"
            onSubmit={(event) => {
              event.preventDefault()
              save()
            }}
          >
            <label
              htmlFor="save-name"
              className="text-content-faint font-mono text-[11px] tracking-[0.16em] uppercase"
            >
              {t('saved.nameLabel')}
            </label>
            <input
              id="save-name"
              value={name}
              maxLength={NAME_MAX_LENGTH}
              onChange={(event) => setName(event.target.value)}
              placeholder={fallbackName}
              autoComplete="off"
              className="border-line bg-surface focus:border-lime focus:ring-lime/25 h-10 rounded-xl border px-3 text-sm outline-none focus:ring-4"
            />
            {failed ? <p className="text-loss text-xs">{t('saved.failed')}</p> : null}
            <Button type="submit" variant="lime" size="sm">
              {t('saved.save')}
            </Button>
          </form>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
