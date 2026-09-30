import { Check, Copy, Link2 } from 'lucide-react'
import { Popover } from 'radix-ui'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import { shareUrl, type Snapshot } from './snapshot'

/** How long the copy button shows its tick. */
const CONFIRM_MS = 1600

type CopyState = 'idle' | 'copied' | 'failed'

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/**
 * Share this exact calculation.
 *
 * Opening copies the link straight away, and the copy button next to the link
 * does it again on demand — e.g. after the clipboard was used for something
 * else. The link also sits in a selectable field: the clipboard API can be
 * refused (insecure origin, denied permission, older browsers), and then the
 * user still has something to copy by hand.
 */
export function ShareButton({ snapshot }: { snapshot: Snapshot }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [state, setState] = useState<CopyState>('idle')

  useEffect(() => {
    if (state !== 'copied') return
    const timer = setTimeout(() => setState('idle'), CONFIRM_MS)
    return () => clearTimeout(timer)
  }, [state])

  const copy = async (text: string) => {
    setState((await copyText(text)) ? 'copied' : 'failed')
  }

  const share = () => {
    const next = shareUrl(snapshot)
    setUrl(next)
    setOpen(true)
    void copy(next)
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Anchor asChild>
        <Button variant="ghost" size="sm" className="px-2.5" onClick={share}>
          <Link2 className="size-4" aria-hidden />
          <span className="sr-only sm:not-sr-only">{t('share.share')}</span>
        </Button>
      </Popover.Anchor>

      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          collisionPadding={12}
          onOpenAutoFocus={(event) => event.preventDefault()}
          className="border-line bg-surface-raised z-50 flex w-80 max-w-[calc(100vw-2rem)] flex-col gap-2.5 rounded-2xl border p-4 shadow-[0_18px_48px_-18px_rgba(0,0,0,0.5)]"
        >
          {/* <output> is announced like role="status" when the text changes. */}
          <output className="text-sm font-semibold">
            {state === 'failed' ? t('share.copyManually') : t('share.title')}
          </output>

          <div className="flex gap-2">
            <input
              readOnly
              value={url}
              aria-label={t('share.linkLabel')}
              onFocus={(event) => event.currentTarget.select()}
              className="border-line bg-surface text-content-muted h-9 min-w-0 flex-1 rounded-lg border px-2.5 font-mono text-xs outline-none"
            />
            <Button
              variant={state === 'copied' ? 'outline' : 'lime'}
              size="sm"
              className="h-9 shrink-0 rounded-lg px-3 hover:translate-y-0"
              onClick={() => void copy(url)}
            >
              {state === 'copied' ? (
                <Check className="text-profit size-4" aria-hidden />
              ) : (
                <Copy className="size-4" aria-hidden />
              )}
              {state === 'copied' ? t('share.copied') : t('share.copy')}
            </Button>
          </div>

          <p className="text-content-faint text-xs">{t('share.hint')}</p>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
