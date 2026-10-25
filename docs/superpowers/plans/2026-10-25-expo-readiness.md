# TambaQu Interactive Expo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship an interactive, branded expo demo behind registered Supabase email/password authentication, with explicitly simulated subscription/payment journeys, then verify GitHub and Vercel publication.

**Architecture:** Preserve existing React routes, domain components, Zustand/Dexie data and Supabase integration. Replace public demo entry with a provider session gate; keep simulation data separate from real farms. Add a focused local billing domain rather than emulating a payment backend.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind, Vitest/Testing Library, Zustand, Dexie, Supabase Auth.

**Spec:** docs/superpowers/specs/2026-10-25-expo-readiness-design.md, with user's latest amendment: registered email/password required everywhere, no guest or display-name-only expo entry.

## Global Constraints
- Do not destroy or blindly commit existing tracked/untracked changes.
- No hardcoded credentials, local password database, guest bypass, real money movement or physical actuator calls.
- Supabase provider session is the authentication authority, not activeUser/activeFarm in persisted app state.
- Registration/recovery respect provider email verification policy. No auth configuration secrets in source or logs.
- Labels must distinguish simulated measurements, recommendations, prices and invoices from real operations.
- No presentation mode on reachable routes or controls.
- Push to origin without force only after release checks; separately verify actual deployment.

## Review Focus
- Hydrated local demo state must not grant anonymous access or survive logout as authorization.
- Pending/expired payment and repeated clicks must not activate a subscription twice.
- Invalid numbers, empty text and reload must not create corrupt cultivation data.
- Offline service-worker state must not imply account verification or leak data across accounts.
- Mobile navigation, dialogs, charts and deep links must remain usable with keyboard and narrow viewports.

---

### Task 1: Registered authentication and entry routing
**Files:** modify src/app/router/EntryRoutes.tsx, src/app/router/index.tsx, src/pages/Login/LoginPage.tsx, src/pilot/useCloudSession.ts, src/pilot/client.ts, src/operations/Workspace.tsx; update src/app/startup.test.tsx; create src/app/router/auth.test.tsx.
**Interfaces:** consumes cloud.auth and useCloudSession(): {session, loading}; authenticated simulation initializes existing getDemoSession()/enterDemo only after provider confirmation. Cloud session remains distinct from demo fixtures.
- [ ] Record baseline git diff and untracked inventory outside the repository before edits. Inspect LoginPage, app store, logout handlers and auth recovery behavior in full.
- [ ] Add denied-entry tests for '/', '/demo', '/expo', '/app/dashboard' and '/pilot' with stale local fixtures and null provider session. Start with the following provider mock and route assertion in auth.test.tsx:
```tsx
vi.mock('../../pilot/useCloudSession', () => ({
  useCloudSession: () => ({ session: null, loading: false }),
}));
it.each(['/demo', '/expo', '/app/dashboard', '/pilot'])('requires login for %s', async (path) => {
  render(<MemoryRouter initialEntries={[path]}><AppRouter /></MemoryRouter>);
  expect(await screen.findByRole('heading', { name: 'Masuk ke TambaQu' })).toBeTruthy();
  expect(screen.queryByRole('button', { name: 'Coba Demo' })).toBeNull();
});
```
- [ ] Run `npx vitest run src/app/router/auth.test.tsx --pool=forks --maxWorkers=1`; confirm tests fail against old bypass behavior, then replace guards with provider-session/loading checks. Do not let a demo-ready local store satisfy the gate. Initialize simulation fixtures only inside authenticated demo entry.
- [ ] Keep signInWithPassword, signUp and resetPasswordForEmail through Supabase; display provider failures, confirmation-required signup and unconfigured-backend state. Ensure recovery form is not redirected before password update. Remove public demo login action.
- [ ] Add tests for loading state, authenticated entry, verification-required registration and logout/expired session. Update previous startup test expecting guest demo instead of suppressing it.
- [ ] Re-run auth/startup tests, lint changed files and build. Review diff and commit only this task's reviewed paths.

### Task 2: Interactive operations and presentation removal
**Files:** modify src/components/layout/Sidebar.tsx, src/constants/navigation.ts, src/pages/Services/ServicesPage.tsx, src/pages/DemoControl/DemoControlPage.tsx, src/pages/Settings/SettingsPage.tsx, src/operations/Workspace.tsx, src/operations/EntityPanel.tsx and src/operations/repository.ts as required by audited defects; tests in src/operations/ui.test.tsx and repository.test.ts.
**Interfaces:** existing entity definitions/validation, queueEntity/saveDemo repository APIs and domain app state; do not add a second unrelated simulation store.
- [ ] Inventory reachable routes and controls in docs/EXPO_RELEASE_VERIFICATION.md: route, control, expected result, automated/browser evidence, unresolved limitation. Read component and repository code before edits.
- [ ] Add regression tests for each audited CRUD defect before its fix: required fields, NaN/infinity/out-of-domain input, edit/delete ID consistency, reload persistence, failed storage and reset isolation.
- [ ] Run `npx vitest run src/operations/ui.test.tsx src/operations/repository.test.ts --pool=forks --maxWorkers=1`; fix only demonstrated defects and repeat.
- [ ] Remove presentation controls/links and route behavior. Legacy /expo is an authenticated redirect to dashboard, never autoplay/fullscreen. Retain ordinary scenario controls only with simulation labels.
- [ ] Assert presentation UI is absent in navigation/route tests and confirm no reachable fullscreen presentation path via source search and browser.
- [ ] Record verified control results and commit reviewed task paths.

### Task 3: Subscription and checkout simulation
**Files:** create src/features/billing/model.ts, model.test.ts, BillingPage.tsx and BillingPage.test.tsx; integrate router, navigation and ServicesPage. Inspect src/operations/panels.tsx CommercialPanel and pilot billing paths before integration.
**Interfaces:** model exports Plan, Invoice and Subscription types; catalog is one price source; createInvoice, transitionInvoice and subscription cancellation operate on validated immutable state scoped by authenticated user ID. Storage adapter isolates user-specific simulation billing from cloud records.
- [ ] Pin state transitions with tests before implementation, beginning with:
```ts
it('does not activate a pending invoice', () => {
  const invoice = createInvoice('user-a', 'core', 1);
  expect(invoice.status).toBe('pending');
  expect(transitionInvoice(invoice, 'pending').status).toBe('pending');
});
it('keeps a successful result idempotent', () => {
  const invoice = createInvoice('user-a', 'core', 1);
  const paid = transitionInvoice(invoice, 'succeeded');
  expect(transitionInvoice(paid, 'succeeded')).toEqual(paid);
});
```
- [ ] Define Core Monitoring, Smart Oxygen, optional BioflocCare and Cluster Service in one catalog with explicit estimated/demo price labels. Reject unknown plan, invalid period, owner mismatch and unsafe totals. Validate persisted storage schema before hydration.
- [ ] Implement selection -> summary -> consent -> pending invoice -> QRIS/VA simulation -> result -> invoice history. No actual payable QR/account, card fields, merchant API or hidden real checkout. A successful simulated invoice alone creates/extends a simulated subscription; pending/failure/expiry do not.
- [ ] Add UI/model tests for total/periode, add-on eligibility, double-click idempotency, pending reload, unsuccessful outcomes, cross-account isolation, end-of-period cancellation, undo cancellation and storage failure.
- [ ] Run `npx vitest run src/features/billing --pool=forks --maxWorkers=1`; correct failures and commit reviewed paths.

### Task 4: Visual polish, complete verification and publication
**Files:** src/styles/global.css and targeted existing UI/layout files; add vercel.json only if needed for verified SPA hosting; docs/EXPO_RELEASE_VERIFICATION.md. Runtime brand assets remain local.
**Interfaces:** existing Button/Card/Overlay components and design tokens; no new design framework or parallel layout shell.
- [ ] Polish login/dashboard/services/billing first, then normalize all reachable screens: teal #14B8A6, blue #0B6E8E, spacing, accessible input labels, focus, error/loading/empty/offline states and responsive chart bounds. Keep existing functional components rather than broad rewrite.
- [ ] Start dev/preview server and verify readiness before browser testing. Exercise protected deep links, login failure, authenticated success when a real configured account is available, CRUD/reload, checkout outcomes, invoice, cancellation and logout. Browser tests with mocked auth must be explicitly reported as mocked, never real authentication proof.
- [ ] Capture/inspect 390, 768 and 1440 px layouts; verify no horizontal overflow, mobile navigation, modal focus/Escape, contrast and console/runtime errors. Enumerate each tested button/route in release evidence.
- [ ] Run independently: `npm test -- --maxWorkers=1`, `npm run lint`, `npm run build`, `npm run verify:pwa`, `npm audit --omit=dev`. If threads still fail, diagnose and run single fork with recorded rationale rather than claiming tests passed with unhandled errors.
- [ ] Obtain fresh read-only code review of whole release diff. Fix blocking findings and re-run affected tests plus full release gates.
- [ ] Inspect git status/diff, staged-file inventory and secrets scan. Explicitly review baseline dependencies needed for working build; exclude tmp/output/pitch decks/private files. Commit exact reviewed runtime paths only.
- [ ] Push `git push origin main` only after remote branch divergence check; never force. Read back exact origin branch SHA and compare to local release commit.
- [ ] Discover existing deployment URL via project configuration/GitHub deployment; verify deployment commit/build status and production login/deep-link/PWA behavior. Report GitHub push and Vercel deployment separately. If missing Supabase env or test credentials block real login, do not claim authenticated end-to-end success or release readiness; list precise prerequisite without asking for secrets in chat.

## Current verified prerequisites
Baseline lint exits 0 with one warning in tmp/ppt-build/build_deck.mjs. Baseline build exits 0. verify:pwa exits 0 (8 artifacts). Previous test run has 88 passing tests but one worker timeout and exit 1. Local root has .env.example only and no .env values; production environment configuration is unknown. No Vercel config file was present. These are observations, not completed task acceptance.
