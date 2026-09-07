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
      { path: '*', Component: NotFoundPage },
    ],
  },
])
