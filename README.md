# TambaQu

TambaQu is a responsive, installable aquaculture decision-support PWA for monitoring and mitigating operational risk in vannamei shrimp ponds. The final competition MVP combines monitoring, PondBrain explanations, field actions, deterministic simulation, cached domain data, offline mutations, and reconnect synchronization.

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

| Command           | Purpose                                               |
| ----------------- | ----------------------------------------------------- |
| `npm run dev`     | Start local development with hot reload               |
| `npm run lint`    | Run static lint checks                                |
| `npm test`        | Run monitoring and decision-support unit tests        |
| `npm run build`   | Run TypeScript checks and create the production build |
| `npm run preview` | Preview the production build locally                  |
| `npm run verify:pwa` | Verify manifest, icons, service worker, and precache |
| `npm run analyze:bundle` | Report minified and gzip sizes for built JavaScript chunks |
| `npm run generate:pwa-assets` | Rebuild icons from the local TambaQu SVG source |

## Project map

- `src/app` — route and provider composition.
- `src/components` — reusable UI, layout, common, and domain components.
- `src/pages` — route-level product surfaces.
- `src/domain` — framework-independent TypeScript domain contracts.
- `src/data` — deterministic fixtures and repository implementations.
- `src/services` — business rules that are independent of presentation.
- `src/store` — device-local session and UI preferences only.
- `src/hooks`, `src/utils`, `src/constants`, `src/styles` — shared application infrastructure.

See [PRODUCT_SPEC.md](./PRODUCT_SPEC.md), [ARCHITECTURE.md](./ARCHITECTURE.md), [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md), and [DEMO_DATA.md](./DEMO_DATA.md) for product decisions and guardrails. Final incident, performance, QA, and presentation records are in [DEBUG_REPORT.md](./DEBUG_REPORT.md), [PERFORMANCE.md](./PERFORMANCE.md), [QA_CHECKLIST.md](./QA_CHECKLIST.md), and [COMPETITION_RUNBOOK.md](./COMPETITION_RUNBOOK.md).

## Phase 2 monitoring

- Dashboard with farm-level risk counts, a Kolam B default selector, six interactive sensor cards, 6-hour/24-hour/7-day charts, monitoring summaries, PondBrain preview, latest warnings, and pond priority scanning.
- Ponds route with client-side search, risk filters, three sorting modes, responsive cards, and a desktop comparison table.
- Pond Detail with risk, clickable sensor metrics, focused history chart, freshness, device health, monitoring summary, PondBrain preview, and recent activity.
- Derived helpers for farm risk, trends, parameter-aware trend sentiment, data freshness, sensor demo state, and risk-priority sorting.

### Routes

- `/app/dashboard` — monitoring command center.
- `/app/ponds` — multi-pond comparison, filter, search, and sorting.
- `/app/ponds/:pondId` — detailed pond monitoring.
- `/app/pondbrain?pond=:pondId` — explainable risk and farmer-action workflow.
- `/app/alerts?alert=:alertId` — alert center and contextual detail.
- `/app/reports` — local-data operational reports and print view.
- `/app/devices` — device health, connection, battery, signal, and calibration.
- `/app/demo-control` — demo-only simulator and application-connectivity controls.

### Test the dashboard

Start the development server, choose **Masuk sebagai Demo**, then verify that Kolam B is selected. Select a sensor card, switch between 6 Jam, 24 Jam, and 7 Hari, change to Kolam C, filter the Ponds page to Waspada, and open Kolam B detail. All interactions use fixed synthetic data and require no network API.

## Phase 3 decision-support loop

- PondBrain shows a textual score, deterministic risk trend, contributor explanations, freshness-aware data confidence, and responsible decision-support copy.
- Recommendations are generated from risk contributors and ordered by urgency. Completion requires confirmation and creates an auditable action log.
- Alerts support new, acknowledged, and follow-up-recorded states, with direct navigation to the related PondBrain analysis.
- Dashboard and Pond Detail derive pending recommendations and latest actions from the same repositories.
- Settings provides a confirmed demo reset for repeated competition rehearsals.

### Golden demo

Enter demo mode, open Kolam B, and choose **Lihat Analisis**. Confirm Risk Score 67, inspect DO 42%, Amonia 27%, Suhu 18%, and Konteks Lingkungan 13%, then complete **Periksa dan optimalkan aerasi** with an optional note. Open Peringatan, review the Kolam B alert, and return to PondBrain or Pond Detail to see the shared state reflected.

## Phase 4 operations and simulation

- Desktop Operations Dashboard with derived farm KPIs, priority sorting, multi-pond table, risk trend, active alerts, device health, and recent actions; the Phase 2 mobile dashboard remains intact.
- Deterministic Stable, Early Warning, Warning Escalation, Critical, Recovery, and Device Failure scenarios with start/pause/step/reset controls.
- Device Management, operational Reports, print/save-PDF CSS, Presentation Mode, and a navigation-safe shared simulation repository.

See [DEMO_SCRIPT.md](./DEMO_SCRIPT.md) for the 90-second competition flow.

## Phase 5 PWA and offline-first flow

The production build generates a Workbox service worker and manifest. Dexie stores the latest synthetic farm snapshot and a persistent mutation outbox. Offline actions and alert acknowledgement update immediately with `pending` state; reconnect processes oldest-first and prevents duplicate outbox items.

### Test PWA offline

```bash
npm run build
npm run verify:pwa
npm run preview
```

Open the preview online, enter Demo, and visit the main routes. Then use browser DevTools Offline mode and refresh `/app/dashboard` or `/app/ponds/pond-b`. This must be tested from the production preview, not only `npm run dev`. The in-app Demo Control connection toggle tests application data/sync behavior but does not disconnect the browser.

Settings contains install, sync, offline storage deletion, version, and reset controls. A fresh device must visit once online before offline capability can be guaranteed. See [PWA.md](./PWA.md) and [OFFLINE_DEMO.md](./OFFLINE_DEMO.md).

## Final production notes

- Production must use HTTPS; localhost is accepted only for development.
- Direct SPA routes are handled by the Sites worker fallback to `index.html`.
- `npm run dev` does not register the production service worker. Production PWA behavior must be tested with `npm run build`, `npm run verify:pwa`, and `npm run preview`.
- `.env.example` intentionally contains no runtime values. Every `VITE_` variable is public client configuration and must never contain a secret.
- The demo session is device-local and is not production authentication. Do not store sensitive credentials in localStorage or IndexedDB.
- Route and chart code are split so the initial entry no longer includes every product page.

## Scope boundary

The MVP deliberately excludes push notifications, production authentication, backend/API, MQTT/real IoT, real weather feeds, WhatsApp, payments, multi-tenant security, real ML, and complex cloud conflict resolution.
