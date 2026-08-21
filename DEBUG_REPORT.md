# P0 White Screen Incident

## Symptom

On the desktop dashboard, the stable application shell and loading state appeared first. After asynchronous repository and IndexedDB hydration completed, the React tree disappeared and left a white page.

## Root Cause

`OperationsDashboard` subscribed to Zustand 5 with a selector that created a new object on every snapshot:

```ts
useSimulationStore((state) => ({
  status: state.status,
  scenarioId: state.scenarioId,
  currentStep: state.currentStep,
}));
```

The selector result was referentially different even when the store had not changed. React's external-store integration therefore treated every snapshot as new, repeatedly rendered the component, and ultimately stopped the tree with the external-store snapshot / maximum-update-depth failure. It appeared after roughly one second because `OperationsDashboard` only mounted after the asynchronous dashboard data loader completed.

The large production bundle warning was unrelated. The build succeeded and the loop was a runtime state-subscription failure.

## Evidence

- The failure boundary was the desktop-only `OperationsDashboard`, mounted only after `useFarmMonitoring` resolved.
- The unstable selector was the only Zustand selector in the application that returned a fresh object literal.
- Replacing it with the primitive `status` selector removed the loop without disabling IndexedDB, PWA registration, routing, providers, or hydration.
- The startup integration test now renders the real app providers and dashboard, waits for hydration, then waits another 1.2 seconds and confirms `Ringkasan Operasional` remains mounted.

## Fix

- Replaced the composite selector with `useSimulationStore((state) => state.status)`.
- Added a global React error boundary so an unexpected render error never becomes a pure white page.
- Added a recoverable stale-chunk message for failed lazy imports.
- Added explicit development service-worker cleanup while keeping production PWA registration intact.
- Added versioned Zustand normalization for invalid persisted sessions.
- Upgraded the Dexie schema to version 2, invalidated incompatible cached snapshots, preserved pending outbox records, and validated snapshot shape before hydration.
- Contained offline-runtime initialization failures in the connectivity state so the online UI can continue.

## Why the Fix Works

Primitive Zustand selections are stable until their actual value changes, so React receives a cached-equivalent snapshot. Cache and session validation prevent old object shapes from reaching render code. The error boundary and independent offline error state provide a final recovery layer rather than hiding the original error.

## Regression Tests Added

- Fresh/seeded IndexedDB application startup.
- Existing local session normalization.
- Dashboard persistence after asynchronous hydration plus a 1.2-second stability window.
- Global error-boundary fallback.
- Dexie v1-to-v2 migration that clears incompatible cached domain snapshots while preserving pending outbox mutations.
- Twenty consecutive simulator reset/warning cycles.
