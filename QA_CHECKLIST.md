# Final QA Checklist

Status legend: `[x]` automated or directly verified, `[~]` code-reviewed but still needs browser confirmation, `[ ]` not verified in this environment.

## Functional

- [x] Demo session guard and Dashboard startup.
- [x] Monitoring, decision-support, actions, alerts, reports, devices, simulator, sync, and repository suites.
- [x] Invalid pond uses the product not-found/error state.
- [~] Keyboard walkthrough of every route in a real browser.

## Responsive

- [~] Mobile, tablet, desktop, and presentation layouts reviewed in source.
- [~] Tables are desktop-only where a mobile card alternative exists.
- [ ] Visual checks at 360, 390, 430, 768, 1024, 1280, 1440, and 1920 px.
- [ ] Landscape-mobile visual check.

## Accessibility

- [x] Global visible focus style and 44 px minimum primary controls.
- [x] Radix dialogs provide focus trap, Escape close, and opener focus return.
- [x] Route navigation moves focus to the main content region.
- [x] Risk states use icon, label, and color.
- [x] Charts expose accessible names and textual summaries.
- [x] Reduced-motion rules cover transitions, spinners, simulator UI, and charts.
- [~] Contrast tokens reviewed for normal/muted/status text.
- [ ] Screen-reader and keyboard-only browser pass.

## PWA

- [x] Production manifest, required icons, service worker, and precache verification script.
- [x] Prompt-based update; no automatic destructive reload.
- [x] Development PWA explicitly disabled and stale local workers cleaned only in development.
- [x] Stale lazy chunk shows a user-controlled update action.
- [ ] Browser installability audit.

## Offline

- [x] IndexedDB seed, hydration, migration, local mutation, outbox ordering, retry, and reconnect tests.
- [x] Failed offline storage falls back to online UI with a visible status message.
- [ ] Browser offline nested-route refresh and Cache Storage inspection.

## Simulator

- [x] Deterministic 22 → 34 → 48 → 58 → 67 warning sequence.
- [x] Critical, recovery, and device-failure scenarios.
- [x] Twenty reset/start data cycles without duplicate simulated alerts.

## Reports

- [x] Aggregation and CSV export unit tests.
- [x] Synthetic-data disclosure and print stylesheet.
- [ ] Browser print/PDF visual output.

## Devices

- [x] Health, attention sorting, filtering, and calibration unit tests.
- [x] App connectivity and device connectivity use distinct copy.
- [ ] Dialog and card visual inspection across target widths.

## Startup

- [x] Fresh database seed.
- [x] Existing IndexedDB hydration.
- [x] Old schema migration with pending outbox preservation.
- [x] Invalid persisted session normalization.
- [x] Dashboard remains rendered after hydration and stability wait.
- [x] Global error boundary prevents a blank page.

## Competition Demo

- [x] Golden-path risk values and PondBrain contributor values are deterministic fixtures/tests.
- [x] Offline mutation and reconnect behavior is covered by repository tests.
- [x] Presentation mode suppresses install/update interruptions and engineering controls.
- [ ] Timed 90-second and 45-second rehearsals in the presentation browser.
