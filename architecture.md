# DealCrunch — Architecture

## Module / data flow

```mermaid
flowchart TD
    subgraph Client [React client :5173]
        UI[Pages / components]
        Hooks[Custom hooks\nuseProforma · useAuth]
        API[api.ts\nfetch wrapper]
    end

    subgraph Server [Express server :3001]
        Auth[/auth]
        Properties[/properties]
        Deals[/deals]
        Import[/import]

        subgraph Finance [Pure finance lib — no I/O]
            Amort[amortization.ts\nStandard mortgage math]
            IRR[irr.ts\nNPV · IRR bisection/Newton]
            Proforma[proforma.ts\nGenerator · sensitivity matrix]
        end
    end

    DB[(SQLite\nbetter-sqlite3)]

    UI --> Hooks --> API
    API -->|REST + JWT| Auth & Properties & Deals & Import
    Deals --> Finance
    Auth & Properties & Deals --> DB
```

## Layering rules

```
Client:  Pages → feature components → ui components
                → hooks → api.ts → network

Server:  routes → services / lib → db
         lib (finance) has zero imports from routes or db — it is pure functions
```

## Key design decisions

### Pure finance core
`server/src/lib/` contains zero Express / SQLite imports. Every function is a pure transformation: `amortize(principal, rate, term) → schedule`, `irr(cashFlows) → number | null`. This makes them trivially testable and entirely reusable.

### Generator-based proforma
`proformaRows` is a generator that yields one `ProformaYear` at a time. The sensitivity matrix iterates over it lazily — constructing a 10×10 grid never holds 100 full proformas in memory simultaneously.

### IRR solver — Newton-Raphson + bisection fallback
Newton-Raphson converges quickly (5–15 iterations) for well-behaved real estate cash flows. The bisection fallback handles edge cases where Newton diverges (unusual sign-flip patterns, very high leverage). Both paths share the same `npv()` function.

### Money in integer cents
All monetary values stored and computed in integer cents. `toDollars()` / `formatCurrency()` are called only at the UI edge. This eliminates floating-point accumulation across 30-year proformas where cent-level drift would compound.

### Scenario model
Each deal has multiple `AssumptionSet` rows. One row is the baseline; all others are named scenarios. The `computeProforma` call is stateless — it takes an assumption set and returns a result, so comparison is just running it N times with different inputs.

### Share tokens
A deal gets a random UUID share token on demand. The `/deals/shared/:token` endpoint requires no auth and returns the baseline scenario proforma — suitable for embedding in an email or sharing with a partner.

## Database schema

```
users          (id, email, password_hash, created_at)
properties     (id, user_id, address, city, state, zip, property_type, …)
deals          (id, user_id, property_id, name, share_token, created_at, updated_at)
assumption_sets(id, deal_id, name, <all underwriting fields>, is_baseline, …)
```

SQLite with WAL mode. Foreign keys enforced. No ORM — parameterized `better-sqlite3` statements throughout.
