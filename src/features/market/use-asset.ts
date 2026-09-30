import { useCallback, useState } from 'react'

import { isAsset } from '@/features/share/snapshot'

const STORAGE_KEY = 'pnl-master:asset'

function readStored(): string | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored !== null && isAsset(stored) ? stored : null
  } catch {
    return null
  }
}

/**
 * The picked coin, remembered across visits: a trader usually comes back for
 * the same pair. A coin from a shared link wins over the remembered one.
 */
export function useAsset(fromLink: string | null | undefined) {
  const [asset, setAssetState] = useState<string | null>(() => fromLink ?? readStored())

  const setAsset = useCallback((next: string | null) => {
    setAssetState(next)
    try {
      if (next === null) localStorage.removeItem(STORAGE_KEY)
      else localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Not remembering the coin is harmless.
    }
  }, [])

  return [asset, setAsset] as const
}
