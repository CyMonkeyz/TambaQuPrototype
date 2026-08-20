# TambaQu Synthetic Demo Data

## Important notice

Every value in the Phase 1 dataset is synthetic and created exclusively to demonstrate product behavior. It is not collected from Tambak Mina Jaya or any other real farm, is not scientific validation, and must not be represented as field evidence, disease prediction, or proof of model performance.

## Purpose and reproducibility

The fixtures exercise safe, warning, critical, degraded-device, alert, recommendation, and action-log interfaces. A fixed reference time and deterministic wave/trend functions generate 25 hourly readings per pond, covering the current point plus the preceding 24 hours. No value changes between renders.

## Demo identity

- User: Andi Setiawan (owner persona)
- Farm: Tambak Mina Jaya
- Location label: Kebumen, Jawa Tengah

These names are demo identities and do not imply a real account or farm deployment.

## Pond scenarios

| Pond | Score / level | Scenario |
| --- | --- | --- |
| Kolam A | 22 / Aman | DO around 6.0 mg/L, stable pH and temperature, low ammonia and nitrite. |
| Kolam B | 67 / Waspada | DO trends toward 4.2 mg/L, pH around 7.4, temperature around 30.1 °C, ammonia around 0.14 mg/L, and nitrite around 0.07 mg/L. Contributors are expressed as 42% DO, 27% ammonia, 18% temperature, and 13% weather/context for demo explanation only. |
| Kolam C | 84 / Kritis | DO around 3.1 mg/L with increased ammonia and nitrite, creating a high-priority operational scenario. |
| Kolam D | 18 / Aman | Stable water-quality values paired with an offline/maintenance device scenario to demonstrate that device and risk states are independent. |

Risk labels follow the UX contract: Aman 0–39, Waspada 40–69, and Kritis 70–100. These thresholds are product-demo semantics and are not presented as validated aquaculture science.
