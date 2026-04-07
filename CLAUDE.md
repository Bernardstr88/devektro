# CLAUDE.md - Devektro

## Project Overview

Devektro is a vehicle fleet management web application built with React + TypeScript. It provides maintenance tracking, insurance management, document storage, and planned event scheduling. The UI is in **Dutch**.

## Tech Stack

- **Framework:** React 18 with TypeScript
- **Build tool:** Vite 5 (SWC plugin)
- **Styling:** Tailwind CSS 3 + Radix UI + shadcn/ui components
- **State:** TanStack React Query for server state, React Context for app state
- **Forms:** React Hook Form + Zod validation
- **Backend:** Supabase (PostgreSQL, auth, file storage, real-time subscriptions)
- **Routing:** React Router DOM 6
- **Charts:** Recharts
- **PDF:** jsPDF + jspdf-autotable
- **Icons:** Lucide React
- **Deployment:** Vercel (SPA)

## Commands

```bash
npm run dev          # Dev server on port 8080
npm run build        # Production build
npm run build:dev    # Development mode build
npm run lint         # ESLint (flat config)
npm run test         # Vitest (single run)
npm run test:watch   # Vitest (watch mode)
npm run preview      # Preview production build
```

## Project Structure

```
src/
├── pages/              # Route-level page components
│   ├── Dashboard.tsx
│   ├── Vehicles.tsx
│   ├── VehicleDetail.tsx
│   ├── UserManagement.tsx
│   ├── Login.tsx
│   └── NotFound.tsx
├── components/
│   ├── ui/             # shadcn/ui base components (button, dialog, etc.)
│   ├── dialogs/        # Form dialog components (vehicle, maintenance, etc.)
│   ├── vehicle-tabs/   # Vehicle detail tab panels
│   ├── AppLayout.tsx   # Main layout with sidebar
│   ├── AppSidebar.tsx  # Navigation sidebar
│   ├── ErrorBoundary.tsx
│   ├── NavLink.tsx
│   └── StatusBadge.tsx
├── hooks/
│   ├── useAuth.tsx     # Auth context provider & hook
│   ├── use-mobile.tsx  # Mobile detection
│   └── use-toast.ts    # Toast hook
├── store/
│   └── AppStore.tsx    # Central app state (React Context)
├── integrations/
│   └── supabase/
│       └── client.ts   # Supabase client init
├── data/
│   └── types.ts        # TypeScript type definitions
├── lib/
│   └── utils.ts        # Utility functions (cn class merger)
├── test/               # Test setup and test files
├── App.tsx             # Root component with routes
├── main.tsx            # Entry point
└── index.css           # Global styles & CSS custom properties
```

## Path Alias

`@/*` resolves to `./src/*` (configured in tsconfig.json and vite.config.ts). Always use `@/` imports.

## Code Conventions

### Components
- Functional components with hooks only
- Dialog-based forms for create/update operations (see `components/dialogs/`)
- Use `cn()` from `@/lib/utils` for conditional class composition
- UI primitives live in `components/ui/` (shadcn/ui — do not manually edit)

### Data Fetching
- Use TanStack React Query for all Supabase data fetching
- Access global state via `useAppStore()` hook
- Supabase real-time subscriptions for live data sync

### Forms
- React Hook Form + Zod schema for validation
- Infer form types from Zod schemas with `z.infer<typeof schema>`

### Styling
- Tailwind utility classes, no inline styles
- CSS custom properties (HSL) defined in `index.css` for theming
- Component variants via `class-variance-authority` (CVA)
- Dark mode supported via `next-themes`

### TypeScript
- `noImplicitAny: false` and `strictNullChecks: false` in tsconfig
- Type definitions in `src/data/types.ts`
- Unused variables: prefix with `_` (ESLint configured to allow)

### Localization
- All user-facing text is in **Dutch** — maintain this convention
- No i18n library; strings are inline

### Error Handling
- Toast notifications via `sonner` for user feedback
- `ErrorBoundary` component for React error catching
- Dutch error messages with `parseError()` utility

## Database (Supabase)

Core tables: `vehicles`, `maintenance_records`, `planned_events`, `vehicle_documents`

## Environment Variables

```
VITE_SUPABASE_URL=<supabase-project-url>
VITE_SUPABASE_ANON_KEY=<supabase-anon-key>
```

See `.env.example` for reference. Fallback defaults exist for hosted deployment.

## Testing

- **Unit/component tests:** Vitest + Testing Library React + jsdom
- **E2E tests:** Playwright
- Test files: `src/**/*.{test,spec}.{ts,tsx}`
- Setup file: `src/test/setup.ts`

## Linting

ESLint 9 flat config with TypeScript ESLint, React Hooks, and React Refresh plugins. Run `npm run lint` before committing.
