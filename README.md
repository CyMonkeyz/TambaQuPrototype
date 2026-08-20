# TambaQu

TambaQu is a responsive aquaculture intelligence web application foundation for monitoring and mitigating operational risk in vannamei shrimp ponds. Phase 1 provides the design system, responsive shell, domain contracts, repository abstraction, deterministic demo dataset, and starter product routes.

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

## Phase boundary

This phase deliberately excludes a service worker, final web manifest, IndexedDB, offline queue, push notifications, real authentication, backend/API, MQTT, real weather data, WhatsApp, machine learning, and complex charts. The current boundaries are designed so those capabilities can be added without coupling pages to mock data.
