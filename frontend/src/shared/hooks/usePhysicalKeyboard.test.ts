import { describe, expect, it } from 'vitest'

import { usePhysicalKeyboard } from '@/shared/hooks/usePhysicalKeyboard'

describe('usePhysicalKeyboard', () => {
  it('exports hook function', () => {
    expect(typeof usePhysicalKeyboard).toBe('function')
  })
})
