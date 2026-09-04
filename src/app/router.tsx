import { createBrowserRouter } from 'react-router'

import { DashboardPage } from '@/pages/dashboard-page'
import { NotFoundPage } from '@/pages/not-found-page'

import { RootLayout } from './layouts/root-layout'

export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    children: [
      { index: true, Component: DashboardPage },
      {
        path: 'transactions',
        // Object form of `lazy`: this page ships as its own chunk and is only
        // downloaded the first time the route is visited.
        lazy: {
          Component: async () => (await import('@/pages/transactions-page')).TransactionsPage,
        },
      },
      { path: '*', Component: NotFoundPage },
    ],
  },
])
