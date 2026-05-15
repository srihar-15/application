# CONTEXT.md — A Square GoKarting (Fresh Rebuild)

> **Purpose:** This file gives any new AI session an instant orientation of what has been built, what decisions were made, and what comes next. Read this before touching any code.
>
> **Reference app:** `C:\Sqas\asquare app\asquare app` — the full production app. Use it to copy logic, never to copy bugs.
> **Working folder:** `c:\application` — this is where all new clean code lives.

---

## Project Identity

**App:** A Square GoKarting — dual-app platform  
**GitHub:** `srihar-15/application` (public)  
**Vercel:** `https://application-eight-topaz.vercel.app`  
**Vercel Project ID:** `prj_H3JNVoZKohDPJ7zQ4Zb4JYawebkE`  
**Team:** `srihar-15s-projects` (`team_TPnr3BXr1GV7OCXisaFYXolU`)  
**Deploy trigger:** Every `git push` to `main` auto-deploys to Vercel  
**Owner email:** `dev.asquaregokarting@gmail.com`

---

## Two Apps in One Codebase

| App | Who uses it | URL |
|---|---|---|
| **Customer App** | Public customers | default (any URL) |
| **Pipeline Admin** | Internal staff | `?app=pipeline` or `pipeline.*` subdomain |

Detection happens in `src/main.tsx`. Both apps are lazy-loaded — the admin bundle never ships to customers.

---

## Tech Stack

| Layer | Choice |
|---|---|
| UI | React 19 + TypeScript 6 + Vite 8 |
| Styling | Tailwind CSS 3 — utility classes only, no inline styles |
| Animation | Framer Motion |
| Icons | Lucide React |
| Backend | Firebase 11 — Auth, Firestore (`asquare-app-db`), Storage |
| Payments | Razorpay (not yet wired) |
| Notifications | Interakt webhook (not yet wired) |
| State (server) | TanStack React Query v5 |
| State (client) | React Context (to be built) |
| Testing | Vitest + Testing Library |
| Hosting | Vercel (GitHub auto-deploy) |

---

## Branches (4 locations)

| Name | branchId | slug |
|---|---|---|
| Visakhapatnam (Vizag) | `0` | `visakhapatnam` |
| Kakinada | `1` | `kakinada` |
| Rajahmundry | `2` | `rajahmundry` |
| Srikakulam | `5` | `srikakulam` |

Source of truth: `src/lib/locations.ts`. Loaded from Firestore at runtime via `setLocations()`.

---

## Architecture Rules (strictly enforced)

1. **Never import Pipeline code into Customer App or vice versa.** The boundary is hard.
2. **No raw Firestore calls in components.** All data access goes through services (`src/services/`) or API modules (`src/pipeline/api/`).
3. **Never use `console.log/warn/error`.** Use `src/lib/logger.ts` always.
4. **Never import `firebase/analytics` directly.** Use `src/lib/analytics.ts` facade.
5. **Wallet/balance changes must use Firestore transactions.** Atomic or nothing.
6. **Every page must be `React.lazy()` loaded.** No eager imports of pages.
7. **All new code must be `.ts` / `.tsx`. No `any` — use `unknown` with type guards.**
8. **Tailwind only.** No inline styles, no CSS modules.

---

## Path Aliases

```ts
@/*          →  src/*
@pipeline/*  →  src/pipeline/*
```

Configured in both `tsconfig.app.json` (TypeScript) and `vite.config.ts` (bundler).

---

## Folder Structure

```
src/
├── lib/              # Core utilities (firebase, logger, analytics, locations, utils)
├── types/            # TypeScript types (index.ts) + error hierarchy (errors.ts)
├── components/       # Shared UI components
│   └── ui/           # Primitives: Skeleton, EmptyState, ErrorState, LoadingScreen
├── contexts/         # React Contexts (Auth, Booking, Cart, Games, Theme) ← to be built
├── services/         # Customer app data layer ← to be built
├── pages/            # Customer app pages ← to be built
├── pipeline/         # Everything pipeline admin ← to be built
│   ├── api/          # Pipeline data layer
│   ├── components/   # Pipeline UI components
│   └── pages/        # Pipeline pages
├── hooks/            # Custom hooks ← to be built
├── CustomerApp.tsx   # Customer app router
├── PipelineApp.tsx   # Pipeline admin router
└── main.tsx          # Entry point — dual-app detection + providers
```

---

## Key Files (already built)

| File | Purpose |
|---|---|
| `src/main.tsx` | App entry — providers + dual-app routing |
| `src/CustomerApp.tsx` | Customer app routes (placeholder, pages added one by one) |
| `src/PipelineApp.tsx` | Pipeline admin routes (placeholder) |
| `src/lib/firebase.ts` | Firebase init — Auth, Firestore (`asquare-app-db`), Storage |
| `src/lib/logger.ts` | Structured logger with sensitive-key scrubbing |
| `src/lib/analytics.ts` | Typed analytics facade (`AnalyticsEvent` enum) |
| `src/lib/locations.ts` | 4-branch registry with slug/branchId lookups |
| `src/lib/utils.ts` | `cn`, `formatCurrency`, `formatDate`, `generateId`, `clamp` |
| `src/types/index.ts` | All domain types: User, Activity, Booking, Cart, Coupon, Toast… |
| `src/types/errors.ts` | Error classes: ApplicationError → Validation/Network/Payment/API |
| `src/components/ErrorBoundary.tsx` | Catches render crashes, shows recovery UI |
| `src/components/ui/Skeleton.tsx` | Loading placeholders |
| `src/components/ui/EmptyState.tsx` | "No data yet" states |
| `src/components/ui/ErrorState.tsx` | Per-section error with retry |
| `src/components/ui/LoadingScreen.tsx` | Full-screen spinner for Suspense |
| `tailwind.config.js` | Brand colors: primary `#0066FF`, secondary `#FF6B00` |
| `vite.config.ts` | Path aliases + 4 vendor chunks |
| `.env.example` | Required Firebase env vars template |

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in Firebase values:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_MEASUREMENT_ID=
```

The app throws at startup if `API_KEY`, `PROJECT_ID`, or `APP_ID` are missing.

---

## Build & Commands

```bash
npm run dev           # Dev server
npm run build         # TypeScript check + Vite bundle
npm run typecheck     # TypeScript only (no bundle)
npm run lint          # ESLint
npm run test          # Vitest watch
npm run test:run      # Vitest single run
npm run test:coverage # Coverage report
```

---

## What Was Built (Phase by Phase)

### ✅ Phase 1 — Foundation (DONE)
- All dependencies installed
- TypeScript strict mode + path aliases
- Tailwind brand colors + Google Fonts
- Vite manual chunk splitting (4 vendor chunks)
- `src/lib/` — logger, firebase, analytics, locations, utils
- `src/types/` — domain types + error hierarchy
- `src/components/` — ErrorBoundary, Skeleton, EmptyState, ErrorState, LoadingScreen
- `src/main.tsx` — dual-app entry with all providers
- Placeholder routers for both apps
- Committed and deployed to Vercel ✓

### 🔲 Phase 2 — Auth Context + OTP Login (NEXT)
- `src/contexts/AuthContext.tsx` — phone OTP auth flow
- `src/pages/LoginPage.tsx` or inline auth gate
- Protected route wrapper

### 🔲 Phase 3 — Customer App: Core Layout
- `src/components/Layout.tsx` — main shell
- `src/components/Header.tsx`
- `src/components/BottomNav.tsx`

### 🔲 Phase 4 — Customer App: Activities Page
- `src/services/activityService.ts`
- `src/pages/Activities.tsx`

### 🔲 Phase 5 — Customer App: Booking Flow
- `src/contexts/BookingContext.tsx`
- `src/contexts/CartContext.tsx`
- `src/pages/Cart.tsx`
- `src/pages/Checkout.tsx`

### 🔲 Phase 6 — Customer App: Post-Booking
- `src/pages/MyBookings.tsx`
- `src/pages/BookingDetails.tsx`
- `src/pages/Wallet.tsx`
- `src/pages/Profile.tsx`

### 🔲 Phase 7 — Pipeline Admin
- Login, dashboards, bookings module, shifts, leads, billing…

---

## Coding Rules for This Rebuild

- **No `any`** — use `unknown` with type guards
- **No `console.log`** — use `logger.info/warn/error`
- **No comments explaining WHAT** — code names explain that. Comments only for non-obvious WHY
- **No half-finished features** — each phase ships complete and working
- **No backwards-compat hacks** — this is a fresh build, cut cleanly
- **Errors must use the error hierarchy** — never `throw new Error('...')` raw
