import { describe, expect, it } from 'vitest'

import { formatRelativeTime } from './time'

const now = new Date('2026-09-30T12:00:00Z')
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000)

describe('formatRelativeTime', () => {
  it.each([
    [20, 'this minute'],
    [5 * 60, '5 minutes ago'],
    [3 * 3600, '3 hours ago'],
    [26 * 3600, 'yesterday'],
    [3 * 86_400, '3 days ago'],
  ])('%is ago reads %j', (seconds, expected) => {
    expect(formatRelativeTime(ago(seconds), now, 'en')).toBe(expected)
  })

  it('speaks the interface language', () => {
    expect(formatRelativeTime(ago(3 * 3600), now, 'uk')).toBe('3 години тому')
  })
})
