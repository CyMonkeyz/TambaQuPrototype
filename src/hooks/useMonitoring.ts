import { repositories } from "../data/repositories";
import type {
  FarmMonitoringData,
  PondMonitoringDetail,
  PondMonitoringOverview,
} from "../domain/monitoring";
import { useRepositoryData } from "./useRepositoryData";

async function loadPondOverview(
  pondId: string,
): Promise<PondMonitoringOverview | null> {
  const [pond, reading, history, risk, device] = await Promise.all([
    repositories.pond.getById(pondId),
    repositories.sensor.getCurrentReading(pondId),
    repositories.sensor.getHistory(pondId, 168),
    repositories.risk.getCurrentByPondId(pondId),
    repositories.sensor.getDeviceByPondId(pondId),
  ]);
  return pond && reading && risk && device
    ? { pond, reading, history, risk, device }
    : null;
}

async function loadFarmMonitoring(farmId: string): Promise<FarmMonitoringData> {
  const [ponds, alerts] = await Promise.all([
    repositories.pond.getByFarmId(farmId),
    repositories.alert.getByFarmId(farmId),
  ]);
  const overviews = await Promise.all(
    ponds.map((pond) => loadPondOverview(pond.id)),
  );
  return {
    ponds: overviews.filter(
      (item): item is PondMonitoringOverview => item !== null,
    ),
    alerts,
  };
}

async function loadPondMonitoring(
  pondId: string,
): Promise<PondMonitoringDetail | null> {
  const [overview, alerts] = await Promise.all([
    loadPondOverview(pondId),
    repositories.alert.getByPondId(pondId),
  ]);
  return overview ? { ...overview, alerts } : null;
}

export function useFarmMonitoring(farmId: string) {
  return useRepositoryData(() => loadFarmMonitoring(farmId), farmId);
}

export function usePondMonitoring(pondId: string) {
  return useRepositoryData(() => loadPondMonitoring(pondId), pondId);
}
