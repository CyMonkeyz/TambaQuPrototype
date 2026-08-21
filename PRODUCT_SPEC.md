# TambaQu Product Specification — Phases 1–5

## Product objective

TambaQu helps vannamei shrimp farmers and pond operators move from reactive decisions toward earlier, data-supported risk mitigation. The core product sequence is: understand what is happening, judge whether it requires attention, understand why, then choose and record an appropriate field action.

TambaQu is decision-support software. It does not diagnose disease, guarantee an event, or replace field verification and established operating procedures.

## Personas

### Farmer

The farmer primarily uses a smartphone, often outdoors. The experience prioritizes current pond condition, clear risk language, an explanation of the contributing conditions, and a concise next action. Touch targets, text contrast, and sensor-number legibility take priority over information density.

### Owner, pondivator, or field operator

This user monitors several ponds from desktop, tablet, or laptop. The experience prioritizes which pond needs attention, the reason, action history, trends, alerts, and device health.

## Primary use cases

1. Enter a safe demo workspace without real credentials.
2. Compare four ponds and identify the highest operational risk.
3. Inspect current water-quality readings and device connectivity.
4. Understand a transparent, synthetic risk explanation.
5. Review recommended actions and existing action records.
6. Review alerts, reporting structure, device status, and settings foundations.

## MVP scope

Phase 1 includes responsive routing, reusable visual primitives, mobile and desktop navigation, domain entities, mock repositories, deterministic 24-hour sensor histories, demo-session state, consistent units and WIB timestamps, starter pages, and architecture documentation.

Phase 2 adds the mature monitoring command center: farm overview, selected-pond monitoring, current sensor state, deterministic 6-hour/24-hour/7-day trends, pond prioritization, searchable/filterable multi-pond comparison, detailed pond monitoring, freshness, and device/data-health states.

Phase 3 adds the decision-support loop: explainable PondBrain risk analysis, deterministic recommendations, action confirmation and audit history, a complete alert-review lifecycle, and shared demo-state persistence. Monitoring, risk assessment, alert, recommendation, and farmer action remain distinct domain concepts.

Phase 4 adds the desktop farm-operations command center, multi-pond priorities, device management, operational reports, a deterministic competition simulator, reset, and presentation mode.

Phase 5 makes the product installable and useful after a prior online visit. The application shell and local brand assets are cached, domain snapshots are stored in IndexedDB, and farmer actions/alert acknowledgement can be queued locally and synchronized after reconnect.

## Offline user story

As a farmer, I can continue seeing the latest stored pond data and record actions when application connectivity is unavailable. The interface labels cached analysis and stale data explicitly. When connectivity returns, pending mutations synchronize automatically; failure remains visible and retryable.

Application offline does not imply that a pond sensor is offline. Those states retain separate labels and operational meaning.

## PondBrain user journey

1. Select a pond or preserve the context from Dashboard, Alert Detail, or Pond Detail.
2. Read the current score and explicit Aman/Waspada/Kritis label.
3. Understand what changed through the trend, contributors, and textual insight.
4. Review recommended actions ordered by operational priority.
5. Confirm a completed field action and optionally add notes.
6. Verify who did what and when in the action timeline while monitoring continues.

## Alert and action feedback loop

An alert is reviewed separately from its risk assessment. Acknowledgement records that an operator has seen the event. A completed recommendation creates an `ActionLog`; when a related action exists, an acknowledged alert may be marked **Tindak Lanjut Tercatat**. This label does not claim that pond conditions have recovered.

## Future product metrics

The analytics contract is intentionally provider-free. Future measurement can include alert response time, recommendation adoption rate, action completion rate, PondBrain engagement, and time-to-action without coupling UI components to an external analytics SDK.

## Report claim boundary

Operational reports describe synthetic readings, risk states, alerts, device availability, recommendations, and recorded demo actions. They do not claim disease prevention, survival improvement, or economic savings. Those outcomes require validated field and financial data.

## Non-goals

No real authentication, backend, MQTT/IoT gateway, WhatsApp integration, scientific/ML inference, notification server, payment, multi-tenant security, or production conflict-resolution system is implemented. Service-worker Background Sync is not required for reliability; app-level sync is the baseline.

## Terminology

- **Pond**: a managed shrimp culture pond.
- **Operational status**: active, maintenance, or inactive; independent of risk.
- **Risk level**: safe (0–39), warning (40–69), or critical (70–100).
- **PondBrain Insight**: an explainable decision-support summary. In the demo it uses deterministic synthetic logic.
- **Alert**: a condition requiring awareness, acknowledgement, or resolution.
- **Recommended action**: a proposed operational response that must be verified against field conditions and SOP.
- **Action log**: a record of an action carried out by an operator.

## Competition and demo context

The application is a competition MVP that demonstrates product behavior and future technical fit. Every sensor reading, alert, risk score, device state, recommendation, and action record is synthetic. Copy in the interface explicitly marks the environment as a simulation so it cannot reasonably be mistaken for validated field data.
