import { afterEach, describe, expect, it, vi } from 'vitest'

import type { Snapshot } from '@/features/share/snapshot'

import {
  addSaved,
  parseSaved,
  readSaved,
  removeSaved,
  SAVED_LIMIT,
  STORAGE_KEY,
  subscribeSaved,
} from './storage'

const snapshot: Snapshot = {
  mode: 'futures',
  asset: 'ETH',
  futures: {
    direction: 'long',
    amountSource: 'quote',
    amount: '1000',
    openPrice: '3000',
    closePrice: '3300',
    leverage: '5',
  },
}

afterEach(() => localStorage.clear())

describe('saved calculations', () => {
  it('starts empty', () => {
    expect(readSaved()).toEqual([])
  })

  it('adds newest first and reads the snapshot back', () => {
    addSaved({ name: 'first', snapshot, pnl: 500 })
    addSaved({ name: '  second  ', snapshot, pnl: -20 })
    const saved = readSaved()
    expect(saved.map((entry) => entry.name)).toEqual(['second', 'first'])
    expect(saved[0]?.snapshot).toEqual(snapshot)
    expect(saved[0]?.pnl).toBe(-20)
  })

  it('drops the oldest past the limit', () => {
    for (let i = 0; i < SAVED_LIMIT + 3; i++) addSaved({ name: `n${i}`, snapshot, pnl: null })
    const saved = readSaved()
    expect(saved).toHaveLength(SAVED_LIMIT)
    expect(saved[0]?.name).toBe(`n${SAVED_LIMIT + 2}`)
  })

  it('removes by id', () => {
    addSaved({ name: 'keep', snapshot, pnl: null })
    addSaved({ name: 'drop', snapshot, pnl: null })
    const drop = readSaved()[0]
    removeSaved(drop?.id ?? '')
    expect(readSaved().map((entry) => entry.name)).toEqual(['keep'])
  })

  it('notifies subscribers in the same tab', () => {
    const listener = vi.fn<() => void>()
    const unsubscribe = subscribeSaved(listener)
    addSaved({ name: 'x', snapshot, pnl: null })
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    addSaved({ name: 'y', snapshot, pnl: null })
    expect(listener).toHaveBeenCalledTimes(1)
  })
})

describe('parseSaved', () => {
  it('survives garbage in storage', () => {
    expect(parseSaved('not json')).toEqual([])
    expect(parseSaved('{"a":1}')).toEqual([])
  })

  it('drops entries that no longer decode, keeping the rest', () => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify([
        { id: '1', name: 'ok', savedAt: 1, query: 'side=long&usdt=1&open=1&close=2&lev=1', pnl: 1 },
        { id: '2', name: 'broken', savedAt: 2, query: 'side=long', pnl: null },
        { id: 3, name: 'wrong shape' },
      ]),
    )
    expect(readSaved().map((entry) => entry.name)).toEqual(['ok'])
  })
})
