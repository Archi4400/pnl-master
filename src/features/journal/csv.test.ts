import { describe, expect, it } from 'vitest'

import {
  ImportError,
  parseTradesCsv,
  parseUtcDate,
  readUtcOffset,
  splitAmount,
  splitPair,
  type ImportErrorCode,
} from './csv'

const CURRENT = `"Date(UTC)","Pair","Side","Price","Executed","Amount","Fee"
"2024-03-02 10:00:00","BTCUSDT","SELL","70000","0.00050000BTC","35USDT","0.035USDT"
"2024-03-01 12:30:00","BTCUSDT","BUY","62,000.50","0.00100000BTC","62.0005USDT","0.0000015BNB"
"2024-03-01 13:00:00","1INCHUSDT","BUY","0.51","100.0001INCH","51USDT","0.1001INCH"`

const LEGACY = `Date(UTC),Market,Type,Price,Amount,Total,Fee,Fee Coin
2021-05-12 10:20:30,ETHBTC,BUY,0.07,2,0.14,0.002,ETH`

// Same shape as a real Binance Order History export: BOM, footnote marks in
// the headers, "Time" twice, one row per order, and no fee column.
const ORDER_HISTORY = `\uFEFFTime,OrderNo,Pair,Type¹,Side,Order Price,Order Amount,Time,Executed²,Average Price,Trading total³,Status
2026-01-20 10:10:12,1001,BTCUSDT,Market,BUY,0,0.0011BTC,2026-01-20 10:10:12,0.0011BTC,91087.7,100.19647USDT,FILLED
2026-01-18 20:16:06,1002,BTCUSDT,Limit,SELL,99000,0.001BTC,2026-01-19 08:00:00,0.001BTC,99000,99USDT,FILLED
2026-01-17 09:00:00,1003,ETHUSDT,Limit,BUY,2000,1ETH,2026-01-17 12:00:00,0ETH,0,0USDT,CANCELED`

const ORDER_HISTORY_FILE = 'Binance-Spot-Order-History-202609301805(UTC+2)-part1-of1.csv'

/** The error parseTradesCsv throws for `text`, or undefined when it does not. */
function importError(text: string): unknown {
  try {
    parseTradesCsv(text)
  } catch (error) {
    return error
  }
  return undefined
}

describe('splitPair', () => {
  it.each([
    ['BTCUSDT', 'BTC', 'USDT'],
    ['ETHBTC', 'ETH', 'BTC'],
    ['BTCFDUSD', 'BTC', 'FDUSD'],
    ['SOLEUR', 'SOL', 'EUR'],
    ['1INCHUSDT', '1INCH', 'USDT'],
    ['btc/usdt', 'BTC', 'USDT'],
  ])('%s → %s / %s', (raw, base, quote) => {
    expect(splitPair(raw)).toEqual({ base, quote })
  })

  it('refuses a symbol with no known quote', () => {
    expect(splitPair('FOOBAR')).toBeNull()
    expect(splitPair('USDT')).toBeNull()
  })
})

describe('splitAmount', () => {
  it('separates the asset suffix', () => {
    expect(splitAmount('0.00100000BTC', ['BTC'])).toEqual({ value: '0.001', asset: 'BTC' })
  })

  it('handles tickers that start with a digit when they are expected', () => {
    expect(splitAmount('0.51INCH', ['1INCH'])).toEqual({ value: '0.5', asset: '1INCH' })
  })

  it('falls back to a generic split for unexpected assets', () => {
    expect(splitAmount('0.0000015BNB', ['BTC'])).toEqual({ value: '0.0000015', asset: 'BNB' })
  })

  it('reads bare numbers and thousands separators', () => {
    expect(splitAmount('2')).toEqual({ value: '2', asset: '' })
    expect(splitAmount('1,234.5USDT', ['USDT'])).toEqual({ value: '1234.5', asset: 'USDT' })
  })

  it('rejects text', () => {
    expect(splitAmount('abc')).toBeNull()
  })

  it('never writes tiny amounts in exponent notation', () => {
    expect(splitAmount('0.00000092BTC', ['BTC'])).toEqual({ value: '0.00000092', asset: 'BTC' })
  })
})

describe('parseUtcDate', () => {
  it('reads the CSV time as UTC', () => {
    expect(parseUtcDate('2024-03-01 12:30:00')).toBe(Date.UTC(2024, 2, 1, 12, 30, 0))
    expect(parseUtcDate('24-03-01 12:30:00')).toBe(Date.UTC(2024, 2, 1, 12, 30, 0))
  })

  it('rejects anything else', () => {
    expect(parseUtcDate('yesterday')).toBeNull()
  })
})

describe('parseTradesCsv', () => {
  it('parses the current export, oldest first', () => {
    const { trades, skipped, format } = parseTradesCsv(CURRENT)
    expect(format).toBe('current')
    expect(skipped).toEqual([])
    expect(trades.map((trade) => `${trade.side} ${trade.qty} ${trade.base}`)).toEqual([
      'buy 0.001 BTC',
      'buy 100 1INCH',
      'sell 0.0005 BTC',
    ])
    expect(trades[0]).toMatchObject({
      quote: 'USDT',
      price: '62000.5',
      total: '62.0005',
      fee: '0.0000015',
      feeAsset: 'BNB',
    })
  })

  it('parses the legacy export with its separate fee coin', () => {
    const { trades, format } = parseTradesCsv(LEGACY)
    expect(format).toBe('legacy')
    expect(trades[0]).toMatchObject({
      base: 'ETH',
      quote: 'BTC',
      side: 'buy',
      qty: '2',
      total: '0.14',
      fee: '0.002',
      feeAsset: 'ETH',
    })
  })

  it('strips a byte-order mark before reading headers', () => {
    expect(parseTradesCsv(`﻿${LEGACY}`).trades).toHaveLength(1)
  })

  it('skips bad rows and reports their line numbers', () => {
    const text = `${CURRENT}
"not a date","BTCUSDT","BUY","1","1BTC","1USDT","0USDT"
"2024-03-03 10:00:00","FOOBAR","BUY","1","1FOO","1BAR","0BAR"
"2024-03-03 10:00:00","BTCUSDT","HOLD","1","1BTC","1USDT","0USDT"
"2024-03-03 10:00:00","BTCUSDT","BUY","x","1BTC","1USDT","0USDT"`
    const { trades, skipped } = parseTradesCsv(text)
    expect(trades).toHaveLength(3)
    expect(skipped).toEqual([
      { line: 5, reason: 'date' },
      { line: 6, reason: 'pair' },
      { line: 7, reason: 'side' },
      { line: 8, reason: 'number' },
    ])
  })

  it.each<[string, string, ImportErrorCode]>([
    ['an empty file', '   \n', 'empty'],
    ['an unrelated CSV', 'name,age\nann,30', 'unrecognized'],
    [
      'a trade export with no usable rows',
      '"Date(UTC)","Pair","Side","Price","Executed","Amount","Fee"\n"bad","BTCUSDT","BUY","1","1BTC","1USDT","0USDT"',
      'no-trades',
    ],
  ])('rejects %s', (_label, text, code) => {
    const error = importError(text)
    expect(error).toBeInstanceOf(ImportError)
    expect(error).toMatchObject({ code })
  })
})

describe('readUtcOffset', () => {
  it.each([
    ['Date(UTC)', null],
    ['Date(UTC+2)', 120],
    ['Time(UTC-05:30)', -330],
    ['Binance-Spot-Order-History-202609301805(UTC+2)-part1-of1.csv', 120],
    ['export.csv', null],
  ])('%s → %p', (text, minutes) => {
    expect(readUtcOffset(text)).toBe(minutes)
  })
})

describe('parseTradesCsv — Order History', () => {
  const { trades, skipped, format } = parseTradesCsv(ORDER_HISTORY, {
    fileName: ORDER_HISTORY_FILE,
  })

  it('is recognised and imported', () => {
    expect(format).toBe('order-history')
    expect(trades).toHaveLength(2)
  })

  it('reads the fill from Executed, Average Price and Trading total, with no fee', () => {
    const buy = trades.find((trade) => trade.side === 'buy')
    expect(buy).toMatchObject({
      base: 'BTC',
      quote: 'USDT',
      price: '91087.7',
      qty: '0.0011',
      total: '100.19647',
      fee: '0',
      feeAsset: 'USDT',
    })
  })

  it('uses the second Time column, when the order filled, shifted from UTC+2', () => {
    const sell = trades.find((trade) => trade.side === 'sell')
    // 2026-01-19 08:00:00 at UTC+2 is 06:00 UTC.
    expect(sell?.time).toBe(Date.UTC(2026, 0, 19, 6, 0, 0))
  })

  it('skips orders that never filled, saying so', () => {
    expect(skipped).toEqual([{ line: 4, reason: 'unfilled' }])
  })

  it('reads times as UTC when the file name states no zone', () => {
    const plain = parseTradesCsv(ORDER_HISTORY, { fileName: 'orders.csv' })
    expect(plain.trades[0]?.time).toBe(Date.UTC(2026, 0, 19, 8, 0, 0))
  })
})

describe('parseTradesCsv — zone in the date header', () => {
  it('shifts a Trade History stamped Date(UTC+2) back to UTC', () => {
    const { trades } = parseTradesCsv(
      '"Date(UTC+2)","Pair","Side","Price","Executed","Amount","Fee"\n' +
        '"2024-03-01 12:30:00","BTCUSDT","BUY","62000","0.001BTC","62USDT","0.01USDT"',
    )
    expect(trades[0]?.time).toBe(Date.UTC(2024, 2, 1, 10, 30, 0))
  })
})
