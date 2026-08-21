# TambaQu PWA and Offline Architecture

## Install requirements

The production build generates `manifest.webmanifest`, `sw.js`, Workbox runtime, and local 192/512/maskable icons. Installation requires HTTPS (or localhost), a supporting browser, and a successful service-worker registration. The manifest launches at `/app/dashboard` with standalone display. A fresh device still needs one successful online visit before offline use can be guaranteed.

Run:

```bash
npm run build
npm run verify:pwa
npm run preview
```

The install action appears in Settings only when `beforeinstallprompt` is available. Installed/standalone state hides the CTA. iOS Safari receives Add to Home Screen instructions. App updates use an explicit prompt; no update forces a surprise reload or interrupts an active simulation/presentation.

Normal Vite development explicitly disables service-worker generation/registration. A development-only startup safeguard unregisters a stale worker for the same local origin, removes only TambaQu/Workbox caches, and performs at most one controlled reload when the old worker was already controlling the tab. Production registration and caches are never removed by this safeguard.

## Cache strategy

- Workbox precache: `index.html`, hashed JavaScript/CSS, local app icons, and critical local assets.
- Navigation fallback: cached `/index.html` for SPA routes after a prior online load.
- Images: Cache First, maximum 40 entries and 30-day expiration.
- Old Workbox caches are cleaned during activation.
- Mutation requests and arbitrary third-party pages are not cached.

Future monitoring GET endpoints should use Network First with a short timeout and cached fallback. Future POST/PATCH requests must use the application outbox instead of Cache Storage.

## IndexedDB

Dexie database `TambaQuDB`, schema version 2:

- `farms`
- `ponds`
- `sensorReadings` (`pondId`, `timestamp`, and compound index)
- `riskAssessments`
- `alerts`
- `recommendations`
- `actionLogs`
- `devices`
- `outbox`
- `syncMeta`

Sensor retention is bounded to 720 records per pond for this prototype. The database is seeded once from the mock/simulation remote adapter and only reseeded after an explicit reset or a later online refresh. IndexedDB stores no passwords, API secrets, or production auth tokens.

The v1-to-v2 migration invalidates cached domain snapshots whose runtime shape changed while preserving `actionLogs` and `outbox`. Startup also validates required farm, pond, reading, risk-contributor, and device fields. An incompatible snapshot is reseeded automatically; users are not asked to clear IndexedDB manually.

## Offline behavior and outbox

Cached domain data remains available to Dashboard, Ponds, Pond Detail, PondBrain, Alerts, Devices, and Reports. Offline UI explicitly labels the snapshot as local/cached.

Offline `ACTION_LOG_CREATE`, `ALERT_ACKNOWLEDGE`, and `ALERT_RESOLVE` operations update local data and insert an outbox item in one transaction. Each item has a unique `clientMutationId`. The sync manager processes oldest-first, marks actions synced on success, keeps failures with their error/attempt count, retries with bounded 1s/3s/10s delays, and supports manual retry. App-level sync works without Background Sync API support.

## Connectivity semantics

`navigator.onLine` is a connectivity hint, not proof that a future server is reachable. Demo Control can override app behavior to Online, Offline, or Degraded. That override does not actually change browser networking and does not mutate sensor-device connectivity.

Production distinction:

```text
Sensor → cloud/backend
Farmer app → cloud/backend
```

A sensor may continue uploading while the farmer phone is offline. The app refreshes from the cloud after reconnect.

## Storage and failure behavior

Settings exposes offline storage state, manual sync, demo reset, and explicit offline-data deletion. Pending mutations are disclosed before reset/delete. If IndexedDB is restricted or fails, the app remains usable through the online/in-memory adapter and explains that offline storage is unavailable.

Production still requires authentication, authorization, encryption in transit, local retention policy, server-side access controls, and logout/clear-device handling.

## Manual PWA QA

1. Build and serve production preview.
2. Open the app online, enter demo, and visit core routes.
3. Confirm manifest and active service worker in browser DevTools.
4. Switch browser DevTools to Offline and refresh `/app/dashboard` and `/app/ponds/pond-b`.
5. Confirm the app shell and cached domain data load.
6. Restore online and verify pending outbox items sync.
7. For installation, use a browser that exposes its install prompt; standalone launch validation remains browser/platform dependent.
8. Deploy a new version, keep the existing tab open, and confirm the update prompt appears without an automatic reload. If an old lazy chunk is no longer available, confirm the recovery screen offers **Muat Versi Terbaru**.

Known limitation: an app never visited online cannot have its assets/data cached. The current remote adapter is synthetic and local; real network reachability and server conflict handling remain future work.
