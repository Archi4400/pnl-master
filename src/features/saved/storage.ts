import { decodeSnapshot, encodeSnapshot, type Snapshot } from '@/features/share/snapshot'

/**
 * Saved calculations in localStorage.
 *
 * Each entry stores the snapshot as the same query string a share link uses, so
 * there is one format and one validator for both. Everything read back is
 * re-validated: localStorage is user-editable and survives app updates, so an
 * entry that no longer decodes is dropped rather than trusted.
 */

export type SavedEntry = {
  id: string
  name: string
  savedAt: number
  snapshot: Snapshot
  /** The result at save time, so the list can show it without recomputing. */
  pnl: number | null
}

type StoredEntry = {
  id: string
  name: string
  savedAt: number
  query: string
  pnl: number | null
}

export const STORAGE_KEY = 'pnl-master:saved'
/** Enough for real use, small enough that the list stays scannable. */
export const SAVED_LIMIT = 50
export const NAME_MAX_LENGTH = 60

const CHANGE_EVENT = 'pnl-master:saved-change'

function isStoredEntry(value: unknown): value is StoredEntry {
  if (typeof value !== 'object' || value === null) return false
  const entry = value as Record<string, unknown>
  return (
    typeof entry.id === 'string' &&
    typeof entry.name === 'string' &&
    typeof entry.savedAt === 'number' &&
    typeof entry.query === 'string' &&
    (entry.pnl === null || typeof entry.pnl === 'number')
  )
}

function fromStored(stored: StoredEntry): SavedEntry | null {
  const snapshot = decodeSnapshot(new URLSearchParams(stored.query))
  if (!snapshot) return null
  return {
    id: stored.id,
    name: stored.name.slice(0, NAME_MAX_LENGTH),
    savedAt: stored.savedAt,
    snapshot,
    pnl: stored.pnl,
  }
}

function toStored(entry: SavedEntry): StoredEntry {
  return {
    id: entry.id,
    name: entry.name,
    savedAt: entry.savedAt,
    query: encodeSnapshot(entry.snapshot).toString(),
    pnl: entry.pnl,
  }
}

/** The raw string, which doubles as a cheap change check for subscribers. */
export function readSavedRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    // Storage can throw outright: disabled cookies, some private modes.
    return null
  }
}

export function parseSaved(raw: string | null): SavedEntry[] {
  if (!raw) return []
  try {
    const data: unknown = JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data
      .filter(isStoredEntry)
      .map(fromStored)
      .filter((entry): entry is SavedEntry => entry !== null)
  } catch {
    return []
  }
}

function write(entries: SavedEntry[]): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries.map(toStored)))
  } catch {
    // Quota exceeded or storage disabled; the caller reports the failure.
    return false
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return true
}

export function readSaved(): SavedEntry[] {
  return parseSaved(readSavedRaw())
}

/**
 * randomUUID only exists in secure contexts (https, localhost); the fallback is
 * plenty unique for ids that only have to differ within one browser's list.
 */
function newId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`
}

/** Newest first; the oldest entries fall off past the limit. */
export function addSaved(entry: Omit<SavedEntry, 'id' | 'savedAt'>): boolean {
  const saved: SavedEntry = {
    ...entry,
    name: entry.name.trim().slice(0, NAME_MAX_LENGTH),
    id: newId(),
    savedAt: Date.now(),
  }
  return write([saved, ...readSaved()].slice(0, SAVED_LIMIT))
}

export function removeSaved(id: string): boolean {
  return write(readSaved().filter((entry) => entry.id !== id))
}

/**
 * For useSyncExternalStore. The storage event covers other tabs; the custom
 * event covers this one, where the storage event never fires.
 */
export function subscribeSaved(listener: () => void): () => void {
  const onStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) listener()
  }
  window.addEventListener('storage', onStorage)
  window.addEventListener(CHANGE_EVENT, listener)
  return () => {
    window.removeEventListener('storage', onStorage)
    window.removeEventListener(CHANGE_EVENT, listener)
  }
}
