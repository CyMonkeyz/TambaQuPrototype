export type ActionSyncStatus = "synced" | "pending" | "failed";

export interface ActionLog {
  id: string;
  pondId: string;
  recommendationId: string;
  actionTitle: string;
  performedBy: string;
  performedAt: string;
  notes: string;
  syncStatus: ActionSyncStatus;
}
