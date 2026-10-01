import { Big } from 'big.js'
import Papa from 'papaparse'

/**
 * Binance spot trade-history CSV → normalised trades.
 *
 * Three export layouts are recognised:
 *
 *   current:       Date(UTC), Pair, Side, Price, Executed, Amount, Fee
 *                  where Executed / Amount / Fee carry their asset as a suffix
 *                  ("0.00100000BTC", "62.5USDT", "0.0000015BNB")
 *   legacy:        Date(UTC), Market, Type, Price, Amount, Total, Fee, Fee Coin
 *                  with bare numbers and the fee asset in its own column
 *   order-history: Time, OrderNo, Pair, Type, Side, Order Price, Order Amount,
 *                  Time, Executed, Average Price, Trading total, Status
 *                  one row per order rather than per fill, and no fees at all
 *
 * Times may be in a zone other than UTC: newer exports say so in the date
 * header ("Date(UTC+2)") or in the file name ("...(UTC+2)-part1-of1.csv").
 *
 * Amounts stay decimal strings: they are money, and every sum over them is done
 * with big.js, never with floats.
 */

export type Side = 'buy' | 'sell'

export type Trade = {
  /** Execution time, ms since epoch (the CSV is in UTC). */
  time: number
  base: string
  quote: string
  side: Side
  /** Price in the quote asset. */
  price: string
  /** Base asset filled. */
  qty: string
  /** Quote asset paid or received. */
  total: string
  fee: string
  feeAsset: string
}

/** `unfilled`: an order that was cancelled or expired before anything filled. */
export type SkipReason = 'date' | 'pair' | 'side' | 'number' | 'unfilled'

export type SkippedRow = {
  /** 1-based line in the file, header included, as a spreadsheet shows it. */
  line: number
  reason: SkipReason
}

export type ImportResult = {
  trades: Trade[]
  skipped: SkippedRow[]
  format: ImportFormat
}

export type ImportFormat = 'current' | 'legacy' | 'order-history'

export type ImportErrorCode = 'empty' | 'unrecognized' | 'no-trades'

/** A file the importer cannot use at all; the code picks the message shown. */
export class ImportError extends Error {
  readonly code: ImportErrorCode

  constructor(code: ImportErrorCode) {
    super(code)
    this.name = 'ImportError'
    this.code = code
  }
}

/**
 * Quote assets a pair symbol can end in. Matched longest first so "BTCFDUSD"
 * splits as BTC/FDUSD rather than BTCFD/USD… and "ETHBTC" as ETH/BTC.
 */
const QUOTE_ASSETS = [
  'FDUSD',
  'USDT',
  'USDC',
  'TUSD',
  'BUSD',
  'USDP',
  'AEUR',
  'EURI',
  'IDRT',
  'BIDR',
  'DAI',
  'EUR',
  'GBP',
  'TRY',
  'BRL',
  'AUD',
  'RUB',
  'UAH',
  'NGN',
  'ZAR',
  'PLN',
  'RON',
  'ARS',
  'MXN',
  'COP',
  'CZK',
  'JPY',
  'BTC',
  'ETH',
  'BNB',
  'XRP',
  'TRX',
  'DOGE',
].sort((a, b) => b.length - a.length)

export function splitPair(raw: string): { base: string; quote: string } | null {
  const symbol = raw.trim().toUpperCase()
  const separated = symbol.split(/[/\-_]/)
  if (separated.length === 2 && separated[0] && separated[1]) {
    return { base: separated[0], quote: separated[1] }
  }
  if (!/^[A-Z0-9]+$/.test(symbol)) return null
  for (const quote of QUOTE_ASSETS) {
    if (symbol.length > quote.length && symbol.endsWith(quote)) {
      return { base: symbol.slice(0, -quote.length), quote }
    }
  }
  return null
}

/** "1,234.5" → "1234.5". Only strips commas that really are thousands separators. */
function normaliseNumber(raw: string): string | null {
  const value = raw.trim()
  const plain = /^\d{1,3}(,\d{3})+(\.\d+)?$/.test(value) ? value.replaceAll(',', '') : value
  if (!/^\d+(\.\d+)?$|^\.\d+$/.test(plain)) return null
  // toFixed(), not toString(): big.js switches to exponent notation below 1e-7,
  // and a fee like 9.2e-7 BNB is common. Stored amounts must stay plain.
  return new Big(plain).toFixed()
}

/**
 * Split "0.00100000BTC" into amount and asset.
 *
 * A regex alone cannot do this safely because tickers may start with a digit
 * (1INCH, 1000SATS): "0.51INCH" would read as 0.51 of "INCH". So the assets the
 * row can contain are tried as suffixes first, and only then the generic split.
 */
export function splitAmount(
  raw: string,
  expected: readonly string[] = [],
): { value: string; asset: string } | null {
  const text = raw.trim().toUpperCase()
  for (const asset of [...expected].sort((a, b) => b.length - a.length)) {
    if (asset && text.endsWith(asset)) {
      const value = normaliseNumber(text.slice(0, -asset.length))
      if (value !== null) return { value, asset }
    }
  }
  const match = /^([\d.,]+)\s*([A-Z][A-Z0-9]*)?$/.exec(text)
  if (!match?.[1]) return null
  const value = normaliseNumber(match[1])
  return value === null ? null : { value, asset: match[2] ?? '' }
}

/** "2024-03-01 12:00:00" (or "24-03-01 …") in UTC → ms. */
export function parseUtcDate(raw: string): number | null {
  const match = /^(\d{2}|\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2}):(\d{2})/.exec(raw.trim())
  if (!match) return null
  const [, y, mo, d, h, mi, s] = match.map(Number) as number[]
  const year = (y as number) < 100 ? 2000 + (y as number) : (y as number)
  const time = Date.UTC(year, (mo as number) - 1, d, h, mi, s)
  return Number.isNaN(time) ? null : time
}

/**
 * The UTC offset an export was written in, in minutes, from text such as
 * "Date(UTC+2)", "Time(UTC-05:30)" or a file name ending "(UTC+2)-part1.csv".
 * Null when none is stated, which for Binance means plain UTC.
 */
export function readUtcOffset(text: string): number | null {
  const match = /UTC\s*([+-])\s*(\d{1,2})(?::?(\d{2}))?/i.exec(text)
  if (!match) return null
  const minutes = Number(match[2]) * 60 + Number(match[3] ?? 0)
  return match[1] === '-' ? -minutes : minutes
}

function parseSide(raw: string): Side | null {
  const side = raw.trim().toLowerCase()
  return side === 'buy' ? 'buy' : side === 'sell' ? 'sell' : null
}

/** Header text reduced to letters, so "Date(UTC)", "date (utc)" and "DATE_UTC" all match. */
function key(header: string): string {
  return header.toLowerCase().replace(/[^a-z]/g, '')
}

type Columns = {
  date: string
  pair: string
  side: string
  price: string
  qty: string
  total: string
  /** Absent in Order History, which records no fees. */
  fee?: string
  feeCoin?: string
  format: ImportFormat
}

function detectColumns(fields: readonly string[]): Columns {
  const byKey = new Map(fields.map((field) => [key(field), field]))
  const find = (...names: string[]) => names.map((name) => byKey.get(name)).find(Boolean)

  const pair = find('pair', 'market', 'symbol')
  const side = find('side', 'type')

  // Order History: one row per order. "Time" appears twice (placed, then last
  // updated) and PapaParse renames the second to "Time_1". The later one is
  // when the order filled, so it is the one that counts.
  const averagePrice = find('averageprice')
  const tradingTotal = find('tradingtotal')
  if (averagePrice || tradingTotal || find('orderno', 'orderid')) {
    const times = fields.filter((field) => /^(time|date)/.test(key(field)))
    const date = times[times.length - 1]
    const executed = find('executed')
    if (!date || !pair || !side || !averagePrice || !executed || !tradingTotal) {
      throw new ImportError('unrecognized')
    }
    return {
      date,
      pair,
      side: find('side') ?? side,
      price: averagePrice,
      qty: executed,
      total: tradingTotal,
      format: 'order-history',
    }
  }

  const date = fields.find((field) => key(field).startsWith('date'))
  const price = find('price')
  const fee = find('fee')
  if (!date || !pair || !side || !price || !fee) throw new ImportError('unrecognized')

  const executed = find('executed')
  if (executed) {
    const total = find('amount')
    if (!total) throw new ImportError('unrecognized')
    return { date, pair, side, price, qty: executed, total, fee, format: 'current' }
  }

  const qty = find('amount')
  const total = find('total')
  const feeCoin = find('feecoin', 'feeasset')
  if (!qty || !total) throw new ImportError('unrecognized')
  return { date, pair, side, price, qty, total, fee, feeCoin, format: 'legacy' }
}

function parseRow(
  row: Record<string, string>,
  columns: Columns,
  offsetMinutes: number,
): Trade | SkipReason {
  const localTime = parseUtcDate(row[columns.date] ?? '')
  if (localTime === null) return 'date'
  // The digits are wall-clock time in the export's zone; shift them to UTC.
  const time = localTime - offsetMinutes * 60_000
  const pair = splitPair(row[columns.pair] ?? '')
  if (!pair) return 'pair'
  const side = parseSide(row[columns.side] ?? '')
  if (!side) return 'side'

  const qty = splitAmount(row[columns.qty] ?? '', [pair.base])
  const total = splitAmount(row[columns.total] ?? '', [pair.quote])
  if (!qty || !total) return 'number'
  // An order that never filled is not a trade, and not an error either.
  if (new Big(qty.value).lte(0)) return columns.format === 'order-history' ? 'unfilled' : 'number'

  const rawPrice = (row[columns.price] ?? '').trim()
  let price = rawPrice === '' ? null : normaliseNumber(rawPrice)
  // Unreadable is an error; only a blank or zero price may be filled in.
  if (rawPrice !== '' && price === null) return 'number'
  // Some exports leave the average blank on a fill; the total says it anyway.
  if ((price === null || new Big(price).eq(0)) && new Big(total.value).gt(0)) {
    price = new Big(total.value).div(qty.value).toFixed()
  }
  if (price === null) return 'number'

  // Fees are charged in the bought asset, the quote asset, or BNB. Order
  // History has no fee column at all, so its trades carry none.
  let fee = { value: '0', asset: pair.quote }
  if (columns.fee) {
    const parsed = splitAmount(row[columns.fee] ?? '', [pair.base, pair.quote, 'BNB'])
    if (!parsed) return 'number'
    fee = parsed
  }

  const feeAsset = columns.feeCoin ? (row[columns.feeCoin] ?? '').trim().toUpperCase() : fee.asset
  return {
    time,
    base: pair.base,
    quote: pair.quote,
    side,
    price,
    qty: qty.value,
    total: total.value,
    fee: fee.value,
    feeAsset: feeAsset || pair.quote,
  }
}

/**
 * Parse a Binance trade-history CSV. Throws ImportError when the file as a
 * whole is unusable; individual bad rows are skipped and reported instead, so
 * one odd line never costs the user the rest of their history.
 */
export function parseTradesCsv(
  text: string,
  { fileName = '' }: { fileName?: string } = {},
): ImportResult {
  // Excel sometimes saves CSVs with a byte-order mark, which would otherwise
  // stick to the first header and hide the date column.
  const content = text.replace(/^﻿/, '')
  if (!content.trim()) throw new ImportError('empty')

  const parsed = Papa.parse<Record<string, string>>(content, {
    header: true,
    skipEmptyLines: 'greedy',
    transformHeader: (header) => header.trim(),
  })
  const columns = detectColumns(parsed.meta.fields ?? [])
  // The date header is the more specific source; the file name is the fallback.
  const offsetMinutes = readUtcOffset(columns.date) ?? readUtcOffset(fileName) ?? 0

  const trades: Trade[] = []
  const skipped: SkippedRow[] = []
  parsed.data.forEach((row, index) => {
    const result = parseRow(row, columns, offsetMinutes)
    // +2: one for the header line, one because spreadsheets count from 1.
    if (typeof result === 'string') skipped.push({ line: index + 2, reason: result })
    else trades.push(result)
  })

  if (trades.length === 0) throw new ImportError('no-trades')
  // Exports are newest first; every calculation wants oldest first. The sort
  // is stable, so fills from the same second keep their file order.
  trades.sort((a, b) => a.time - b.time)
  return { trades, skipped, format: columns.format }
}
