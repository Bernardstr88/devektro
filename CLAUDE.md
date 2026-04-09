# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # start dev server (default port 8080, falls back to 8082 etc.)
npm run build        # production build
npm run lint         # ESLint
npm run test         # run tests once (vitest)
npm run test:watch   # watch mode
```

Deploy edge functions to Supabase (always include `--no-verify-jwt`):
```bash
npx supabase functions deploy <function-name> --no-verify-jwt
```

Apply database migrations:
Use the Supabase MCP tool (`mcp__claude_ai_Supabase__apply_migration`) with project ID `ysuafagyknyirrbhebrt`.

## Architecture

**Devektro** is a fleet management SPA for managing vehicles, drivers, documents, maintenance records, and planned events.

### Stack
- React 18 + TypeScript, Vite, Tailwind CSS, shadcn/ui (Radix primitives)
- Supabase for auth, database (Postgres), storage (`vehicle-documents` bucket), and edge functions
- TanStack Query for server state; `AppStore` (React context) wraps all data access
- `react-router-dom` v6, `react-hook-form` + Zod for forms, `sonner` for toasts

### Data flow
All database reads and writes go through `src/store/AppStore.tsx`. It:
1. Fetches all tables via TanStack Query with `refetchOnMount: "always"`
2. Subscribes to Supabase Realtime for live updates
3. Exposes typed CRUD methods (`addVehicle`, `updateDriver`, `addPlannedEvent`, etc.) that write to Supabase and then invalidate the relevant query key

Tables: `vehicles`, `drivers`, `maintenance_records`, `planned_events`, `vehicle_documents`

### Auth
`src/hooks/useAuth.tsx` wraps Supabase auth. `AuthGate` in `App.tsx` renders `<Login />` when no session exists, otherwise wraps the app in `<AppProvider>`.

### Vehicle detail tabs
`src/pages/VehicleDetail.tsx` renders four tabs, each a separate component in `src/components/vehicle-tabs/`:
- `OverviewTab` — vehicle info + assigned driver
- `MaintenanceTab` — maintenance records
- `PlanningTab` — planned events (afspraken)
- `DocumentsTab` — file uploads with type, tags, expiry date, and inline preview

### Email notifications
`supabase/functions/send-appointment-email/` is a Deno edge function triggered client-side via `supabase.functions.invoke(...)` after a planned event is saved. It fetches the vehicle's assigned driver, sends an email via Resend, and attaches an `.ics` calendar file. Required Supabase secrets: `RESEND_API_KEY`, `EMAIL_FROM`.

### Path alias
`@/` maps to `src/`.

### Migrations
SQL migrations live in `supabase/migrations/`. Apply them via the Supabase MCP tool rather than the CLI (CLI may be linked to a different project than the dashboard).
