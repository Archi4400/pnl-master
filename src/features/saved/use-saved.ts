import { useMemo, useSyncExternalStore } from 'react'

import { parseSaved, readSavedRaw, subscribeSaved } from './storage'

/**
 * The saved list, live across components and tabs.
 *
 * The snapshot handed to React is the raw string, not the parsed array: it must
 * be referentially stable between reads or React re-renders forever, and a
 * string compares by value for free. Parsing then happens once per change.
 */
export function useSaved() {
  const raw = useSyncExternalStore(subscribeSaved, readSavedRaw, () => null)
  return useMemo(() => parseSaved(raw), [raw])
}
