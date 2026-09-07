import { describe, expect, it } from 'vitest'

import { cn } from './utils'

describe('cn', () => {
  it('keeps the last of two conflicting Tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4')
  })

  it('drops falsy values', () => {
    const isHidden = false
    expect(cn('flex', isHidden && 'hidden', undefined)).toBe('flex')
  })
})
