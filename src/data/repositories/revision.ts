import {
  getDemoRepositoryRevision,
  subscribeDemoRepository,
} from "./mock";

const offlineListeners = new Set<() => void>();
let offlineRevision = 0;

export function emitOfflineRepositoryChange() {
  offlineRevision += 1;
  offlineListeners.forEach((listener) => listener());
}

export function subscribeRepository(listener: () => void) {
  const unsubscribeDemo = subscribeDemoRepository(listener);
  offlineListeners.add(listener);
  return () => {
    unsubscribeDemo();
    offlineListeners.delete(listener);
  };
}

export function getRepositoryRevision() {
  return getDemoRepositoryRevision() * 1_000_000 + offlineRevision;
}
