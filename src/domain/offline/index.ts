export type DataSource = "simulation" | "api";
export type DataFreshnessMode = "current" | "cached";
export type ConnectivityMode = "online" | "offline" | "degraded";
export type DemoConnectivityOverride = "auto" | ConnectivityMode;
export type SyncState = "idle" | "syncing" | "error";
export type HydrationState = "initializing" | "ready" | "error";

export type OutboxOperation =
  | "ACTION_LOG_CREATE"
  | "ALERT_ACKNOWLEDGE"
  | "ALERT_RESOLVE";
export type OutboxStatus = "pending" | "processing" | "failed";

export interface OutboxItem {
  id: string;
  clientMutationId: string;
  entityType: "actionLog" | "alert";
  entityId: string;
  operation: OutboxOperation;
  payload: unknown;
  createdAt: string;
  attemptCount: number;
  status: OutboxStatus;
  lastAttemptAt?: string;
  lastError?: string;
}

export interface SyncMetaRecord {
  key: string;
  value: string;
  updatedAt: string;
}
