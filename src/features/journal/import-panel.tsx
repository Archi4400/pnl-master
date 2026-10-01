import { FileUp, LoaderCircle, ShieldCheck, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import type { SkippedRow } from './csv'
import type { ImportState } from './use-journal'

/** Shown line by line; the rest collapse into "and N more". */
const SKIPPED_PREVIEW = 8

const CSV_ACCEPT = '.csv,text/csv'

/** Reads the chosen file and clears the input so the same file can be picked again. */
function takeFile(input: HTMLInputElement, onFile: (file: File) => void) {
  const file = input.files?.[0]
  input.value = ''
  if (file) onFile(file)
}

type ImportDropzoneProps = {
  state: ImportState
  onFile: (file: File) => void
}

/**
 * The empty state: a drop target, a file button, and how to get the file.
 *
 * The zone is covered by the real (transparent) file input. Browsers accept a
 * dropped file on a file input natively, so drag-and-drop, click and keyboard
 * all go through one element with no hand-rolled drop handling.
 */
export function ImportDropzone({ state, onFile }: ImportDropzoneProps) {
  const { t } = useTranslation()
  const [dragging, setDragging] = useState(false)
  const parsing = state.status === 'parsing'

  return (
    <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
      <div
        className={cn(
          'rounded-card relative flex min-h-72 flex-col items-center justify-center gap-4 border-2 border-dashed p-8 text-center',
          'ease-brand transition-colors duration-200',
          'focus-within:ring-lime/25 focus-within:border-lime focus-within:ring-4',
          dragging ? 'border-lime bg-lime/10' : 'border-line bg-surface-raised hover:border-lime',
        )}
      >
        {parsing ? (
          <>
            <LoaderCircle className="text-content-faint size-10 animate-spin" aria-hidden />
            <output className="text-content-muted">
              {t('journal.import.parsing', { name: state.fileName })}
            </output>
          </>
        ) : (
          <>
            <FileUp className="text-content-faint size-10" aria-hidden />
            <p className="text-lg font-semibold tracking-tight">{t('journal.import.drop')}</p>
            <span className="text-content-faint text-sm">{t('journal.import.or')}</span>
            <span
              className="bg-lime text-lime-ink rounded-full px-5 py-2.5 font-mono text-[13px]"
              aria-hidden
            >
              {t('journal.import.choose')}
            </span>
            <p className="text-content-faint flex items-center gap-1.5 text-xs">
              <ShieldCheck className="size-3.5" aria-hidden />
              {t('journal.import.privacy')}
            </p>
          </>
        )}
        <input
          type="file"
          accept={CSV_ACCEPT}
          aria-label={t('journal.import.choose')}
          disabled={parsing}
          onDragEnter={() => setDragging(true)}
          onDragLeave={() => setDragging(false)}
          onDrop={() => setDragging(false)}
          onChange={(event) => takeFile(event.currentTarget, onFile)}
          className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait"
        />
      </div>

      <div className="rounded-card border-line flex flex-col gap-4 border p-6">
        <h2 className="font-semibold tracking-tight">{t('journal.import.howTitle')}</h2>
        <ol className="text-content-muted flex flex-col gap-3 text-sm leading-relaxed">
          {(['step1', 'step2', 'step3'] as const).map((step, index) => (
            <li key={step} className="flex gap-3">
              <span className="text-lime-ink bg-lime flex size-6 shrink-0 items-center justify-center rounded-full font-mono text-xs">
                {index + 1}
              </span>
              <span>{t(`journal.import.${step}`)}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}

/** A hidden CSV input for re-imports, opened through its ref after a confirm. */
export function HiddenFileInput({
  inputRef,
  onFile,
}: {
  inputRef: React.Ref<HTMLInputElement>
  onFile: (file: File) => void
}) {
  return (
    <input
      ref={inputRef}
      type="file"
      accept={CSV_ACCEPT}
      tabIndex={-1}
      aria-hidden
      className="hidden"
      onChange={(event) => takeFile(event.currentTarget, onFile)}
    />
  )
}

/**
 * The rows an import skipped, line by line. The outcome itself is announced in
 * a toast; this list stays on the page because it is too long for one and is
 * something to read, not just notice.
 */
export function ImportNotice({ state, onDismiss }: { state: ImportState; onDismiss: () => void }) {
  if (state.status !== 'done' || state.skipped.length === 0) return null
  return (
    <div className="border-line bg-surface-raised rounded-card flex items-start gap-3 border px-5 py-4 text-sm">
      <div className="flex-1">
        <SkippedList skipped={state.skipped} />
      </div>
      <DismissButton onClick={onDismiss} />
    </div>
  )
}

function SkippedList({ skipped }: { skipped: SkippedRow[] }) {
  const { t } = useTranslation()
  const shown = skipped.slice(0, SKIPPED_PREVIEW)
  return (
    <div className="text-content-muted">
      <p>{t('journal.result.skipped', { count: skipped.length })}</p>
      <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 font-mono text-xs">
        {shown.map((row) => (
          <li key={row.line}>
            {t('journal.result.line', { line: row.line })}:{' '}
            {t(`journal.result.reason.${row.reason}`)}
          </li>
        ))}
        {skipped.length > shown.length ? (
          <li>{t('journal.result.more', { count: skipped.length - shown.length })}</li>
        ) : null}
      </ul>
    </div>
  )
}

function DismissButton({ onClick }: { onClick: () => void }) {
  const { t } = useTranslation()
  return (
    <Button
      variant="ghost"
      size="sm"
      className="-mt-1 -mr-2 px-2"
      onClick={onClick}
      aria-label={t('journal.errors.dismiss')}
    >
      <X className="size-4" aria-hidden />
    </Button>
  )
}
