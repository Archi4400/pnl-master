import type { ImportFormat, Side, Trade } from './csv'

/**
 * Imported trades in localStorage.
 *
 * Normalised trades are stored, not the CSV, and as tuples rather than objects
 * so the field names are not repeated on every row — roughly half the size,
 * which matters against the ~5 MB localStorage budget. At ~120 bytes a trade
 * that is still tens of thousands of fills; past that, saving fails with a
 * clear message rather than silently (IndexedDB would be the next step).
 *
 * Everything read back is validated: storage outlives app versions and can be
 * edited by hand, so a damaged entry is treated as "no data", never trusted.
 */

export const STORAGE_KEY = 'binance-trades-v1'
const CHANGE_EVENT = 'pnl-master:journal-change'

export type StoredImport = {
  trades: Trade[]
  importedAt: number
  fileName: string
  /** Rows the importer skipped, kept so the notice survives a reload. */
  skippedCount: number
  /** Which export it came from; Order History has no fees, which the UI says. */
  format?: ImportFormat
}

type TradeTuple = [
  time: number,
  base: string,
  quote: string,
  side: 0 | 1,
  price: string,
  qty: string,
  total: string,
  fee: string,
  feeAsset: string,
]

type Stored = {
  v: 1
  importedAt: number
  fileName: string
  skippedCount: number
  format?: ImportFormat
  trades: TradeTuple[]
}

function toTuple(trade: Trade): TradeTuple {
  return [
    trade.time,
    trade.base,
    trade.quote,
    trade.side === 'buy' ? 0 : 1,
    trade.price,
    trade.qty,
    trade.total,
    trade.fee,
    trade.feeAsset,
  ]
}

const DECIMAL = /^\d+(\.\d+)?$/

function fromTuple(tuple: unknown): Trade | null {
  if (!Array.isArray(tuple) || tuple.length !== 9) return null
  const [time, base, quote, side, price, qty, total, fee, feeAsset] = tuple as unknown[]
  if (typeof time !== 'number' || !Number.isFinite(time)) return null
  if (typeof base !== 'string' || typeof quote !== 'string' || typeof feeAsset !== 'string') {
    return null
  }
  if (side !== 0 && side !== 1) return null
  for (const value of [price, qty, total, fee]) {
    if (typeof value !== 'string' || !DECIMAL.test(value)) return null
  }
  return {
    time,
    base,
    quote,
    side: (side === 0 ? 'buy' : 'sell') as Side,
    price: price as string,
    qty: qty as string,
    total: total as string,
    fee: fee as string,
    feeAsset,
  }
}

export function readStoredRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

/** null for no data; damaged data also reads as no data. */
export function parseStored(raw: string | null): StoredImport | null {
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as Partial<Stored>
    if (data.v !== 1 || !Array.isArray(data.trades) || typeof data.importedAt !== 'number') {
      return null
    }
    const trades: Trade[] = []
    for (const tuple of data.trades) {
      const trade = fromTuple(tuple)
      if (!trade) return null
      trades.push(trade)
    }
    if (trades.length === 0) return null
    return {
      trades,
      importedAt: data.importedAt,
      fileName: typeof data.fileName === 'string' ? data.fileName : '',
      skippedCount: typeof data.skippedCount === 'number' ? data.skippedCount : 0,
      format:
        data.format === 'current' || data.format === 'legacy' || data.format === 'order-history'
          ? data.format
          : undefined,
    }
  } catch {
    return null
  }
}

export type SaveResult = 'saved' | 'quota' | 'unavailable'

function isQuotaError(error: unknown): boolean {
  return (
    error instanceof DOMException &&
    (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')
  )
}

/** Replaces whatever was stored before: a new import is a new history. */
export function saveImport(data: Omit<StoredImport, 'importedAt'>): SaveResult {
  const stored: Stored = {
    v: 1,
    importedAt: Date.now(),
    fileName: data.fileName,
    skippedCount: data.skippedCount,
    format: data.format,
    trades: data.trades.map(toTuple),
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
  } catch (error) {
    return isQuotaError(error) ? 'quota' : 'unavailable'
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
  return 'saved'
}

export function clearImport() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // Nothing stored that we could reach anyway.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT))
}

/** For useSyncExternalStore: same-tab changes plus other tabs via `storage`. */
export function subscribeStored(listener: () => void): () => void {
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
