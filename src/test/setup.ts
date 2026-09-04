import '@testing-library/jest-dom/vitest'

import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// React Testing Library does not unmount between tests automatically when
// globals are enabled, so do it here to keep tests isolated.
afterEach(() => {
  cleanup()
})
