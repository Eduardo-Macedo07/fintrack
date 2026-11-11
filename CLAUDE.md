# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

FinTrack is a personal-finance web app (Next.js 16 App Router, React 19, TypeScript, Tailwind v4, Prisma 7 + PostgreSQL, Auth.js v5 beta). User-facing copy, code comments and docs are in **Brazilian Portuguese**; keep that (sentence case, plain verbs, same word for an action and its confirmation). Longer rationale lives in `docs/ARCHITECTURE.md`; the roadmap is in `README.md`.

## Commands

```bash
npm run setup               # one-shot: .env.local + AUTH_SECRET, docker compose up, migrate, demo seed (--skip-docker, --no-seed)
docker compose up -d        # PostgreSQL 17 (creates both `fintrack` and `fintrack_test`)
npm run dev                 # dev server
npm run lint | format:check # CI enforces both
npm run typecheck           # runs `next typegen` first: PageProps<"/route"> types only exist after it
npm test                    # vitest run (all tests)
npx vitest run src/lib/money.test.ts            # one file
npx vitest run -t "nome do teste"               # one test by name
npm run db:seed             # demo account demo@fintrack.dev / demo12345 (local DB only; refuses remote hosts and NODE_ENV=production)
npm run db:migrate          # prisma migrate dev (does NOT regenerate the client in Prisma 7)
npx prisma generate         # client goes to src/generated/ (gitignored; also runs on postinstall)
```

- Tests need PostgreSQL running: `tests/global-setup.ts` runs `prisma migrate deploy` against `fintrack_test` before the suite. The docker init script only runs on first volume creation.
- Config lives in `.env.local` (see `.env.example`). `AUTH_TRUST_HOST=true` is required to use `next start` outside Vercel, otherwise Auth.js throws `UntrustedHost` on every request.
- CI (`.github/workflows/ci.yml`) runs format:check, lint, typecheck, test, build with a Postgres service.

## Next.js 16 specifics (read `node_modules/next/dist/docs/` before relying on memory, per `AGENTS.md`)

- `middleware.ts` is now **`src/proxy.ts`**. It only does an optimistic redirect using the JWT; it is not the security boundary.
- `cacheComponents` is on: request-time data (session/cookies, DB, `searchParams`) must sit under `<Suspense>`. **Every private page must be a synchronous default export that wraps its async content component in its own `<Suspense fallback={<PageSkeleton />}>`** (see `dashboard/page.tsx`) and pass `props.searchParams` down un-awaited. A boundary only in the shared layout (`AppShell`) is not enough: client navigations re-render just below the layout, so it never shows, `next dev` reports a "blocking route" error (production builds do NOT), and navigation is not instant. Always check a new page in `npm run dev`, not only `next build`.
- After mutating, Server Actions call `revalidatePath("/dashboard")` and `("/transactions")`; add new pages that show affected data to `refresh()` in `features/transactions/server/actions.ts`.

## Architecture

**Layering (the part that spans many files).** `src/app` is routing/composition only. Each domain lives in `src/features/<name>/` (`components/`, `server/`, plus pure modules). Server code is split into:

- **Services** (`features/*/server/service.ts`, `register.ts`, `authenticate.ts`): take `db` and `userId` as explicit parameters, validate with Zod, and are what the integration tests exercise.
- **Server Actions** (`features/*/server/actions.ts`): call `requireUser()` to get the owner from the session (never from form data), parse the form, call a service, map domain errors to field errors, then revalidate.
- **Pure logic** with unit tests and no React/Prisma imports: `lib/money.ts`, `lib/dates.ts`, `transactions/balance.ts`, `dashboard/{budget,cumulative}.ts`, `planning/{projection,averages}.ts`. Put new business rules here first.

**Authorization is by `userId` everywhere.** Every query filters on it. Update/delete use `updateMany`/`deleteMany({ where: { id, userId } })` and throw `NotFoundError` when `count === 0`, so another user's id is indistinguishable from a missing one. Category ownership **and type** are checked before writing a transaction. There is no DB-level guard against cross-user references; the service layer is the guard.

**Auth** is split on purpose: `server/auth.config.ts` (no DB/bcrypt; used by `proxy.ts`) and `server/auth.ts` (Credentials provider + Prisma). Sessions are JWT. `server/session.ts#requireUser` re-reads the user from the DB (cached per request via `React.cache`) so deleted users lose access immediately; every private page and action must call it, because layouts do not re-render on navigation. Login returns the same result and takes the same time for unknown e-mail and wrong password (`DUMMY_HASH`).

**Env:** `lib/env-schema.ts` is pure (Zod, testable); `lib/env.ts` is the eager, `server-only` instance. Import the schema in tests, `env` in server code.

**Data conventions that are easy to get wrong:**

- Money is an **integer number of cents** (`Int`), never a float; amounts are stored positive and the sign comes from `type` (INCOME/EXPENSE). Use `lib/money.ts`.
- Transaction dates are **calendar dates stored at UTC midnight** (`parseDay`/`formatDay`); months are `"YYYY-MM"` keys (`?month=` in the URL) and ranges are `[start, end)`. The timezone (`APP_TIMEZONE`) only decides what "today" is.
- Accounts are hidden in the UI: a transaction goes to the user's first active account. Default categories are **copied per user** inside the `registerUser` transaction.
- Balance = initial balances + income − expenses **up to the end of the displayed month**.

**Tests:** `*.test.ts` are unit tests; `*.int.test.ts` hit the real `fintrack_test` database, run one file at a time (`fileParallelism: false`) and use `resetDb()` from `tests/db.ts`. `server-only` is aliased to a stub in `vitest.config.mts`. bcrypt cost is 4 under `NODE_ENV=test` (12 otherwise). Shared test helpers are in `tests/`.

**UI:** shadcn-style components under `components/ui` (added by hand; the shadcn CLI registry may be unreachable in the cloud environment). Design tokens (`income`, `expense`, `hero`) are CSS variables in `app/globals.css`; the blue `MonthHero` panel is the signature element. Animations use `motion/react` and must respect reduced motion. Two pitfalls: the `Segmented` pill is positioned by option index on purpose (a `layoutId` pill jittered when the dialog re-centered), and the dialog content is a `layoutRoot`.

**Planning content (`features/planning`):** investment text in `learn.ts` is educational only: describe types of investment, never recommend a product, promise returns, or detail tax rules, and keep the disclaimer. `REFERENCE` (Selic, inflation) is dated market data and goes stale; update it with its date and source.
