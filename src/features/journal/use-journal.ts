import { useCallback, useMemo, useState, useSyncExternalStore } from 'react'
import { useTranslation } from 'react-i18next'

import { notify } from '@/lib/notify'

import {
  ImportError,
  parseTradesCsv,
  type ImportErrorCode,
  type ImportFormat,
  type SkippedRow,
} from './csv'
import { computeAllPairs } from './stats'
import {
  clearImport,
  parseStored,
  readStoredRaw,
  saveImport,
  subscribeStored,
  type StoredImport,
} from './storage'

/** Files beyond this are refused before reading: a spot history is far smaller. */
const MAX_FILE_BYTES = 20 * 1024 * 1024

/**
 * The stored import, live across tabs.
 *
 * useSyncExternalStore gets the raw string as its snapshot — a string compares
 * by value, so React re-renders only when storage actually changed — and the
 * parse happens once per change. The server snapshot is null, which is also
 * what the first client render shows, so there is nothing to mismatch.
 */
export function useStoredImport(): StoredImport | null {
  const raw = useSyncExternalStore(subscribeStored, readStoredRaw, () => null)
  return useMemo(() => parseStored(raw), [raw])
}

export type ImportFailure = ImportErrorCode | 'too-large' | 'read' | 'quota' | 'unavailable'

export type ImportState =
  | { status: 'idle' }
  | { status: 'parsing'; fileName: string }
  | { status: 'error'; error: ImportFailure }
  | { status: 'done'; imported: number; skipped: SkippedRow[]; format: ImportFormat }

type Outcome = Extract<ImportState, { status: 'error' | 'done' }>

/** Read, parse and store one file; every failure comes back as a value. */
async function readAndStore(file: File): Promise<Outcome> {
  if (file.size > MAX_FILE_BYTES) return { status: 'error', error: 'too-large' }

  let text: string
  try {
    text = await file.text()
  } catch {
    return { status: 'error', error: 'read' }
  }
  // Let the "parsing" state paint before a large file keeps the thread busy.
  await new Promise((resolve) => setTimeout(resolve, 0))

  try {
    const result = parseTradesCsv(text, { fileName: file.name })
    const saved = saveImport({
      trades: result.trades,
      fileName: file.name,
      skippedCount: result.skipped.length,
      format: result.format,
    })
    if (saved !== 'saved') return { status: 'error', error: saved }
    return {
      status: 'done',
      imported: result.trades.length,
      skipped: result.skipped,
      format: result.format,
    }
  } catch (error) {
    // Anything unexpected still lands as a message, never a blank page.
    return { status: 'error', error: error instanceof ImportError ? error.code : 'unrecognized' }
  }
}

/**
 * Import a CSV, reporting progress in a toast that turns into the outcome in
 * place: "Reading file…" becomes "Imported 260 trades" or the reason it failed.
 */
export function useTradesImport() {
  const { t } = useTranslation()
  const [state, setState] = useState<ImportState>({ status: 'idle' })

  const importFile = useCallback(
    async (file: File) => {
      setState({ status: 'parsing', fileName: file.name })
      const toastId = notify.loading(t('journal.toast.reading', { name: file.name }))

      const outcome = await readAndStore(file)
      setState(outcome)

      if (outcome.status === 'done') {
        const notes = [
          outcome.skipped.length > 0
            ? t('journal.toast.skipped', { count: outcome.skipped.length })
            : null,
          outcome.format === 'order-history' ? t('journal.result.noFees') : null,
        ].filter(Boolean)
        notify.resolve(toastId, 'success', {
          title: t('journal.result.imported', { count: outcome.imported }),
          body: notes.join(' ') || undefined,
        })
      } else {
        notify.resolve(toastId, 'error', {
          title: t('journal.errors.title'),
          body: t(`journal.errors.${outcome.error}`),
        })
      }
    },
    [t],
  )

  const reset = useCallback(() => {
    clearImport()
    setState({ status: 'idle' })
    notify.info(t('journal.toast.reset'))
  }, [t])

  const dismiss = useCallback(() => setState({ status: 'idle' }), [])

  return { state, importFile, reset, dismiss }
}

/** Per-pair statistics, recomputed only when the trades change. */
export function usePairStats(stored: StoredImport | null) {
  return useMemo(() => (stored ? computeAllPairs(stored.trades) : []), [stored])
}
