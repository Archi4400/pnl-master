# PnL Master

Profit-and-loss tracker. Personal project for learning React coming from Vue.

## Stack

| Concern      | Choice                                |
| ------------ | ------------------------------------- |
| Build        | Vite 8 + React 19 + TypeScript 6      |
| Styling      | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Primitives   | Radix UI (unified `radix-ui` package) |
| Server state | TanStack Query v5                     |
| Routing      | React Router v8 (data mode)           |
| i18n         | i18next + react-i18next (en, uk)      |
| Forms        | react-hook-form + zod                 |
| Lint         | Oxlint                                |
| Format       | Prettier                              |
| Tests        | Vitest + Testing Library              |

## Scripts

```bash
npm run dev           # dev server
npm run build         # typecheck + production build
npm run preview       # serve the production build
npm run lint          # oxlint
npm run lint:fix      # oxlint --fix
npm run format        # prettier --write .
npm run typecheck     # tsc -b --noEmit
npm test              # vitest run
npm run test:watch    # vitest watch mode
npm run test:coverage # coverage report
```

## Layout

```
src/
  app/          router + layouts (route tree lives here)
  components/   shared components; components/ui holds styled primitives
  features/     vertical slices: schema + api + queries per domain
  i18n/         i18next setup and locale JSON
  lib/          framework-agnostic helpers (cn, query client)
  pages/        route-level components
  test/         vitest setup
```

`@/` is aliased to `src/`, declared in both `vite.config.ts` and `tsconfig.app.json`.

## Notes coming from Vue

- **`useMemo` is `computed`**, but it is opt-in — React re-runs the whole component
  function on every render and does not track dependencies for you.
- **TanStack Query replaces a store for server state.** Two components using the
  same `queryKey` share one request and one cache entry.
- **`<Outlet />` is `<router-view>`**, and `NavLink`'s `isActive` replaces
  `router-link-active`.
- **There is no `v-model`.** Inputs are controlled via value + onChange, which is
  why `react-hook-form` is worth using for anything beyond a single field.
- **`cn()`** (in `src/lib/utils.ts`) merges Tailwind classes so a parent's
  `className` actually overrides a component's defaults.

## Theming

Design tokens are declared in `src/index.css` under `@theme`. Anything defined
there becomes a utility automatically — `--color-profit` yields `text-profit`,
`bg-profit`, `border-profit`. Dark mode is class-driven via a `@custom-variant`,
toggled by `ThemeToggle`.

## Convention

Code comments in this repository are written in English.
