# TambaQu Architecture — Phases 1–2

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

## Future PWA and offline architecture

The planned offline path is a service worker for application-shell assets, IndexedDB for explicitly cacheable repository responses, and an action command queue with idempotency keys. Pending commands map naturally to `ActionLog.syncStatus`. A synchronization coordinator can replay commands when connectivity returns and repositories can expose cache metadata. None of this is active in Phase 1, avoiding premature cache and conflict semantics.

## Why these choices

The architecture favors low coupling and progressive capability. React Router makes desktop/mobile navigation share URLs. Repository contracts keep demo data replaceable. Deterministic fixtures make demonstrations and future visual tests reproducible. Semantic tokens allow risk/status styling to change centrally. Minimal Zustand state prevents stale duplicated server data.

The deployment worker only serves the already-built static application and falls back to `index.html` for client-side routes. It does not introduce a backend, API, authentication, or PWA behavior.
