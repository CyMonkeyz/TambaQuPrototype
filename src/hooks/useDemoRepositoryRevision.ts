import { useSyncExternalStore } from "react";
import { getRepositoryRevision, subscribeRepository } from "../data/repositories";

export function useDemoRepositoryRevision() {
  return useSyncExternalStore(
    subscribeRepository,
    getRepositoryRevision,
    getRepositoryRevision,
  );
}
