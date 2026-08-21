import type { Recommendation } from "../../domain/risk";
import { demoFarm } from "../../data/mock/fixtures";
import { remoteRepositories } from "../../data/repositories/remote";
import { emitOfflineRepositoryChange } from "../../data/repositories/revision";
import { offlineDb } from "./db";
import { useConnectivityStore } from "../../store/connectivity-store";

const INITIALIZED_KEY = "initialized";
const LAST_SYNCED_KEY = "lastSyncedAt";
const MAX_SENSOR_RECORDS_PER_POND = 720;
let initialization: Promise<boolean> | null = null;
let seedSuppressed = false;

async function captureRemoteSnapshot() {
  const [farm, ponds, risks, alerts, actions, devices] = await Promise.all([
    remoteRepositories.farm.getById(demoFarm.id),
    remoteRepositories.pond.getByFarmId(demoFarm.id),
    remoteRepositories.risk.getCurrentByFarmId(demoFarm.id),
    remoteRepositories.alert.getByFarmId(demoFarm.id),
    remoteRepositories.action.getByFarmId(demoFarm.id),
    remoteRepositories.sensor.getDevicesByFarmId(demoFarm.id),
  ]);
  const histories = await Promise.all(
    ponds.map((pond) => remoteRepositories.sensor.getHistory(pond.id, 720)),
  );
  const recommendationGroups = await Promise.all(
    risks.map((risk) => remoteRepositories.risk.getRecommendations(risk.id)),
  );
  return {
    farm,
    ponds,
    risks,
    alerts,
    actions,
    devices,
    readings: histories.flat(),
    recommendations: recommendationGroups.flat() as Recommendation[],
  };
}

async function trimSensorHistory() {
  const ponds = await offlineDb.ponds.toArray();
  await Promise.all(
    ponds.map(async (pond) => {
      const rows = await offlineDb.sensorReadings
        .where("pondId")
        .equals(pond.id)
        .sortBy("timestamp");
      const remove = rows.slice(0, Math.max(0, rows.length - MAX_SENSOR_RECORDS_PER_POND));
      if (remove.length) await offlineDb.sensorReadings.bulkDelete(remove.map((item) => item.id));
    }),
  );
}

async function hasValidOfflineSnapshot() {
  const [farm, ponds, risks, devices, readingCount] = await Promise.all([
    offlineDb.farms.get(demoFarm.id),
    offlineDb.ponds.where("farmId").equals(demoFarm.id).toArray(),
    offlineDb.riskAssessments.toArray(),
    offlineDb.devices.toArray(),
    offlineDb.sensorReadings.count(),
  ]);
  return Boolean(
    farm?.name &&
      ponds.length === demoFarm.pondIds.length &&
      readingCount > 0 &&
      risks.length >= ponds.length &&
      risks.every(
        (risk) =>
          typeof risk.score === "number" && Array.isArray(risk.contributors),
      ) &&
      devices.length >= ponds.length &&
      devices.every(
        (device) =>
          typeof device.lastSyncAt === "string" &&
          typeof device.connectionStatus === "string",
      ),
  );
}

export async function persistRemoteSnapshot() {
  seedSuppressed = false;
  const snapshot = await captureRemoteSnapshot();
  const timestamp = new Date().toISOString();
  await offlineDb.transaction(
    "rw",
    [
      offlineDb.farms,
      offlineDb.ponds,
      offlineDb.sensorReadings,
      offlineDb.riskAssessments,
      offlineDb.alerts,
      offlineDb.recommendations,
      offlineDb.actionLogs,
      offlineDb.devices,
      offlineDb.syncMeta,
    ],
    async () => {
      if (snapshot.farm) await offlineDb.farms.put(snapshot.farm);
      await Promise.all([
        offlineDb.ponds.bulkPut(snapshot.ponds),
        offlineDb.sensorReadings.bulkPut(snapshot.readings),
        offlineDb.riskAssessments.bulkPut(snapshot.risks),
        offlineDb.alerts.bulkPut(snapshot.alerts),
        offlineDb.recommendations.bulkPut(snapshot.recommendations),
        offlineDb.actionLogs.bulkPut(snapshot.actions),
        offlineDb.devices.bulkPut(snapshot.devices),
        offlineDb.syncMeta.put({ key: INITIALIZED_KEY, value: "true", updatedAt: timestamp }),
        offlineDb.syncMeta.put({ key: LAST_SYNCED_KEY, value: timestamp, updatedAt: timestamp }),
      ]);
    },
  );
  await trimSensorHistory();
  emitOfflineRepositoryChange();
  useConnectivityStore.getState().markSynced(timestamp, "Data lokal diperbarui.");
}

export function initializeOfflineDatabase() {
  if (seedSuppressed) return Promise.resolve(false);
  if (initialization) return initialization;
  initialization = (async () => {
    try {
      await offlineDb.open();
      const initialized = await offlineDb.syncMeta.get(INITIALIZED_KEY);
      if (!initialized || !(await hasValidOfflineSnapshot())) {
        await persistRemoteSnapshot();
      }
      useConnectivityStore.getState().setHydration("ready", true);
      return true;
    } catch {
      useConnectivityStore.getState().setHydration("error", false);
      return false;
    }
  })();
  return initialization;
}

export async function clearOfflineData() {
  await offlineDb.transaction(
    "rw",
    offlineDb.tables,
    async () => Promise.all(offlineDb.tables.map((table) => table.clear())),
  );
  initialization = null;
  seedSuppressed = true;
  emitOfflineRepositoryChange();
}

export async function resetOfflineDataFromRemote() {
  await clearOfflineData();
  seedSuppressed = false;
  await initializeOfflineDatabase();
}

export async function getOfflineStorageEstimate() {
  if (typeof navigator === "undefined" || !navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}
