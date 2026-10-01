import Big from 'big.js'

import { encodeSnapshot } from '@/features/share/snapshot'

import type { PairStats } from './stats'

/** The quote the calculator works in; other quotes go without a coin. */
const CALCULATOR_QUOTE = 'USDT'

/**
 * A link that opens the spot calculator on this open position: what is held,
 * at its average entry, with the planned buy at zero and both prices at the
 * market. The calculator page parses the query on its own, so this only has to
 * build the same URL a share link would.
 *
 * Null when there is nothing to model (flat position, no average entry).
 */
export function calculatorLink(pair: PairStats, price: number | undefined): string | null {
  if (pair.avgPrice === null || pair.position.lte(0)) return null

  const average = pair.avgPrice.toFixed()
  // Before prices load, the average stands in, so the link still opens a valid sheet.
  const market = price === undefined ? average : new Big(price).toFixed()

  const params = encodeSnapshot({
    mode: 'spot',
    // The calculator prices coins in USDT; naming the coin for a BTC-quoted
    // pair would offer USDT market prices next to BTC figures.
    asset: pair.quote === CALCULATOR_QUOTE ? pair.base : null,
    spot: {
      holdingSource: 'units',
      holding: pair.position.toFixed(),
      averagePrice: average,
      buySource: 'units',
      buy: '0',
      buyPrice: market,
      salePrice: market,
    },
  })
  return `/?${params}#calculator`
}
