import { AlertDialog } from 'radix-ui'

import { Button } from './button'

type ConfirmDialogProps = {
  /** The control that opens the dialog; rendered as-is via asChild. */
  trigger: React.ReactElement
  title: string
  description: string
  confirmLabel: string
  cancelLabel: string
  onConfirm: () => void
  /** Red confirm button for actions that destroy data. */
  destructive?: boolean
}

/**
 * Ask before an action that cannot be undone. AlertDialog rather than
 * window.confirm: it matches the page, traps focus, and starts on Cancel so a
 * stray Enter never confirms.
 */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel,
  onConfirm,
  destructive = false,
}: ConfirmDialogProps) {
  return (
    <AlertDialog.Root>
      <AlertDialog.Trigger asChild>{trigger}</AlertDialog.Trigger>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
        <AlertDialog.Content className="border-line bg-surface-raised fixed top-1/2 left-1/2 z-50 flex w-[min(28rem,calc(100vw-2rem))] -translate-x-1/2 -translate-y-1/2 flex-col gap-3 rounded-2xl border p-6 shadow-[0_24px_64px_-24px_rgba(0,0,0,0.6)]">
          <AlertDialog.Title className="text-lg font-semibold tracking-tight">
            {title}
          </AlertDialog.Title>
          <AlertDialog.Description className="text-content-muted text-sm leading-relaxed">
            {description}
          </AlertDialog.Description>
          <div className="mt-3 flex flex-wrap justify-end gap-2">
            <AlertDialog.Cancel asChild>
              <Button variant="outline" size="sm">
                {cancelLabel}
              </Button>
            </AlertDialog.Cancel>
            <AlertDialog.Action asChild>
              <Button
                variant={destructive ? 'solid' : 'lime'}
                size="sm"
                onClick={onConfirm}
                className={destructive ? 'bg-loss text-white hover:shadow-none' : undefined}
              >
                {confirmLabel}
              </Button>
            </AlertDialog.Action>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
