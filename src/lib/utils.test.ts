import { describe, expect, it } from 'vitest'

import { cn, formatCurrency } from './utils'

describe('cn', () => {
  it('keeps the last of two conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('drops falsy values', () => {
    const isHidden = false
    expect(cn('flex', isHidden && 'hidden', undefined)).toBe('flex')
  })
})

describe('formatCurrency', () => {
  it('marks positive amounts with an explicit sign', () => {
    expect(formatCurrency(1200, 'en-US')).toContain('+')
  })

  it('marks negative amounts as negative', () => {
    expect(formatCurrency(-1200, 'en-US')).toContain('-')
  })
})
