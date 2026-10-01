import { createBrowserRouter } from 'react-router'

import { CalculatorPage } from '@/pages/calculator-page'
import { NotFoundPage } from '@/pages/not-found-page'

import { RootLayout } from './layouts/root-layout'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: CalculatorPage },
      {
        path: 'journal',
        // Code-split: the charting library ships only to people who open it.
        lazy: {
          Component: async () => (await import('@/pages/journal-page')).JournalPage,
        },
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
