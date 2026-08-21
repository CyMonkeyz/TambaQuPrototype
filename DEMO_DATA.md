# TambaQu Synthetic Demo Data

## Important notice

Every value in the dataset is synthetic and created exclusively to demonstrate product behavior. It is not collected from Tambak Mina Jaya or any other real farm, is not scientific validation, and must not be represented as field evidence, disease prediction, or proof of model performance.

## Purpose and reproducibility

The fixtures exercise safe, warning, critical, degraded-device, alert, recommendation, and action-log interfaces. A fixed reference time and deterministic wave/trend functions generate 169 hourly readings per pond, covering the current point plus the preceding seven days. The 6-hour, 24-hour, and 7-day chart ranges all read from this same fixed dataset; no value changes between renders.

## Demo identity

- User: Andi Setiawan (owner persona)
- Farm: Tambak Mina Jaya
- Location label: Kebumen, Jawa Tengah

These names are demo identities and do not imply a real account or farm deployment.

## Reset baseline and pond scenarios

An explicit reset returns Kolam B to 22 / Aman with DO 5.8 mg/L, pH 7.9, temperature 29.0 °C, salinity 19 ppt, ammonia 0.03 mg/L, and nitrite 0.02 mg/L. Kolam C remains the pre-existing critical comparison pond.

| Pond    | Score / level | Scenario                                                                                                                                                                                                                                             |
| ------- | ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Kolam A | 22 / Aman     | DO around 6.0 mg/L, stable pH and temperature, low ammonia and nitrite.                                                                                                                                                                              |
| Kolam B | 67 / Waspada  | DO trends toward 4.2 mg/L, pH around 7.4, temperature around 30.1 °C, ammonia around 0.14 mg/L, and nitrite around 0.07 mg/L. Contributors are expressed as 42% DO, 27% ammonia, 18% temperature, and 13% weather/context for demo explanation only. |
| Kolam C | 84 / Kritis   | DO around 3.1 mg/L with increased ammonia and nitrite, creating a high-priority operational scenario.                                                                                                                                                |
| Kolam D | 18 / Aman     | Stable water-quality values paired with an offline/maintenance device scenario to demonstrate that device and risk states are independent.                                                                                                           |

## Trend scenarios

- Kolam A and Kolam D remain comparatively stable, with small daily variation.
- Kolam B trends toward lower DO and higher ammonia over the most recent day, supporting the Waspada monitoring story.
- Kolam C shows the more severe combination of low DO and elevated ammonia/nitrite.
- Earlier 7-day values remain bounded around each pond profile; recent deterioration is deterministic rather than generated at runtime.

Current-value targets remain approximately: Kolam A DO 6.0 mg/L, Kolam B DO 4.2 mg/L, Kolam C DO 3.0 mg/L, and Kolam D DO 6.1 mg/L. Chart interpretation, freshness thresholds, and sensor states are product-demo configuration—not claims of universal biological limits.

Risk labels follow the UX contract: Aman 0–39, Waspada 40–69, and Kritis 70–100. These thresholds are product-demo semantics and are not presented as validated aquaculture science.

## Risk contributors and recommendations

- Kolam B uses DO 42%, Amonia 27%, Suhu 18%, and Konteks Lingkungan 13%. Its generated actions cover aeration inspection, feed evaluation, and one-hour monitoring.
- Kolam C prioritizes direct pond inspection and SOP-aligned aeration, followed by ammonia/feed review and continued monitoring.
- Kolam A and D receive calm routine-monitoring guidance instead of aggressive corrective actions.

Recommendation rules inspect risk level and contributors. They do not diagnose disease, prescribe universal biological thresholds, or claim future outcomes.

## Deterministic simulator scenarios

| Scenario | Risk progression | DO progression | Ammonia progression | Expected event |
| --- | --- | --- | --- | --- |
| Stable | 22 | 5.8 | 0.03 | No new alert |
| Early Warning | 22 → 34 → 48 | 5.8 → 5.2 → 4.8 | 0.03 → 0.06 → 0.09 | One warning alert |
| Warning Escalation | 22 → 34 → 48 → 58 → 67 | 5.8 → 5.2 → 4.8 → 4.5 → 4.2 | 0.03 → 0.06 → 0.09 → 0.11 → 0.14 | Warning alert remains unique; aeration recommendation appears |
| Critical | 67 → 76 → 84 | 4.2 → 3.6 → 3.0 | 0.14 → 0.17 → 0.20 | One critical alert |
| Recovery | 84 → 76 → 61 → 48 | 3.0 → 3.6 → 4.3 → 4.8 | 0.20 → 0.17 → 0.12 → 0.09 | Copy says indicators decrease, not that disease was prevented |
| Device Failure | Online → Degraded → Offline → Online | Stable snapshot | Stable snapshot | Demonstrates app/device contingency separation |

The warning contributor mix is always DO 42%, ammonia 27%, temperature 18%, and context 13%. Scenario steps append meaningful sensor readings to history and never use random values.

## Alert and action scenarios

The initial alert state contains one active critical alert, two active warning alerts, and three historical follow-up records. The Kolam B risk alert starts as **Belum ditinjau** for the golden flow. Existing action fixtures provide auditable history while the primary aeration recommendation remains pending.

Completing an action or acknowledging an alert writes through the offline-first repository. Online mutations become synced immediately. Offline mutations are committed atomically to IndexedDB with an outbox item and display `pending` until reconnect. The mock simulation adapter still uses versioned `localStorage` internally, but IndexedDB is the Phase 5 domain cache and outbox.

Cached/offline values remain the same synthetic competition dataset. Caching does not make them field observations, live sensor measurements, or validated scientific results.
