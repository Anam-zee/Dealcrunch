# DealCrunch — full git history setup script
# Author: Anam-zee | Dates: Jan 13–18 2026

$ErrorActionPreference = "Stop"
$repo = "C:\Users\devad\Desktop\dealcrunch-main"
Set-Location $repo

function Commit {
    param([string]$date, [string]$msg)
    $env:GIT_AUTHOR_DATE    = $date
    $env:GIT_COMMITTER_DATE = $date
    git commit -m $msg
}

# ─────────────────────────────────────────────
# MAIN — Jan 13 09:00  (initial commit)
# ─────────────────────────────────────────────
git checkout -b main

git add .gitignore
git add .env.example
git add .prettierrc
git add .eslintrc.json
git add package.json
git add docker-compose.yml
git add README.md
git add architecture.md
Commit "2026-01-13T09:00:00" "chore: initial project setup with root config and docker-compose"

# ─────────────────────────────────────────────
# feat/project-scaffold — Jan 13
# ─────────────────────────────────────────────
git checkout -b feat/project-scaffold

# commit 1 — server scaffold
git add server/package.json
git add server/tsconfig.json
git add server/vitest.config.ts
git add server/Dockerfile
git add server/src/index.ts
git add server/src/config.ts
git add server/src/middleware/errorHandler.ts
git add server/src/types/index.ts
Commit "2026-01-13T10:30:00" "feat: scaffold express server with config, entry point, and error handler"

# commit 2 — DB models & schema
git add server/src/db/client.ts
git add server/src/db/models.ts
git add server/src/db/schema.ts
git add server/src/db/seed.ts
Commit "2026-01-13T14:00:00" "feat: add database client, models, schema sync, and seed script"

git checkout main
git merge --no-ff feat/project-scaffold -m "feat: merge project scaffold into main"

# ─────────────────────────────────────────────
# feat/auth — Jan 14
# ─────────────────────────────────────────────
git checkout -b feat/auth

# commit 1 — server auth
git add server/src/routes/auth.ts
git add server/src/middleware/auth.ts
Commit "2026-01-14T09:30:00" "feat: implement JWT auth routes (register/login) and auth middleware"

# commit 2 — client auth
git add client/package.json
git add client/tsconfig.json
git add client/vite.config.ts
git add client/tailwind.config.ts
git add client/postcss.config.js
git add client/index.html
git add client/Dockerfile
git add client/nginx.conf
git add client/src/main.tsx
git add client/src/index.css
git add client/src/types/index.ts
git add client/src/lib/auth.ts
git add client/src/lib/api.ts
git add client/src/lib/format.ts
git add client/src/hooks/useAuth.ts
git add client/src/features/auth/AuthPage.tsx
Commit "2026-01-14T15:00:00" "feat: add client scaffold, auth page, and useAuth hook"

git checkout main
git merge --no-ff feat/auth -m "feat: merge auth feature into main"

# ─────────────────────────────────────────────
# feat/finance-core — Jan 15
# ─────────────────────────────────────────────
git checkout -b feat/finance-core

git add server/src/lib/money.ts
Commit "2026-01-15T09:00:00" "feat: add money utility (integer cents, formatCurrency, toDollars)"

git add server/src/lib/amortization.ts
git add server/src/lib/amortization.test.ts
git add server/src/lib/irr.ts
git add server/src/lib/irr.test.ts
Commit "2026-01-15T11:30:00" "feat: implement amortization schedule and IRR solver with tests"

git add server/src/lib/proforma.ts
git add server/src/lib/proforma.test.ts
Commit "2026-01-15T16:00:00" "feat: add generator-based proforma engine and sensitivity matrix with tests"

git checkout main
git merge --no-ff feat/finance-core -m "feat: merge finance core library into main"

# ─────────────────────────────────────────────
# feat/deals-api — Jan 16
# ─────────────────────────────────────────────
git checkout -b feat/deals-api

git add server/src/routes/properties.ts
Commit "2026-01-16T10:00:00" "feat: add properties CRUD route with user-scoped access"

git add server/src/routes/deals.ts
git add server/src/routes/import.ts
Commit "2026-01-16T14:30:00" "feat: add deals route with scenarios, proforma, sensitivity, and share token"

git checkout main
git merge --no-ff feat/deals-api -m "feat: merge deals API into main"

# ─────────────────────────────────────────────
# feat/client-ui — Jan 17–18
# ─────────────────────────────────────────────
git checkout -b feat/client-ui

# commit 1 — shared UI components
git add client/src/components/ui/Button.tsx
git add client/src/components/ui/Card.tsx
git add client/src/components/ui/Input.tsx
git add client/src/components/ui/MetricCard.tsx
Commit "2026-01-17T09:30:00" "feat: add reusable UI components (Button, Card, Input, MetricCard)"

# commit 2 — dashboard + deal pages
git add client/src/App.tsx
git add client/src/hooks/useProforma.ts
git add client/src/features/dashboard/DashboardPage.tsx
git add client/src/features/dashboard/DealCard.tsx
git add client/src/features/dashboard/NewDealPage.tsx
git add client/src/features/dashboard/SharedDealPage.tsx
git add client/src/features/calculator/AssumptionForm.tsx
git add client/src/features/calculator/DealPage.tsx
git add client/src/features/calculator/ProformaView.tsx
git add client/src/features/import/ImportPage.tsx
Commit "2026-01-17T15:00:00" "feat: add dashboard, deal calculator pages, and import flow"

# commit 3 — charts + scenario comparison
git add client/src/components/charts/CashFlowChart.tsx
git add client/src/components/charts/EquityChart.tsx
git add client/src/components/charts/SensitivityTable.tsx
git add client/src/features/scenarios/ScenarioComparison.tsx
Commit "2026-01-18T11:00:00" "feat: add cash flow/equity charts, sensitivity table, and scenario comparison"

git checkout main
git merge --no-ff feat/client-ui -m "feat: merge client UI into main"

# ─────────────────────────────────────────────
# CI workflow — Jan 18
# ─────────────────────────────────────────────
git add .github/workflows/ci.yml
Commit "2026-01-18T14:00:00" "ci: add GitHub Actions CI workflow"

Write-Host "`n✅ All commits done. Ready to push."
