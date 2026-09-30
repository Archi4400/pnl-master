import { syncPair, type PairKeys, type PairSide } from '@/features/calculator/pair'

/**
 * The spot form as plain data plus pure transitions, mirroring futures-state.ts:
 * testable without rendering, and one object instead of refs in the hook.
 */

export type SpotField =
  'quantity' | 'invested' | 'averagePrice' | 'buyQuantity' | 'buyCost' | 'buyPrice' | 'salePrice'

export type SpotValues = Record<SpotField, string>

export type SpotState = {
  values: SpotValues
  /** Which side of each pair was typed last; the other side follows it. */
  holdingSource: PairSide
  buySource: PairSide
}

/** The minimum that reproduces the form; see FuturesInputs for why. */
export type SpotInputs = {
  holdingSource: PairSide
  /** Units held, or USDT invested, depending on holdingSource. */
  holding: string
  averagePrice: string
  buySource: PairSide
  /** Units to buy, or USDT to spend, depending on buySource. */
  buy: string
  buyPrice: string
  salePrice: string
}

/** What is held, in units and in USDT, linked by the average price. */
const HOLDING_PAIR: PairKeys<SpotField> = {
  quote: 'invested',
  units: 'quantity',
  price: 'averagePrice',
}

/** The planned buy, in units and in USDT, linked by the buy price. */
const BUY_PAIR: PairKeys<SpotField> = {
  quote: 'buyCost',
  units: 'buyQuantity',
  price: 'buyPrice',
}

export const SPOT_INITIAL: SpotState = {
  values: {
    quantity: '10',
    invested: '1000',
    averagePrice: '100',
    buyQuantity: '10',
    buyCost: '500',
    buyPrice: '50',
    salePrice: '90',
  },
  holdingSource: 'units',
  buySource: 'units',
}

function sync(values: SpotValues, holdingSource: PairSide, buySource: PairSide): SpotValues {
  return syncPair(syncPair(values, HOLDING_PAIR, holdingSource), BUY_PAIR, buySource)
}

export function setSpotField(state: SpotState, field: SpotField, raw: string): SpotState {
  const holdingSource: PairSide =
    field === 'quantity' ? 'units' : field === 'invested' ? 'quote' : state.holdingSource
  const buySource: PairSide =
    field === 'buyQuantity' ? 'units' : field === 'buyCost' ? 'quote' : state.buySource

  return {
    holdingSource,
    buySource,
    values: sync({ ...state.values, [field]: raw }, holdingSource, buySource),
  }
}

export function spotFromInputs(inputs: SpotInputs): SpotState {
  const values: SpotValues = {
    ...SPOT_INITIAL.values,
    [inputs.holdingSource === 'units' ? 'quantity' : 'invested']: inputs.holding,
    averagePrice: inputs.averagePrice,
    [inputs.buySource === 'units' ? 'buyQuantity' : 'buyCost']: inputs.buy,
    buyPrice: inputs.buyPrice,
    salePrice: inputs.salePrice,
  }
  return {
    holdingSource: inputs.holdingSource,
    buySource: inputs.buySource,
    values: sync(values, inputs.holdingSource, inputs.buySource),
  }
}

export function spotToInputs({ values, holdingSource, buySource }: SpotState): SpotInputs {
  return {
    holdingSource,
    holding: holdingSource === 'units' ? values.quantity : values.invested,
    averagePrice: values.averagePrice,
    buySource,
    buy: buySource === 'units' ? values.buyQuantity : values.buyCost,
    buyPrice: values.buyPrice,
    salePrice: values.salePrice,
  }
}
