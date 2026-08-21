import {
  applySimulationStep,
  resetMockDemoState,
} from "./mock";
import { createOfflineFirstRepositories } from "./offlineFirst";
import { remoteRepositories } from "./remote";
import { getRepositoryRevision, subscribeRepository } from "./revision";
import { resetOfflineDataFromRemote } from "../../services/offline/persistenceService";
import { useConnectivityStore } from "../../store/connectivity-store";

export const repositories = createOfflineFirstRepositories(remoteRepositories);

export function resetDemoData() {
  resetMockDemoState();
  void resetOfflineDataFromRemote().catch(() =>
    useConnectivityStore.getState().setHydration("error", false),
  );
}
export {
  applySimulationStep,
  getRepositoryRevision,
  subscribeRepository,
};

export type {
  ActionRepository,
  AlertRepository,
  FarmRepository,
  PondRepository,
  RiskRepository,
  SensorRepository,
} from "./contracts";
