import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { DemoScenario, DemoScenarioStep } from "../../domain/simulation";
import type { RiskAssessment, RiskContributor } from "../../domain/risk";
import type { SensorDevice, SensorReading } from "../../domain/sensor";
import { acknowledgeAlertRecord, resolveAlertRecord } from "../../services/alert/alertService";
import { generateRecommendations } from "../../services/recommendation/recommendationEngine";
import { getStableStep } from "../../services/simulation/scenarioDefinitions";
import {
  DEMO_NOW,
  demoActions,
  demoAlerts,
  demoDevices,
  demoFarm,
  demoPonds,
  demoReadings,
  demoRisks,
  demoUser,
} from "../mock/fixtures";
import type {
  ActionRepository,
  AlertRepository,
  FarmRepository,
  PondRepository,
  RiskRepository,
  SensorRepository,
} from "./contracts";

const STORAGE_KEY = "tambaqu-phase4-demo-state-v1";
const TEN_MINUTES = 10 * 60 * 1_000;

interface PersistedDemoState {
  alerts: Alert[];
  actions: ActionLog[];
  readingHistory: Record<string, SensorReading[]>;
  risks: Record<string, RiskAssessment>;
  devices: Record<string, SensorDevice>;
  sequence: number;
}

const listeners = new Set<() => void>();
let revision = 0;

function clone<T>(value: T): T {
  return structuredClone(value);
}

function buildContributors(step: DemoScenarioStep): RiskContributor[] {
  if (step.riskLevel === "safe") {
    return [
      {
        parameter: "dissolvedOxygen",
        contribution: 45,
        direction: "stable",
        explanation: "DO berada dalam rentang operasional pada data simulasi.",
      },
      {
        parameter: "weatherContext",
        contribution: 55,
        direction: "stable",
        explanation: "Konteks cuaca demo tidak menambah risiko signifikan.",
      },
    ];
  }

  if (step.riskLevel === "critical") {
    return [
      {
        parameter: "dissolvedOxygen",
        contribution: 48,
        direction: "down",
        explanation: "DO rendah menjadi kontributor terbesar pada data simulasi.",
      },
      {
        parameter: "ammonia",
        contribution: 30,
        direction: "up",
        explanation: "Amonia meningkat bersamaan dengan penurunan DO.",
      },
      {
        parameter: "nitrite",
        contribution: 22,
        direction: "up",
        explanation: "Nitrit menambah indikator risiko kualitas air.",
      },
    ];
  }

  return [
    {
      parameter: "dissolvedOxygen",
      contribution: 42,
      direction: "down",
      explanation: "DO menunjukkan tren menurun pada data simulasi.",
    },
    {
      parameter: "ammonia",
      contribution: 27,
      direction: "up",
      explanation: "Amonia meningkat pada periode monitoring yang sama.",
    },
    {
      parameter: "temperature",
      contribution: 18,
      direction: "up",
      explanation: "Suhu air ikut memengaruhi konteks operasional.",
    },
    {
      parameter: "weatherContext",
      contribution: 13,
      direction: "stable",
      explanation: "Konteks cuaca digunakan sebagai faktor pendukung simulasi.",
    },
  ];
}

function buildRisk(
  pondId: string,
  step: DemoScenarioStep,
  timestamp: string,
): RiskAssessment {
  return {
    id: `risk-${pondId}`,
    pondId,
    timestamp,
    score: step.riskScore,
    level: step.riskLevel,
    confidence: step.riskLevel === "critical" ? 0.86 : 0.82,
    contributors: buildContributors(step),
    summary: step.riskSummary,
  };
}

function buildStableHistory(pondId: string, step: DemoScenarioStep) {
  const now = Date.parse(DEMO_NOW);
  const base = step.reading as Omit<SensorReading, "id" | "pondId" | "timestamp">;
  return Array.from({ length: 25 }, (_, index): SensorReading => {
    const hourAgo = 24 - index;
    const wave = Math.sin((index * Math.PI) / 6);
    return {
      id: `${pondId}-stable-${index}`,
      pondId,
      timestamp: new Date(now - hourAgo * 3_600_000).toISOString(),
      dissolvedOxygen: Number((base.dissolvedOxygen + wave * 0.08).toFixed(1)),
      ph: Number((base.ph + wave * 0.04).toFixed(1)),
      temperature: Number((base.temperature + wave * 0.2).toFixed(1)),
      salinity: Number((base.salinity + wave * 0.2).toFixed(1)),
      ammonia: Number(Math.max(0, base.ammonia + wave * 0.002).toFixed(2)),
      nitrite: Number(Math.max(0, base.nitrite + wave * 0.002).toFixed(2)),
    };
  });
}

function createInitialState(): PersistedDemoState {
  const stable = getStableStep();
  const bDevice = demoDevices.find((device) => device.pondId === "pond-b");
  if (!bDevice) throw new Error("Perangkat demo Kolam B tidak ditemukan.");

  return {
    alerts: clone(
      demoAlerts.filter(
        (alert) => alert.pondId !== "pond-b" || alert.status === "resolved",
      ),
    ),
    actions: clone(demoActions),
    readingHistory: { "pond-b": buildStableHistory("pond-b", stable) },
    risks: { "pond-b": buildRisk("pond-b", stable, DEMO_NOW) },
    devices: {
      "pond-b": {
        ...clone(bDevice),
        connectionStatus: "online",
        healthStatus: "healthy",
        signalStrength: "good",
        batteryPercentage: 83,
        lastSyncAt: DEMO_NOW,
      },
    },
    sequence: 0,
  };
}

function readStoredState() {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PersistedDemoState) : null;
  } catch {
    return null;
  }
}

let state = readStoredState() ?? createInitialState();

function persistAndNotify() {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }
  revision += 1;
  listeners.forEach((listener) => listener());
}

function allRisks() {
  return demoRisks.map((risk) => state.risks[risk.pondId] ?? risk);
}

export function subscribeDemoRepository(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getDemoRepositoryRevision() {
  return revision;
}

export function resetMockDemoState() {
  state = createInitialState();
  persistAndNotify();
}

export function applySimulationStep(
  scenario: DemoScenario,
  step: DemoScenarioStep,
  stepIndex: number,
) {
  const pondId = scenario.pondId;
  const previous =
    state.readingHistory[pondId]?.at(-1) ??
    demoReadings.filter((reading) => reading.pondId === pondId).at(-1);
  if (!previous) throw new Error(`Data sensor ${pondId} tidak ditemukan.`);

  const sequence = state.sequence + 1;
  const timestamp = new Date(
    Date.parse(DEMO_NOW) + sequence * TEN_MINUTES,
  ).toISOString();
  const reading: SensorReading = {
    ...previous,
    ...step.reading,
    id: `${pondId}-${scenario.id}-${stepIndex}-${sequence}`,
    pondId,
    timestamp,
  };
  const baseDevice =
    state.devices[pondId] ??
    demoDevices.find((device) => device.pondId === pondId);
  if (!baseDevice) throw new Error(`Perangkat ${pondId} tidak ditemukan.`);

  const device: SensorDevice = {
    ...baseDevice,
    connectionStatus: step.connectionStatus ?? baseDevice.connectionStatus,
    healthStatus: step.healthStatus ?? baseDevice.healthStatus,
    signalStrength: step.signalStrength ?? baseDevice.signalStrength,
    lastSyncAt:
      step.connectionStatus === "offline" ? baseDevice.lastSyncAt : timestamp,
  };
  const alert = step.alert
    ? ({
        ...step.alert,
        pondId,
        timestamp,
        status: "new",
        riskAssessmentId: `risk-${pondId}`,
      } satisfies Alert)
    : null;

  state = {
    ...state,
    sequence,
    readingHistory: {
      ...state.readingHistory,
      [pondId]: [...(state.readingHistory[pondId] ?? []), reading],
    },
    risks: { ...state.risks, [pondId]: buildRisk(pondId, step, timestamp) },
    devices: { ...state.devices, [pondId]: device },
    alerts:
      alert && !state.alerts.some((item) => item.id === alert.id)
        ? [alert, ...state.alerts]
        : state.alerts,
  };
  persistAndNotify();
}

export class MockFarmRepository implements FarmRepository {
  async getById(id: string) {
    return id === demoFarm.id ? clone(demoFarm) : null;
  }
}

export class MockPondRepository implements PondRepository {
  async getByFarmId(farmId: string) {
    return clone(demoPonds.filter((pond) => pond.farmId === farmId));
  }

  async getById(id: string) {
    return clone(demoPonds.find((pond) => pond.id === id) ?? null);
  }
}

export class MockSensorRepository implements SensorRepository {
  async getDeviceByPondId(pondId: string) {
    return clone(
      state.devices[pondId] ??
        demoDevices.find((device) => device.pondId === pondId) ??
        null,
    );
  }

  async getDevicesByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return clone(
      demoDevices
        .filter((device) => pondIds.has(device.pondId))
        .map((device) => state.devices[device.pondId] ?? device),
    );
  }

  async getCurrentReading(pondId: string) {
    return clone(
      state.readingHistory[pondId]?.at(-1) ??
        demoReadings.filter((reading) => reading.pondId === pondId).at(-1) ??
        null,
    );
  }

  async getHistory(pondId: string, hours: number) {
    const history =
      state.readingHistory[pondId] ??
      demoReadings.filter((reading) => reading.pondId === pondId);
    const cutoff = Date.parse(history.at(-1)?.timestamp ?? DEMO_NOW) - hours * 3_600_000;
    return clone(history.filter((reading) => Date.parse(reading.timestamp) >= cutoff));
  }
}

export class MockRiskRepository implements RiskRepository {
  async getCurrentByPondId(pondId: string) {
    return clone(
      state.risks[pondId] ??
        demoRisks.find((risk) => risk.pondId === pondId) ??
        null,
    );
  }

  async getCurrentByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return clone(allRisks().filter((risk) => pondIds.has(risk.pondId)));
  }

  async getRecommendations(riskAssessmentId: string) {
    const risk = allRisks().find((item) => item.id === riskAssessmentId);
    return risk ? clone(generateRecommendations(risk)) : [];
  }
}

export class MockAlertRepository implements AlertRepository {
  async getByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return clone(state.alerts.filter((alert) => pondIds.has(alert.pondId)));
  }

  async getByPondId(pondId: string) {
    return clone(state.alerts.filter((alert) => alert.pondId === pondId));
  }

  async getById(id: string) {
    return clone(state.alerts.find((alert) => alert.id === id) ?? null);
  }

  async acknowledge(id: string, userId: string, timestamp: string) {
    const alert = state.alerts.find((item) => item.id === id);
    if (!alert) throw new Error("Alert tidak ditemukan.");
    const updated = acknowledgeAlertRecord(alert, userId, timestamp);
    state = {
      ...state,
      alerts: state.alerts.map((item) => (item.id === id ? updated : item)),
    };
    persistAndNotify();
    return clone(updated);
  }

  async resolve(id: string, userId: string, timestamp: string) {
    const alert = state.alerts.find((item) => item.id === id);
    if (!alert) throw new Error("Alert tidak ditemukan.");
    const updated = resolveAlertRecord(alert, userId, timestamp);
    state = {
      ...state,
      alerts: state.alerts.map((item) => (item.id === id ? updated : item)),
    };
    persistAndNotify();
    return clone(updated);
  }
}

export class MockActionRepository implements ActionRepository {
  async getByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return clone(state.actions.filter((action) => pondIds.has(action.pondId)));
  }

  async getByPondId(pondId: string) {
    return clone(state.actions.filter((action) => action.pondId === pondId));
  }

  async getByRecommendationId(recommendationId: string) {
    return clone(
      state.actions.find((action) => action.recommendationId === recommendationId) ??
        null,
    );
  }

  async add(action: ActionLog) {
    const existing = state.actions.find(
      (item) => item.recommendationId === action.recommendationId,
    );
    if (existing) return clone(existing);
    state = { ...state, actions: [action, ...state.actions] };
    persistAndNotify();
    return clone(action);
  }
}

export { demoUser };
