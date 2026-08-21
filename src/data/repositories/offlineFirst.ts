import type { ActionLog } from "../../domain/action";
import type { Alert } from "../../domain/alert";
import type { OutboxItem } from "../../domain/offline";
import { acknowledgeAlertRecord, resolveAlertRecord } from "../../services/alert/alertService";
import { initializeOfflineDatabase } from "../../services/offline/persistenceService";
import { offlineDb } from "../../services/offline/db";
import { createOutboxItem, refreshSyncCounts } from "../../services/sync/outboxRepository";
import { isDataConnectionAvailable } from "../../store/connectivity-store";
import { emitOfflineRepositoryChange } from "./revision";
import type {
  ActionRepository,
  AlertRepository,
  FarmRepository,
  PondRepository,
  RiskRepository,
  SensorRepository,
} from "./contracts";
import type { remoteRepositories as RemoteRepositories } from "./remote";

type RemoteContainer = typeof RemoteRepositories;

async function localReady() {
  return initializeOfflineDatabase();
}

export function createOfflineFirstRepositories(remote: RemoteContainer) {
  class OfflineFarmRepository implements FarmRepository {
    async getById(id: string) {
      if (await localReady()) return (await offlineDb.farms.get(id)) ?? remote.farm.getById(id);
      return remote.farm.getById(id);
    }
  }

  class OfflinePondRepository implements PondRepository {
    async getByFarmId(farmId: string) {
      if (await localReady()) {
        const local = await offlineDb.ponds.where("farmId").equals(farmId).toArray();
        if (local.length) return local;
      }
      return remote.pond.getByFarmId(farmId);
    }

    async getById(id: string) {
      if (await localReady()) return (await offlineDb.ponds.get(id)) ?? remote.pond.getById(id);
      return remote.pond.getById(id);
    }
  }

  class OfflineSensorRepository implements SensorRepository {
    async getDeviceByPondId(pondId: string) {
      if (await localReady()) {
        const local = await offlineDb.devices.where("pondId").equals(pondId).first();
        if (local) return local;
      }
      return remote.sensor.getDeviceByPondId(pondId);
    }

    async getDevicesByFarmId(farmId: string) {
      if (await localReady()) {
        const pondIds = new Set((await offlineDb.ponds.where("farmId").equals(farmId).toArray()).map((pond) => pond.id));
        const local = (await offlineDb.devices.toArray()).filter((device) => pondIds.has(device.pondId));
        if (local.length) return local;
      }
      return remote.sensor.getDevicesByFarmId(farmId);
    }

    async getCurrentReading(pondId: string) {
      if (await localReady()) {
        const rows = await offlineDb.sensorReadings.where("pondId").equals(pondId).sortBy("timestamp");
        if (rows.length) return rows.at(-1) ?? null;
      }
      return remote.sensor.getCurrentReading(pondId);
    }

    async getHistory(pondId: string, hours: number) {
      if (await localReady()) {
        const rows = await offlineDb.sensorReadings.where("pondId").equals(pondId).sortBy("timestamp");
        if (rows.length) {
          const cutoff = Date.parse(rows.at(-1)?.timestamp ?? "") - hours * 3_600_000;
          return rows.filter((reading) => Date.parse(reading.timestamp) >= cutoff);
        }
      }
      return remote.sensor.getHistory(pondId, hours);
    }
  }

  class OfflineRiskRepository implements RiskRepository {
    async getCurrentByPondId(pondId: string) {
      if (await localReady()) {
        const rows = await offlineDb.riskAssessments.where("pondId").equals(pondId).sortBy("timestamp");
        if (rows.length) return rows.at(-1) ?? null;
      }
      return remote.risk.getCurrentByPondId(pondId);
    }

    async getCurrentByFarmId(farmId: string) {
      if (await localReady()) {
        const pondIds = new Set((await offlineDb.ponds.where("farmId").equals(farmId).toArray()).map((pond) => pond.id));
        const local = (await offlineDb.riskAssessments.toArray()).filter((risk) => pondIds.has(risk.pondId));
        if (local.length) return local;
      }
      return remote.risk.getCurrentByFarmId(farmId);
    }

    async getRecommendations(riskAssessmentId: string) {
      if (await localReady()) {
        const local = await offlineDb.recommendations.where("riskAssessmentId").equals(riskAssessmentId).toArray();
        if (local.length) return local;
      }
      return remote.risk.getRecommendations(riskAssessmentId);
    }
  }

  async function farmPondIds(farmId: string) {
    return new Set((await offlineDb.ponds.where("farmId").equals(farmId).toArray()).map((pond) => pond.id));
  }

  class OfflineAlertRepository implements AlertRepository {
    async getByFarmId(farmId: string) {
      if (await localReady()) {
        const pondIds = await farmPondIds(farmId);
        const local = (await offlineDb.alerts.toArray()).filter((alert) => pondIds.has(alert.pondId));
        if (local.length) return local;
      }
      return remote.alert.getByFarmId(farmId);
    }

    async getByPondId(pondId: string) {
      if (await localReady()) {
        const local = await offlineDb.alerts.where("pondId").equals(pondId).toArray();
        if (local.length) return local;
      }
      return remote.alert.getByPondId(pondId);
    }

    async getById(id: string) {
      if (await localReady()) return (await offlineDb.alerts.get(id)) ?? remote.alert.getById(id);
      return remote.alert.getById(id);
    }

    async acknowledge(id: string, userId: string, timestamp: string) {
      if (isDataConnectionAvailable()) {
        const result = await remote.alert.acknowledge(id, userId, timestamp);
        if (await localReady()) await offlineDb.alerts.put(result);
        emitOfflineRepositoryChange();
        return result;
      }
      const alert = (await offlineDb.alerts.get(id)) ?? (await remote.alert.getById(id));
      if (!alert) throw new Error("Alert tidak ditemukan.");
      const updated = acknowledgeAlertRecord(alert, userId, timestamp);
      const outbox = createOutboxItem("ALERT_ACKNOWLEDGE", "alert", id, { id, userId, timestamp }, timestamp);
      await saveAlertWithOutbox(updated, outbox);
      return updated;
    }

    async resolve(id: string, userId: string, timestamp: string) {
      if (isDataConnectionAvailable()) {
        const result = await remote.alert.resolve(id, userId, timestamp);
        if (await localReady()) await offlineDb.alerts.put(result);
        emitOfflineRepositoryChange();
        return result;
      }
      const alert = (await offlineDb.alerts.get(id)) ?? (await remote.alert.getById(id));
      if (!alert) throw new Error("Alert tidak ditemukan.");
      const updated = resolveAlertRecord(alert, userId, timestamp);
      const outbox = createOutboxItem("ALERT_RESOLVE", "alert", id, { id, userId, timestamp }, timestamp);
      await saveAlertWithOutbox(updated, outbox);
      return updated;
    }
  }

  async function saveAlertWithOutbox(alert: Alert, outbox: OutboxItem) {
    await offlineDb.transaction("rw", [offlineDb.alerts, offlineDb.outbox], async () => {
      await offlineDb.alerts.put(alert);
      if (!(await offlineDb.outbox.get(outbox.id))) await offlineDb.outbox.put(outbox);
    });
    await refreshSyncCounts();
    emitOfflineRepositoryChange();
  }

  class OfflineActionRepository implements ActionRepository {
    async getByFarmId(farmId: string) {
      if (await localReady()) {
        const pondIds = await farmPondIds(farmId);
        const local = (await offlineDb.actionLogs.toArray()).filter((action) => pondIds.has(action.pondId));
        if (local.length) return local;
      }
      return remote.action.getByFarmId(farmId);
    }

    async getByPondId(pondId: string) {
      if (await localReady()) {
        const local = await offlineDb.actionLogs.where("pondId").equals(pondId).toArray();
        if (local.length) return local;
      }
      return remote.action.getByPondId(pondId);
    }

    async getByRecommendationId(recommendationId: string) {
      if (await localReady()) {
        const local = await offlineDb.actionLogs.filter((action) => action.recommendationId === recommendationId).first();
        if (local) return local;
      }
      return remote.action.getByRecommendationId(recommendationId);
    }

    async add(action: ActionLog) {
      if (isDataConnectionAvailable()) {
        const syncedAction = { ...action, syncStatus: "synced" as const };
        const result = await remote.action.add(syncedAction);
        if (await localReady()) await offlineDb.actionLogs.put(result);
        emitOfflineRepositoryChange();
        return result;
      }
      const pendingAction = { ...action, syncStatus: "pending" as const };
      const outbox = createOutboxItem("ACTION_LOG_CREATE", "actionLog", action.id, pendingAction, action.performedAt);
      await offlineDb.transaction("rw", [offlineDb.actionLogs, offlineDb.outbox], async () => {
        await offlineDb.actionLogs.put(pendingAction);
        if (!(await offlineDb.outbox.get(outbox.id))) await offlineDb.outbox.put(outbox);
      });
      await refreshSyncCounts();
      emitOfflineRepositoryChange();
      return pendingAction;
    }
  }

  return {
    farm: new OfflineFarmRepository(),
    pond: new OfflinePondRepository(),
    sensor: new OfflineSensorRepository(),
    risk: new OfflineRiskRepository(),
    alert: new OfflineAlertRepository(),
    action: new OfflineActionRepository(),
  };
}
