import type { TFunction } from 'i18next'

import type { Snapshot } from '@/features/share/snapshot'

/**
 * Human-readable summary of a snapshot: a title that doubles as the default
 * name when saving, and a one-line detail of the inputs for the saved list.
 */
export function describeSnapshot(
  snapshot: Snapshot,
  t: TFunction,
): { title: string; detail: string } {
  const prefix = snapshot.asset ? `${snapshot.asset} · ` : ''
  const assetUnit = snapshot.asset ?? t('units.asset')
  const quote = t('units.quote')

  if (snapshot.mode === 'futures') {
    const f = snapshot.futures
    const unit = f.amountSource === 'quote' ? quote : assetUnit
    return {
      title: `${prefix}${t(`direction.${f.direction}`)} ${f.leverage}×`,
      detail: `${f.amount} ${unit} · ${f.openPrice} → ${f.closePrice}`,
    }
  }

  const s = snapshot.spot
  const holdingUnit = s.holdingSource === 'units' ? assetUnit : quote
  const buyUnit = s.buySource === 'units' ? assetUnit : quote
  return {
    title: `${prefix}${t('mode.spot')}`,
    detail: `${s.holding} ${holdingUnit} @ ${s.averagePrice} + ${s.buy} ${buyUnit} @ ${s.buyPrice} → ${s.salePrice}`,
  }
}
