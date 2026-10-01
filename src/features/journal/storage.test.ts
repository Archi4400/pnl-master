import { afterEach, describe, expect, it } from 'vitest'

import { parseTradesCsv, type Trade } from './csv'
import { clearImport, parseStored, readStoredRaw, saveImport, STORAGE_KEY } from './storage'

const trade: Trade = {
  time: Date.UTC(2024, 2, 1, 12),
  base: 'BTC',
  quote: 'USDT',
  side: 'sell',
  price: '62000.5',
  qty: '0.001',
  total: '62.0005',
  fee: '0.0000015',
  feeAsset: 'BNB',
}

afterEach(() => localStorage.clear())

describe('journal storage', () => {
  it('round-trips trades through the compact format', () => {
    expect(saveImport({ trades: [trade], fileName: 'x.csv', skippedCount: 2 })).toBe('saved')
    const stored = parseStored(readStoredRaw())
    expect(stored?.trades).toEqual([trade])
    expect(stored?.fileName).toBe('x.csv')
    expect(stored?.skippedCount).toBe(2)
    expect(typeof stored?.importedAt).toBe('number')
  })

  it('keeps everything the parser produces, tiny fees included', () => {
    const { trades } = parseTradesCsv(
      '"Date(UTC)","Pair","Side","Price","Executed","Amount","Fee"\n' +
        '"2025-06-25 07:00:00","BTCUSDT","BUY","59549.66","0.00092465BTC","55.0623628USDT","0.00000092BTC"',
    )
    saveImport({ trades, fileName: 'x.csv', skippedCount: 0 })
    expect(parseStored(readStoredRaw())?.trades).toEqual(trades)
  })

  it('overwrites the previous import', () => {
    saveImport({ trades: [trade], fileName: 'old.csv', skippedCount: 0 })
    saveImport({ trades: [{ ...trade, base: 'ETH' }], fileName: 'new.csv', skippedCount: 0 })
    const stored = parseStored(readStoredRaw())
    expect(stored?.fileName).toBe('new.csv')
    expect(stored?.trades.map((t) => t.base)).toEqual(['ETH'])
  })

  it('clears back to no data', () => {
    saveImport({ trades: [trade], fileName: 'x.csv', skippedCount: 0 })
    clearImport()
    expect(parseStored(readStoredRaw())).toBeNull()
  })

  it.each([
    ['not json', '{oops'],
    ['wrong version', JSON.stringify({ v: 2, importedAt: 1, trades: [] })],
    ['bad trade', JSON.stringify({ v: 1, importedAt: 1, trades: [[1, 'BTC', 'USDT', 0, 'x']] })],
    [
      'bad number',
      JSON.stringify({
        v: 1,
        importedAt: 1,
        trades: [[1, 'BTC', 'USDT', 0, '-1', '1', '1', '0', 'BNB']],
      }),
    ],
  ])('treats damaged data (%s) as no data', (_label, raw) => {
    localStorage.setItem(STORAGE_KEY, raw)
    expect(parseStored(readStoredRaw())).toBeNull()
  })
})
