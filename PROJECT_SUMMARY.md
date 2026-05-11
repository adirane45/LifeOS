# LifeOS Project Summary

## What This App Is
LifeOS is a Next.js App Router dashboard for personal tracking across money, habits, health, journaling, goals, and an assistant chat surface. The stack is TypeScript, Prisma with SQLite, and Tailwind CSS.

## Current Architecture
- App routes live under `app/` and use server components for data fetching and mutations.
- Shared data access helpers are centralized in `lib/data.ts` and use `React.cache()` for request-scoped deduplication.
- Prisma access goes through `lib/prisma.ts`.
- Heavy chart UI is split into client wrapper components so server pages can lazy-load them safely.

## Performance Work Already Done
- Parallel Prisma reads were added with `Promise.all()` where multiple queries were independent.
- Repeated reads were deduplicated through cached helpers like `getUser()`, `getAccounts()`, `getTransactions()`, `getHabits()`, `getHealthMetrics()`, `getJournalEntries()`, and `getGoals()`.
- Several pages were moved away from `force-dynamic` to `revalidate = 60`.
- Chart bundles were isolated behind client wrappers such as `components/ExpensesMiniChartClient.tsx`, `components/NetWorthChartClient.tsx`, and `components/HealthChartsClient.tsx`.

## Important Files
- Dashboard: `app/page.tsx`
- Money overview: `app/money/page.tsx`
- Money subpages: `app/money/accounts/page.tsx`, `app/money/budgets/page.tsx`, `app/money/transactions/page.tsx`
- Health: `app/health/page.tsx`
- Journal: `app/journal/page.tsx`
- Goals: `app/goals/page.tsx`
- Habits: `app/habits/page.tsx`
- Assistant API: `app/api/assistant/route.ts`
- Cached data helpers: `lib/data.ts`
- Chart components: `components/ExpensesMiniChart.tsx`, `components/NetWorthChart.tsx`, `components/HealthCharts.tsx`

## Validation Status
- `npx tsc --noEmit` passes.
- `npm run build` passes.
- `npm run dev` starts successfully in this workspace when launched with `cmd /c npm run dev`.

## Workspace Notes
- In this Windows workspace, `cmd /c npm ...` is the reliable way to run npm commands from PowerShell.
- There is a known PowerShell profile warning about `Microsoft.WinGet.CommandNotFound`; it does not block the app build or runtime checks.

## Where To Resume Next
If you want to continue from here, start with `PROJECT_SUMMARY.md`, then inspect `lib/data.ts` and the money/dashboard pages to extend or refine the current caching and chart-splitting setup.
