# DealCrunch

Small real-estate investors underwrite rental deals in fragile spreadsheets — error-prone, slow to compare scenarios, and impossible to share. DealCrunch replaces that workflow with a proper underwriting tool: enter a property, dial in assumptions, get a full 10-year proforma, fork scenarios to compare outcomes side by side, and share a read-only link with partners.

## What was hard to build

**IRR without a library.** Computing the internal rate of return requires solving a polynomial root numerically. The solver (`server/src/lib/irr.ts`) uses Newton-Raphson for fast convergence on typical real estate cash flows, with a bisection fallback for edge cases where Newton diverges. Both paths share the same `npv()` function so there's a single source of truth.

**Money math that doesn't drift.** A 30-year proforma compounds hundreds of multiplications. All values are stored and computed in integer cents end-to-end — floating-point formatting only happens at the UI edge. This is a design invariant, not an afterthought.

**Generator-based proforma rows.** `proformaRows` is a JavaScript generator. The sensitivity analysis matrix (`sensitivityMatrix`) consumes it lazily — building a 10×10 grid across two varying assumptions never holds 100 full proformas in memory at once. It also means callers can stop early without computing unneeded years.

## Stack

| Layer | Tech |
|---|---|
| Frontend | React 18 + Vite + Tailwind + Recharts |
| Backend | Node/Express + TypeScript |
| Database | SQLite via better-sqlite3 |
| Auth | JWT (jsonwebtoken + bcryptjs) |
| Validation | Zod (server) + react-hook-form (client) |
| Tests | Vitest |

## Project structure

```
dealcrunch/
├── server/
│   └── src/
│       ├── lib/          # Pure finance: amortization, IRR/NPV, proforma generator
│       ├── routes/       # auth, properties, deals, import
│       ├── middleware/   # JWT auth, error handler
│       ├── db/           # schema, client, seed
│       └── types/
└── client/
    └── src/
        ├── features/
        │   ├── auth/
        │   ├── calculator/   # AssumptionForm, ProformaView, DealPage
        │   ├── scenarios/    # ScenarioComparison
        │   ├── dashboard/    # DashboardPage, NewDealPage, SharedDealPage
        │   └── import/       # CSV / JSON import
        ├── components/
        │   ├── ui/           # Button, Input, Card, MetricCard
        │   └── charts/       # EquityChart, CashFlowChart, SensitivityTable
        ├── hooks/            # useAuth, useProforma
        └── lib/              # api, format, auth helpers
```

## Run it

**Prerequisites:** Node 20, npm

```bash
# Install all deps (root workspace installs both server + client)
npm install

# Set up env
cp .env.example server/.env
# Edit server/.env and set JWT_SECRET to something real

# Seed the database with demo data
npm run seed

# Start both servers (client :5174, server :3001)
npm run dev
```

Demo login: `demo@dealcrunch.dev` / `password123`

## Run with Docker

```bash
JWT_SECRET=your-secret docker compose up --build
# Client: http://localhost:5174
```

## Tests

```bash
npm run test          # run all tests
npm run test --workspace=server  # finance lib tests only
```

The test suite covers amortization schedule correctness, IRR/NPV numerical accuracy, proforma row generation, sensitivity matrix outputs, and edge cases (zero-interest loan, zero-growth assumptions, all-positive cash flows).

## API

```
POST /api/auth/register          { email, password }
POST /api/auth/login             { email, password }

GET  /api/properties             list user's properties
POST /api/properties             create property

GET  /api/deals                  list user's deals (with property address)
POST /api/deals                  create deal + baseline scenario
GET  /api/deals/:id              get deal + all scenarios
POST /api/deals/:id/share        toggle share token
POST /api/deals/:id/scenarios    add a scenario
GET  /api/deals/:id/scenarios/:sid/proforma      compute proforma
POST /api/deals/:id/scenarios/:sid/sensitivity   sensitivity matrix

GET  /api/deals/shared/:token    read-only public proforma (no auth)
```
