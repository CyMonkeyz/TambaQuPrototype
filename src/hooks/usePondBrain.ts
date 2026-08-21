import { repositories } from "../data/repositories";
import type { ActionLog } from "../domain/action";
import type { Alert } from "../domain/alert";
import type { Pond } from "../domain/pond";
import type { Recommendation, RiskAssessment } from "../domain/risk";
import type { SensorDevice, SensorReading } from "../domain/sensor";
import { useRepositoryData } from "./useRepositoryData";
import { useDemoRepositoryRevision } from "./useDemoRepositoryRevision";

export interface PondBrainData {
  pond: Pond;
  reading: SensorReading;
  history: SensorReading[];
  device: SensorDevice;
  risk: RiskAssessment;
  recommendations: Recommendation[];
  actions: ActionLog[];
  alerts: Alert[];
}

async function loadPondBrainData(
  pondId: string,
): Promise<PondBrainData | null> {
  const [pond, reading, history, device, risk, actions, alerts] =
    await Promise.all([
      repositories.pond.getById(pondId),
      repositories.sensor.getCurrentReading(pondId),
      repositories.sensor.getHistory(pondId, 168),
      repositories.sensor.getDeviceByPondId(pondId),
      repositories.risk.getCurrentByPondId(pondId),
      repositories.action.getByPondId(pondId),
      repositories.alert.getByPondId(pondId),
    ]);
  if (!pond || !reading || !device || !risk) return null;
  const recommendations = await repositories.risk.getRecommendations(risk.id);
  return {
    pond,
    reading,
    history,
    device,
    risk,
    recommendations,
    actions,
    alerts,
  };
}

export function usePondBrain(pondId: string) {
  const revision = useDemoRepositoryRevision();
  return useRepositoryData(
    () => loadPondBrainData(pondId),
    `${pondId}:${revision}`,
  );
}
