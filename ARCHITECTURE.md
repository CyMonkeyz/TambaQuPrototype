# TambaQu Architecture — Final Competition MVP

## Stack

- React 19 and TypeScript 6 in strict, no-emit mode.
- Vite 8 for development and production bundling.
- React Router for nested route composition and URL-owned navigation.
- Tailwind CSS 4 with CSS-variable design tokens.
- Zustand with persisted, minimal device-local session state.
- Lucide React for consistent accessible iconography.
- Radix Dialog and Tooltip primitives for keyboard/focus behavior.
- Sonner for a lightweight toast surface.
- OpenAI Sites Vite metadata with a minimal Cloudflare-compatible static asset worker for deployment only.
- Recharts, loaded as a separate route chunk, for focused single-parameter water-quality history.

## Folder architecture

`app` composes providers and routes. `pages` own route-level orchestration. `components` are split into generic UI, shared layout/common elements, and domain presentation. `domain` contains framework-independent entity contracts. `data` contains repository contracts, mock implementations, and fixtures. `services` contains business rules. `store` holds only client/session preferences. Hooks and utilities centralize async loading, formatting, and styling helpers.

This makes the dependency direction explicit:

```text
Page / domain component
        ↓
Repository contract
        ↓
Mock implementation (now) or API implementation (future)
```

## Domain layer

Domain types distinguish operational pond status from risk level. Sensor units are metadata rather than repeated fields on every reading. Risk contributors are structured, explainable, and capable of representing direction and contribution. `ActionLog.syncStatus` anticipates offline synchronization without implementing a sync engine prematurely.

## Repository pattern

Pages never import fixtures. They request data from the repository container in `src/data/repositories`. Each interface is asynchronous even though the current implementation is in-memory; an API implementation can therefore preserve page contracts and loading/error states. The mock repository owns filtering and relationships so business lookup logic is not duplicated across pages.

## State management

Zustand contains the active user, active farm, selected pond, demo-mode flag, and sidebar preference. Persist middleware stores only this device-local application context. Server-shaped data such as ponds, alerts, and sensor readings remains in repositories rather than becoming a second client-side database.

## Future API integration

Add implementations such as `ApiPondRepository` and construct the repository container through environment-aware dependency injection. Keep response mapping at the data boundary so UI/domain contracts remain stable. Authentication tokens should be handled by a dedicated API/session service, not embedded in page components or Zustand domain records.

## Phase 2 monitoring hooks

`useFarmMonitoring` and `usePondMonitoring` compose existing repository contracts into UI-ready monitoring records. Pages still do not import fixtures, and domain data is not copied into Zustand. `useRepositoryData` provides loading, error, and retry behavior while retaining an API-compatible asynchronous boundary.

`useDocumentTitle` keeps route titles contextual without introducing an SEO framework.

## Derived monitoring logic

`src/services/monitoring.ts` owns deterministic calculations used across screens: farm risk counts, highest-priority pond, risk sorting, trend percentage/direction, parameter-aware sentiment, demo sensor state, data freshness, monitoring summaries, and risk-score change. Focused Vitest coverage protects edge cases such as missing readings and zero baselines.

## Chart architecture

`WaterQualityChart` receives repository-provided history and controlled parameter/range state. It shows one parameter at a time so different units and scales are never conflated. Pages lazy-load the Recharts component, and every chart includes a textual latest-value/trend summary for accessibility. Sensor cards control the chart through ordinary React state; no event bus or duplicated telemetry store is introduced.

## Phase 3 decision-support services

`services/risk/riskEngine.ts` maps scores to levels, sorts contributors, derives deterministic history from the same sensor readings, and calculates data confidence from completeness, device freshness, and contributor coverage. The demo calibration preserves the settled A/B/C/D scenarios without pond-specific branching in UI code.

`services/recommendation/recommendationEngine.ts` generates ordered recommendations from risk level and contributors. `services/action/actionService.ts` prevents duplicate completion and creates immutable `ActionLog` records. Alert transitions live in `services/alert/alertService.ts`; reusable selectors own filtering, pending counts, completion state, and top-contributor lookup.

## Action and alert lifecycle

```text
RiskAssessment -> Recommendation -> confirmation -> ActionLog
Alert(new) -> acknowledged -> follow-up recorded
```

The simulation remote adapter owns mutable demo state. Phase 5 wraps it with offline-first repositories backed by IndexedDB. Versioned `localStorage` remains a compatibility layer for the simulation adapter; it is not the sync outbox. A confirmed reset restores deterministic fixtures and reseeds IndexedDB. Zustand remains split between session/UI state, simulation controls, and connectivity/sync presentation state.

## Future ML replacement

```text
Current: Sensor Data -> Deterministic Risk Engine -> RiskAssessment
Future:  Sensor Data -> Backend Feature Pipeline -> Validated ML Model -> Risk API -> RiskAssessment
```

The frontend consumes the same explainable `RiskAssessment` contract in both cases. A future model must still provide score, level, contributors, and summary; replacing the engine must not turn the UI into a black box.

## Phase 4 simulation layer

```text
Scenario configuration
        ↓
Deterministic simulation engine
        ↓
Simulation remote adapter / repository state
        ↓
RiskAssessment → Recommendation Engine
        ↓
Repository subscription → UI
```

Simulation control state is a dedicated Zustand store. A timer advances only once per meaningful scenario step; pages never receive animation-frame telemetry and never mutate the DOM directly. The overlay can target any pond supported by a scenario definition. In production, the simulation remote adapter can be replaced without changing page contracts:

```text
Prototype: Simulator → SensorReading Repository
Production: IoT Gateway → Backend → SensorReading API → SensorReading Repository
```

## PWA architecture

Cache Storage and IndexedDB have separate responsibilities:

- Workbox precaches the versioned HTML, JavaScript, CSS, local icons, and critical assets. SPA navigation falls back to the precached `index.html` after a successful online visit.
- `TambaQuDB` (Dexie schema version 2) stores farms, ponds, sensor readings, risk assessments, alerts, recommendations, actions, devices, sync metadata, and the mutation outbox.
- Sensor history is bounded to 720 records per pond in the prototype; it is not an unlimited event store.
- The app renders from the local repository boundary and performs remote/demo refresh without blocking on outbox completion.

```text
UI
 ↓
Offline-First Repository
 ├── IndexedDB (immediate/cached domain read)
 └── Mock + Simulation Remote Adapter (prototype)

Mutation
 ↓
Local transaction
 ├── update ActionLog or Alert
 └── insert idempotent OutboxItem
 ↓
Sequential Sync Manager
 ↓
Remote Adapter
```

The service worker contains no domain logic. Mutation requests are never blindly cached. Future monitoring GET endpoints should use Network First with a short timeout and cached fallback; future POST/PATCH operations must remain outbox-backed.

## Outbox and sync lifecycle

Supported operations are `ACTION_LOG_CREATE`, `ALERT_ACKNOWLEDGE`, and `ALERT_RESOLVE`. Each item has a stable outbox ID plus a unique `clientMutationId` for future backend idempotency. Action creation and its outbox insert share one Dexie transaction. Processing is sequential and oldest-first. Successful items are removed and actions become `synced`; failed items remain observable with attempt count and error, use bounded 1s/3s/10s retries, and support manual retry.

Append-only action semantics minimize future conflicts. Alert acknowledgement uses the latest acknowledged state. Production still needs server versioning and explicit conflict policy; the prototype does not implement CRDTs.

## Connectivity separation

Application connectivity and sensor-device connectivity are independent. `navigator.onLine` is only a browser hint. Demo override can simulate Online, Offline, or Degraded application connectivity without changing `SensorDevice.connectionStatus` and without actually disconnecting the browser. In production a sensor gateway may continue sending data to the cloud while the farmer phone is offline.

## Startup and failure fallback

```text
Launch → render stable route shell → open and validate IndexedDB
       → migrate/reseed incompatible cache → render cached domain data
       → observe connectivity → refresh demo remote → process outbox
```

Sync never blocks the application shell. If IndexedDB is unavailable (including restrictive private-browsing environments), the app marks offline storage unavailable and continues through the in-memory/remote adapter while online. The v2 migration clears incompatible cached snapshots but preserves pending actions/outbox records. IndexedDB is not secure secret storage; no credentials, passwords, or API keys are stored there.

## Final runtime and bundle boundaries

Secondary routes and chart-heavy operations surfaces use lazy imports with a shared stale-chunk recovery policy. Login, the shell, and Dashboard routing remain eager. A global error boundary keeps unexpected render failures recoverable, while offline initialization reports through connectivity state instead of crashing the React tree. Zustand subscriptions use primitive/granular selectors unless a control surface intentionally consumes the complete stable store object.

## Why these choices

The architecture favors low coupling and progressive capability. React Router makes desktop/mobile navigation share URLs. Repository contracts keep demo data replaceable. Deterministic fixtures make demonstrations and future visual tests reproducible. Semantic tokens allow risk/status styling to change centrally. Minimal Zustand state prevents stale duplicated server data.

The deployment worker serves the built static application and falls back to `index.html` for online client-side routes. Workbox handles cached navigation after a prior successful load. Neither layer introduces a backend, production authentication, MQTT, or real inference.
