import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import {
  acknowledgeAlertRecord,
  resolveAlertRecord,
} from "../../services/alert/alertService";
import { generateRecommendations } from "../../services/recommendation/recommendationEngine";
import {
  demoActions,
  demoAlerts,
  demoDevices,
  demoFarm,
  demoPonds,
  demoReadings,
  demoRisks,
} from "../mock/fixtures";
import type {
  ActionRepository,
  AlertRepository,
  FarmRepository,
  PondRepository,
  RiskRepository,
  SensorRepository,
} from "./contracts";

const DEMO_STATE_KEY = "tambaqu-phase3-demo-state-v1";

interface PersistedDemoState {
  alerts: Alert[];
  actions: ActionLog[];
}

function getInitialState(): PersistedDemoState {
  if (typeof window !== "undefined") {
    try {
      const saved = window.localStorage.getItem(DEMO_STATE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<PersistedDemoState>;
        if (Array.isArray(parsed.alerts) && Array.isArray(parsed.actions)) {
          return { alerts: parsed.alerts, actions: parsed.actions };
        }
      }
    } catch {
      // Fall back to deterministic fixtures when local demo state is invalid.
    }
  }
  return { alerts: [...demoAlerts], actions: [...demoActions] };
}

let demoState = getInitialState();

function persistDemoState() {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEMO_STATE_KEY, JSON.stringify(demoState));
}

export function resetMockDemoState() {
  demoState = { alerts: [...demoAlerts], actions: [...demoActions] };
  persistDemoState();
}

export class MockFarmRepository implements FarmRepository {
  async getById(id: string) {
    return id === demoFarm.id ? demoFarm : null;
  }
}

export class MockPondRepository implements PondRepository {
  async getByFarmId(farmId: string) {
    return demoPonds.filter((pond) => pond.farmId === farmId);
  }
  async getById(id: string) {
    return demoPonds.find((pond) => pond.id === id) ?? null;
  }
}

export class MockSensorRepository implements SensorRepository {
  async getDeviceByPondId(pondId: string) {
    return demoDevices.find((device) => device.pondId === pondId) ?? null;
  }
  async getDevicesByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return demoDevices.filter((device) => pondIds.has(device.pondId));
  }
  async getCurrentReading(pondId: string) {
    return (
      demoReadings.filter((reading) => reading.pondId === pondId).at(-1) ?? null
    );
  }
  async getHistory(pondId: string, hours: number) {
    return demoReadings
      .filter((reading) => reading.pondId === pondId)
      .slice(-(hours + 1));
  }
}

export class MockRiskRepository implements RiskRepository {
  async getCurrentByPondId(pondId: string) {
    return demoRisks.find((risk) => risk.pondId === pondId) ?? null;
  }
  async getCurrentByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return demoRisks.filter((risk) => pondIds.has(risk.pondId));
  }
  async getRecommendations(riskAssessmentId: string) {
    const assessment = demoRisks.find((risk) => risk.id === riskAssessmentId);
    return assessment ? generateRecommendations(assessment) : [];
  }
}

export class MockAlertRepository implements AlertRepository {
  async getByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return demoState.alerts.filter((alert) => pondIds.has(alert.pondId));
  }
  async getByPondId(pondId: string) {
    return demoState.alerts.filter((alert) => alert.pondId === pondId);
  }
  async getById(id: string) {
    return demoState.alerts.find((alert) => alert.id === id) ?? null;
  }
  async acknowledge(id: string, userId: string, timestamp: string) {
    const alert = demoState.alerts.find((item) => item.id === id);
    if (!alert) throw new Error("Alert tidak ditemukan");
    const updated = acknowledgeAlertRecord(alert, userId, timestamp);
    demoState = {
      ...demoState,
      alerts: demoState.alerts.map((item) => (item.id === id ? updated : item)),
    };
    persistDemoState();
    return updated;
  }
  async resolve(id: string, userId: string, timestamp: string) {
    const alert = demoState.alerts.find((item) => item.id === id);
    if (!alert) throw new Error("Alert tidak ditemukan");
    const updated = resolveAlertRecord(alert, userId, timestamp);
    demoState = {
      ...demoState,
      alerts: demoState.alerts.map((item) => (item.id === id ? updated : item)),
    };
    persistDemoState();
    return updated;
  }
}

export class MockActionRepository implements ActionRepository {
  async getByFarmId(farmId: string) {
    const pondIds = new Set(
      demoPonds.filter((pond) => pond.farmId === farmId).map((pond) => pond.id),
    );
    return demoState.actions.filter((action) => pondIds.has(action.pondId));
  }
  async getByPondId(pondId: string) {
    return demoState.actions.filter((action) => action.pondId === pondId);
  }
  async getByRecommendationId(recommendationId: string) {
    return (
      demoState.actions.find(
        (action) => action.recommendationId === recommendationId,
      ) ?? null
    );
  }
  async add(action: ActionLog) {
    const duplicate = demoState.actions.some(
      (item) => item.recommendationId === action.recommendationId,
    );
    if (duplicate) throw new Error("Tindakan sudah tercatat");
    demoState = { ...demoState, actions: [action, ...demoState.actions] };
    persistDemoState();
    return action;
  }
}
