# TambaQu

TambaQu is a responsive aquaculture intelligence web application for monitoring and mitigating operational risk in vannamei shrimp ponds. Phase 1 established the architecture; Phase 2 delivers the core monitoring and situational-awareness experience.

> All values shown in the current application are synthetic and intended only for product demonstration. They are not field observations, validated scientific predictions, or automated diagnoses.

## Requirements

- Node.js 22 or newer
- npm 10 or newer

## Installation

```bash
npm install
npm run dev
```

Open the local address printed by Vite, choose **Masuk sebagai Demo**, and enter the workspace as Andi Setiawan at Tambak Mina Jaya.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start local development with hot reload |
| `npm run lint` | Run static lint checks |
| `npm test` | Run focused monitoring-domain unit tests |
| `npm run build` | Run TypeScript checks and create the production build |
| `npm run preview` | Preview the production build locally |

## Project map

- `src/app` — route and provider composition.
- `src/components` — reusable UI, layout, common, and domain components.
- `src/pages` — route-level product surfaces.
- `src/domain` — framework-independent TypeScript domain contracts.
- `src/data` — deterministic fixtures and repository implementations.
- `src/services` — business rules that are independent of presentation.
- `src/store` — device-local session and UI preferences only.
- `src/hooks`, `src/utils`, `src/constants`, `src/styles` — shared application infrastructure.

See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), and [DEMO_DATA.md](./DEMO_DATA.md) for the phase-1 decisions and guardrails.

## Phase 2 monitoring

- Dashboard with farm-level risk counts, a Kolam B default selector, six interactive sensor cards, 6-hour/24-hour/7-day charts, monitoring summaries, PondBrain preview, latest warnings, and pond priority scanning.
- Ponds route with client-side search, risk filters, three sorting modes, responsive cards, and a desktop comparison table.
- Pond Detail with risk, clickable sensor metrics, focused history chart, freshness, device health, monitoring summary, PondBrain preview, and recent activity.
- Derived helpers for farm risk, trends, parameter-aware trend sentiment, data freshness, sensor demo state, and risk-priority sorting.

### Routes

- `/app/dashboard` — monitoring command center.
- `/app/ponds` — multi-pond comparison, filter, search, and sorting.
- `/app/ponds/:pondId` — detailed pond monitoring.
- `/app/pondbrain?pond=:pondId` — Phase 2 preview that preserves the Phase 3 boundary.

### Test the dashboard

Start the development server, choose **Masuk sebagai Demo**, then verify that Kolam B is selected. Select a sensor card, switch between 6 Jam, 24 Jam, and 7 Hari, change to Kolam C, filter the Ponds page to Waspada, and open Kolam B detail. All interactions use fixed synthetic data and require no network API.

## Phase boundary

This phase deliberately excludes a service worker, final web manifest, IndexedDB, offline queue, push notifications, real authentication, backend/API, MQTT, real weather data, WhatsApp, machine learning, and complex charts. The current boundaries are designed so those capabilities can be added without coupling pages to mock data.
